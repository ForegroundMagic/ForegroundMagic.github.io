// Use the asm.js build so the database can load without requiring COOP/COEP headers.
const SQL_JS_VERSION = "1.9.0";
const SQL_JS_BASE_URL = `https://cdn.jsdelivr.net/npm/sql.js@${SQL_JS_VERSION}/dist`;

let sqlJsInitPromise;
let dbPromise;

async function getSqlJsModule() {
  if (!sqlJsInitPromise) {
    sqlJsInitPromise = (async () => {
      const options = { locateFile: (file) => `${SQL_JS_BASE_URL}/${file}` };

      try {
        const module = await import(`${SQL_JS_BASE_URL}/sql-asm.js`);
        if (typeof module?.default === "function") {
          return module.default(options);
        }
      }
      catch (error) {
        console.warn("Falling back to global sql.js loader", error);
      }

      if (typeof window === "undefined") {
        throw new Error("sql.js asm build requires a browser environment");
      }

      if (typeof window.initSqlJs !== "function") {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `${SQL_JS_BASE_URL}/sql-asm.js`;
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed loading sql.js asm script"));
          document.head.appendChild(script);
        });
      }

      if (typeof window.initSqlJs !== "function") {
        throw new Error("sql.js asm loader not available after script injection");
      }

      return window.initSqlJs(options);
    })();
  }
  return sqlJsInitPromise;
}

async function getDatabase() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const [SQL, response] = await Promise.all([
        getSqlJsModule(),
        fetch("/assets/database/product_media.db")
      ]);

      if (!response.ok) {
        throw new Error(`Failed to load database (${response.status})`);
      }

      const buffer = await response.arrayBuffer();
      return new SQL.Database(new Uint8Array(buffer));
    })();
  }
  return dbPromise;
}

function mapRows(result) {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

export async function getAllProducts() {
  const db = await getDatabase();
  const rows = mapRows(db.exec(
    `SELECT
       p.product_id,
       p.product_code,
       p.product_name,
       p.description,
       p.product_type_id,
       pt.type_name,
       ca.color_code   AS default_color_code,
       ca.preview_front_path AS default_preview_front_path
     FROM products p
     LEFT JOIN product_types pt ON pt.product_type_id = p.product_type_id
     LEFT JOIN product_default_color dc ON dc.product_id = p.product_id
     LEFT JOIN product_color_assets ca ON ca.color_asset_id = dc.color_asset_id
     ORDER BY p.product_name`
  ));
  return rows.map((row) => ({
    product_id: Number(row.product_id),
    product_code: row.product_code,
    product_name: row.product_name,
    description: row.description ?? "",
    product_type_id: row.product_type_id ? Number(row.product_type_id) : null,
    product_type_name: row.type_name ?? null,
    default_color_code: row.default_color_code ?? null,
    default_preview_front_path: row.default_preview_front_path ?? null
  }));
}

export async function getProductWithColors(productCode) {
  const db = await getDatabase();
  const productRows = mapRows(db.exec(
    "SELECT product_id, product_code, product_name FROM products WHERE product_code = $code LIMIT 1",
    { $code: productCode }
  ));

  if (!productRows.length) {
    throw new Error(`Product not found for code: ${productCode}`);
  }

  const product = { ...productRows[0], product_id: Number(productRows[0].product_id) };
  const colors = mapRows(db.exec(
    `SELECT color_code, color_name, preview_front_path, preview_back_path, button_96_path, button_300x80_path
     FROM product_color_assets
     WHERE product_id = $productId AND is_active = 1
     ORDER BY sort_order`,
    { $productId: product.product_id }
  ));

  const defaultColorRows = mapRows(db.exec(
    `SELECT ca.color_code
       FROM product_default_color dc
       JOIN product_color_assets ca ON ca.color_asset_id = dc.color_asset_id
      WHERE dc.product_id = $productId
      LIMIT 1`,
    { $productId: product.product_id }
  ));

  const defaultColorCode = defaultColorRows[0]?.color_code ?? null;

  return { product, colors, defaultColorCode };
}
