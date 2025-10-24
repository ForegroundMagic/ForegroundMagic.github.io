# Simplified Product Media Schema

This document captures the SQLite structure and seed data required to load the current Bella + Canvas 3001C product media into the app. The schema keeps everything scoped to the product and its per-colour assets (buttons and preview renders).

## 1. `products`
- `product_id` INTEGER PRIMARY KEY
- `product_code` TEXT UNIQUE NOT NULL  — example: `3001C_BC_UJSST`
- `product_name` TEXT NOT NULL  — pulled from the companion `.txt` file.
- `description` TEXT NULL
- `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
- `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP

Use this table as the authoritative product list. Additional columns (e.g., marketing copy) can be added later without disturbing the media linkage.

## 2. `product_color_assets`
One row per product colour that carries every asset path the UI needs.

- `color_asset_id` INTEGER PRIMARY KEY
- `product_id` INTEGER NOT NULL REFERENCES `products`(`product_id`) ON DELETE CASCADE
- `color_code` TEXT NOT NULL — slug derived from filenames (e.g., `heather_mauve`).
- `color_name` TEXT NOT NULL — title-cased name for display (e.g., “Heather Mauve”).
- `preview_front_path` TEXT NOT NULL — front render path.
- `preview_back_path` TEXT NOT NULL — back render path.
- `button_96_path` TEXT NOT NULL — square swatch (`96×96`).
- `button_300x80_path` TEXT NOT NULL — rectangular swatch (`300×80`).
- `sort_order` INTEGER NOT NULL — numeric prefix from filenames, keeps colours in author-intended order.
- `is_active` INTEGER NOT NULL DEFAULT 1 — quick toggle to hide colours when unavailable.

`UNIQUE(product_id, color_code)` prevents duplicates. Index `product_id` to load a product’s colours quickly.

## Asset inventory extracted from the repo
The table below is generated directly from `assets/img/products/3001C_BC_UJSST`. All paths are relative to the repository root so they can be used as-is in the front-end.

