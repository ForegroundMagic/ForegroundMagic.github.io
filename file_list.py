from pathlib import Path

images_dir = Path("jokes/05/images")  # adjust if needed
out_file = Path("jokes/05/images_05.txt")

exts = {".png", ".jpg", ".jpeg", ".webp"}

files = sorted(
    [p.name for p in images_dir.iterdir() if p.is_file() and p.suffix.lower() in exts]
)

out_file.write_text("\n".join(files) + "\n", encoding="utf-8")
print(f"Wrote {len(files)} filenames to {out_file}")
