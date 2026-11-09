# Sample images

Pictures of the sample products, loaded into the database by `SampleDataLoader` (in `es.urjc.kombo.config`) when the sample data is enabled.

Each file is named after the key of its product in `SampleDataLoader` (in English, lowercase and with hyphens). The names shown in the application are in Spanish. If a file is missing, the product is loaded without picture and a warning is written in the log.

| Key | Product (shown in the application) | File |
| :--- | :--- | :--- |
| `classic-burger` | Hamburguesa clásica | `classic-burger.jpg` |
| `chicken-burger` | Hamburguesa de pollo | `chicken-burger.jpg` |
| `french-fries` | Patatas fritas | `french-fries.jpg` |
| `cola` | Refresco de cola | `cola.jpg` |
| `bacon-cheeseburger` | Hamburguesa doble con bacon | `bacon-cheeseburger.jpg` |
| `chicken-nuggets` | Nuggets de pollo | `chicken-nuggets.jpg` |
| `orange-soda` | Refresco de naranja | `orange-soda.jpg` |
| `water` | Agua | `water.jpeg` |
| `chocolate-sundae` | Sundae de chocolate | `chocolate-sundae.jpg` |
| `classic-menu` | Menú clásico | `classic-menu.jpeg` |
| `chicken-menu` | Menú de pollo | `chicken-menu.jpg` |
| `family-menu` | Menú familiar | `family-menu.jpeg` |

Format of the pictures:

- JPEG (`.jpg` or `.jpeg`). PNG (`.png`) is also accepted.
- Square, about 800 x 800 pixels, and less than 300 KB each, so that the database and the Docker image stay small.
- A photo of the product on a plain or light background, like the pictures of a fast food menu.
- Free to use: take them from free stock photo websites (for example Unsplash or Pexels) and keep the licence in mind.
