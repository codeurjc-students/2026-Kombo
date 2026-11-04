# Sample images

Pictures of the sample products, loaded into the database by `SampleDataLoader` (in `es.urjc.kombo.config`) when the sample data is enabled.

Each file is named after its product, in lowercase and with hyphens instead of spaces. If a file is missing, the product is loaded without picture and a warning is written in the log.

| Product | File |
| :--- | :--- |
| Classic Burger | `classic-burger.jpg` |
| Chicken Burger | `chicken-burger.jpg` |
| French Fries | `french-fries.jpg` |
| Cola | `cola.jpg` |
| Bacon Cheeseburger | `bacon-cheeseburger.jpg` |
| Chicken Nuggets | `chicken-nuggets.jpg` |
| Orange Soda | `orange-soda.jpg` |
| Water | `water.jpg` |
| Chocolate Sundae | `chocolate-sundae.jpg` |
| Classic Menu | `classic-menu.jpg` |
| Chicken Menu | `chicken-menu.jpg` |
| Family Menu | `family-menu.jpg` |

Format of the pictures:

- JPEG (`.jpg`). PNG (`.png`) is also accepted.
- Square, about 800 x 800 pixels, and less than 300 KB each, so that the database and the Docker image stay small.
- A photo of the product on a plain or light background, like the pictures of a fast food menu.
- Free to use: take them from free stock photo websites (for example Unsplash or Pexels) and keep the licence in mind.
