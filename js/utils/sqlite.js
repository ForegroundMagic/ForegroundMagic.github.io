import initSqlJs from "https://cdn.jsdelivr.net/npm/sql.js@1.9.0/dist/sql-wasm.js";

let dbPromise;

async function getDatabase() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const [SQL, response] = await Promise.all([
        initSqlJs({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.9.0/dist/${file}` }),
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
    "SELECT product_id, product_code, product_name FROM products ORDER BY product_name"
  ));
  return rows.map((row) => ({
    ...row,
    product_id: Number(row.product_id)
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
    `SELECT color_code, color_name, preview_front_path, preview_back_path, button_96_path
     FROM product_color_assets
     WHERE product_id = $productId AND is_active = 1
     ORDER BY sort_order`,
    { $productId: product.product_id }
  ));

  return { product, colors };
}