| # | Color Name | Color Code | Preview Front | Preview Back | Button 96x96 | Button 300x80 |
| - | - | - | - | - | - | - |
| 1 | Maroon | maroon | assets/img/products/3001C_BC_UJSST/preview/01_maroon_front.png | assets/img/products/3001C_BC_UJSST/preview/01_maroon_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/01_maroon_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/01_maroon_300x80.png |
| 2 | Athletic Heather | athletic_heather | assets/img/products/3001C_BC_UJSST/preview/02_athletic_heather_front.png | assets/img/products/3001C_BC_UJSST/preview/02_athletic_heather_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/02_athletic_heather_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/02_athletic_heather_300x80.png |
| 3 | Heather Military Green | heather_military_green | assets/img/products/3001C_BC_UJSST/preview/03_heather_military_green_front.png | assets/img/products/3001C_BC_UJSST/preview/03_heather_military_green_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/03_heather_military_green_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/03_heather_military_green_300x80.png |
| 4 | Heather Sand Dune | heather_sand_dune | assets/img/products/3001C_BC_UJSST/preview/04_heather_sand_dune_front.png | assets/img/products/3001C_BC_UJSST/preview/04_heather_sand_dune_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/04_heather_sand_dune_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/04_heather_sand_dune_300x80.png |
| 5 | Heather Mauve | heather_mauve | assets/img/products/3001C_BC_UJSST/preview/05_heather_mauve_front.png | assets/img/products/3001C_BC_UJSST/preview/05_heather_mauve_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/05_heather_mauve_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/05_heather_mauve_300x80.png |
| 6 | Heather Team Purple | heather_team_purple | assets/img/products/3001C_BC_UJSST/preview/06_heather_team_purple_front.png | assets/img/products/3001C_BC_UJSST/preview/06_heather_team_purple_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/06_heather_team_purple_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/06_heather_team_purple_300x80.png |
| 7 | Heather Mint | heather_mint | assets/img/products/3001C_BC_UJSST/preview/07_heather_mint_front.png | assets/img/products/3001C_BC_UJSST/preview/07_heather_mint_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/07_heather_mint_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/07_heather_mint_300x80.png |
| 8 | Natural | natural | assets/img/products/3001C_BC_UJSST/preview/08_natural_front.png | assets/img/products/3001C_BC_UJSST/preview/08_natural_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/08_natural_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/08_natural_300x80.png |
| 9 | Heather Orange | heather_orange | assets/img/products/3001C_BC_UJSST/preview/09_heather_orange_front.png | assets/img/products/3001C_BC_UJSST/preview/09_heather_orange_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/09_heather_orange_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/09_heather_orange_300x80.png |
| 10 | Heather Peach | heather_peach | assets/img/products/3001C_BC_UJSST/preview/10_heather_peach_front.png | assets/img/products/3001C_BC_UJSST/preview/10_heather_peach_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/10_heather_peach_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/10_heather_peach_300x80.png |
| 11 | Heather Raspberry | heather_raspberry | assets/img/products/3001C_BC_UJSST/preview/11_heather_raspberry_front.png | assets/img/products/3001C_BC_UJSST/preview/11_heather_raspberry_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/11_heather_raspberry_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/11_heather_raspberry_300x80.png |
| 12 | Heather Red | heather_red | assets/img/products/3001C_BC_UJSST/preview/12_heather_red_front.png | assets/img/products/3001C_BC_UJSST/preview/12_heather_red_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/12_heather_red_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/12_heather_red_300x80.png |
| 13 | Vintage Black | vintage_black | assets/img/products/3001C_BC_UJSST/preview/13_vintage_black_front.png | assets/img/products/3001C_BC_UJSST/preview/13_vintage_black_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/13_vintage_black_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/13_vintage_black_300x80.png |
| 14 | Vintage White | vintage_white | assets/img/products/3001C_BC_UJSST/preview/14_vintage_white_front.png | assets/img/products/3001C_BC_UJSST/preview/14_vintage_white_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/14_vintage_white_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/14_vintage_white_300x80.png |
| 15 | Pink | pink | assets/img/products/3001C_BC_UJSST/preview/15_pink_front.png | assets/img/products/3001C_BC_UJSST/preview/15_pink_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/15_pink_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/15_pink_300x80.png |
| 16 | Forest | forest | assets/img/products/3001C_BC_UJSST/preview/16_forest_front.png | assets/img/products/3001C_BC_UJSST/preview/16_forest_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/16_forest_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/16_forest_300x80.png |
| 17 | White | white | assets/img/products/3001C_BC_UJSST/preview/17_white_front.png | assets/img/products/3001C_BC_UJSST/preview/17_white_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/17_white_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/17_white_300x80.png |
| 18 | Yellow | yellow | assets/img/products/3001C_BC_UJSST/preview/18_yellow_front.png | assets/img/products/3001C_BC_UJSST/preview/18_yellow_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/18_yellow_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/18_yellow_300x80.png |
| 19 | Asphalt | asphalt | assets/img/products/3001C_BC_UJSST/preview/19_asphalt_front.png | assets/img/products/3001C_BC_UJSST/preview/19_asphalt_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/19_asphalt_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/19_asphalt_300x80.png |
| 20 | Deep Teal | deep_teal | assets/img/products/3001C_BC_UJSST/preview/20_deep_teal_front.png | assets/img/products/3001C_BC_UJSST/preview/20_deep_teal_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/20_deep_teal_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/20_deep_teal_300x80.png |
| 21 | Heather Royal | heather_royal | assets/img/products/3001C_BC_UJSST/preview/21_heather_royal_front.png | assets/img/products/3001C_BC_UJSST/preview/21_heather_royal_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/21_heather_royal_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/21_heather_royal_300x80.png |
| 22 | Kelly | kelly | assets/img/products/3001C_BC_UJSST/preview/22_kelly_front.png | assets/img/products/3001C_BC_UJSST/preview/22_kelly_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/22_kelly_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/22_kelly_300x80.png |
| 23 | Red | red | assets/img/products/3001C_BC_UJSST/preview/23_red_front.png | assets/img/products/3001C_BC_UJSST/preview/23_red_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/23_red_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/23_red_300x80.png |
| 24 | Leaf | leaf | assets/img/products/3001C_BC_UJSST/preview/24_leaf_front.png | assets/img/products/3001C_BC_UJSST/preview/24_leaf_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/24_leaf_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/24_leaf_300x80.png |
| 25 | Team Purple | team_purple | assets/img/products/3001C_BC_UJSST/preview/25_team_purple_front.png | assets/img/products/3001C_BC_UJSST/preview/25_team_purple_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/25_team_purple_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/25_team_purple_300x80.png |
| 26 | True Royal | true_royal | assets/img/products/3001C_BC_UJSST/preview/26_true_royal_front.png | assets/img/products/3001C_BC_UJSST/preview/26_true_royal_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/26_true_royal_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/26_true_royal_300x80.png |
| 27 | Navy | navy | assets/img/products/3001C_BC_UJSST/preview/27_navy_front.png | assets/img/products/3001C_BC_UJSST/preview/27_navy_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/27_navy_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/27_navy_300x80.png |
| 28 | Orange | orange | assets/img/products/3001C_BC_UJSST/preview/28_orange_front.png | assets/img/products/3001C_BC_UJSST/preview/28_orange_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/28_orange_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/28_orange_300x80.png |
| 29 | Soft Pink | soft_pink | assets/img/products/3001C_BC_UJSST/preview/29_soft_pink_front.png | assets/img/products/3001C_BC_UJSST/preview/29_soft_pink_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/29_soft_pink_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/29_soft_pink_300x80.png |
| 30 | Teal | teal | assets/img/products/3001C_BC_UJSST/preview/30_teal_front.png | assets/img/products/3001C_BC_UJSST/preview/30_teal_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/30_teal_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/30_teal_300x80.png |
| 31 | Turquoise | turquoise | assets/img/products/3001C_BC_UJSST/preview/31_turquoise_front.png | assets/img/products/3001C_BC_UJSST/preview/31_turquoise_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/31_turquoise_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/31_turquoise_300x80.png |
| 32 | Black | black | assets/img/products/3001C_BC_UJSST/preview/32_black_front.png | assets/img/products/3001C_BC_UJSST/preview/32_black_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/32_black_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/32_black_300x80.png |
| 33 | Canvas Red | canvas_red | assets/img/products/3001C_BC_UJSST/preview/33_canvas_red_front.png | assets/img/products/3001C_BC_UJSST/preview/33_canvas_red_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/33_canvas_red_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/33_canvas_red_300x80.png |
| 34 | Cardinal | cardinal | assets/img/products/3001C_BC_UJSST/preview/34_cardinal_front.png | assets/img/products/3001C_BC_UJSST/preview/34_cardinal_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/34_cardinal_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/34_cardinal_300x80.png |
| 35 | Dark Grey Heather | dark_grey_heather | assets/img/products/3001C_BC_UJSST/preview/35_dark_grey_heather_front.png | assets/img/products/3001C_BC_UJSST/preview/35_dark_grey_heather_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/35_dark_grey_heather_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/35_dark_grey_heather_300x80.png |
| 36 | Gold | gold | assets/img/products/3001C_BC_UJSST/preview/36_gold_front.png | assets/img/products/3001C_BC_UJSST/preview/36_gold_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/36_gold_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/36_gold_300x80.png |
| 37 | Light Blue | light_blue | assets/img/products/3001C_BC_UJSST/preview/37_light_blue_front.png | assets/img/products/3001C_BC_UJSST/preview/37_light_blue_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/37_light_blue_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/37_light_blue_300x80.png |
| 38 | Maize Yellow | maize_yellow | assets/img/products/3001C_BC_UJSST/preview/38_maize_yellow_front.png | assets/img/products/3001C_BC_UJSST/preview/38_maize_yellow_back.png | assets/img/products/3001C_BC_UJSST/buttons/96x96px/38_maize_yellow_96x96.png | assets/img/products/3001C_BC_UJSST/buttons/300x80px/38_maize_yellow_300x80.png |

## SQLite creation script & database placement
A ready-to-run SQL script lives at `assets/database/create_product_media.sql`. Execute it with SQLite to create and seed the database:

```bash
sqlite3 assets/database/product_media.sqlite < assets/database/create_product_media.sql
```

This command will:
1. Create the `products` and `product_color_assets` tables (if they do not already exist).
2. Insert the product row for `3001C_BC_UJSST`.
3. Populate 38 colour rows with the asset paths listed above.

Store the resulting database file at `assets/database/product_media.sqlite` so it stays close to the referenced media assets. Any future products can be added by appending to the same SQL script (or running additional insert statements) and re-running the command.

