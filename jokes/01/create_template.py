from pathlib import Path

# ========= CONFIG =========
IMAGE_DIR = Path("images")        # directory containing .png files
OUTPUT_HTML = Path("template.html")
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
# ==========================

images = sorted(
    [p.name for p in IMAGE_DIR.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS]
)

html_parts = []

html_parts.append("""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Giant List of Jokes — TEMPLATE</title>
<style>
body{margin:0;background:#0f1115;color:#e9ecf1;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
main{max-width:1200px;margin:0 auto;padding:20px}
.page{display:grid;grid-template-columns:1fr 2fr;gap:20px;margin-bottom:30px;
padding:16px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:#141824}
.filename{grid-column:1/-1;font-size:13px;color:#9aa4b2}
img{width:100%;border-radius:8px;display:block}
.joke{padding:14px 0}
.joke + .joke{border-top:1px dashed rgba(255,255,255,.2)}
.setup{font-weight:700;margin:0 0 6px}
.punch{font-size:22px;font-weight:300;margin:0;color:#cfd6ff}
.placeholder{color:#8b93a7;font-style:italic}
</style>
</head>
<body>
<main>
""")

for filename in images:
    html_parts.append(f"""
<section class="page">
  <div class="filename">{filename}</div>
  <div>
    <img src="images/{filename}" alt="{filename}">
  </div>
  <div>
    <div class="joke">
      <p class="setup placeholder">JOKE SETUP (to be filled)</p>
      <p class="punch placeholder">Joke punchline (to be filled).</p>
    </div>
  </div>
</section>
""")

html_parts.append("""
</main>
</body>
</html>
""")

OUTPUT_HTML.write_text("".join(html_parts), encoding="utf-8")

print(f"Template created: {OUTPUT_HTML}")
print(f"Pages generated: {len(images)}")
