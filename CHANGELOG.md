# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Phase 3 - Version 0.1 (in progress). These changes will be published in the release 0.1.0.

### Added

- `.gitattributes` to normalize line endings to LF.
- Domain model entities: `User`, `Image`, `Ingredient`, `Product`, `Combo`, `Order` and `OrderLine`.
- `Combo` entity that extends `Product` and groups several products with their quantities.
- Ingredients of each product with their quantities, and calculation of the ingredients used by a product or combo.
- Spring Data repositories for users, images, ingredients, products, combos and orders.
- `ProductDTO` and `ProductMapper` with MapStruct.
- `CLAUDE.md` with the project context and working rules for AI assistants.
- Domain model section in the development guide, with a class diagram of the entities.
- DTOs (records) and MapStruct mappers for all the entities: products and combos, ingredients, images, users, orders and order lines.
- REST endpoint `GET /api/v1/products/{id}` with the detail of a product or combo (ingredients and, for combos, their products).
- Pagination (`page`, `size`, `sort`) and category filter (`category`) in `GET /api/v1/products`.
- Uniform error responses of the REST API in ProblemDetail format (400 Bad Request and 404 Not Found).
- Unit test of the frontend product service.
- Entity relationship diagram in the analysis.
- Representative sample data: 15 ingredients, 9 products, 3 combos, one user of each role (customer, employee and administrator) and 4 orders in every status.
- Pictures of the sample products read from `backend/src/main/resources/sample-images/` and stored in the database, with a README that lists the expected files.
- Property `kombo.sample-data.enabled` (default `true`) to enable or disable the loading of the sample data.
- REST endpoint `GET /api/v1/products/{id}/image` with the picture of a product.
- Content type of the images (`contentType` attribute of `Image`).
- Passwords encoded with BCrypt (`spring-security-crypto`).
- Integration tests of the sample data, enabled and disabled.
- Spring Security with BCrypt passwords, `UserDetailsService` and the roles `CUSTOMER`, `EMPLOYEE` and `ADMIN`.
- Log in with a JWT in an `HttpOnly`, `Secure` and `SameSite=Strict` cookie: `POST /api/v1/auth/login`, `POST /api/v1/auth/logout` and `GET /api/v1/auth/me`.
- A single administrator created on startup from `KOMBO_ADMIN_EMAIL` and the BCrypt hash `KOMBO_ADMIN_PASSWORD_HASH`.
- Access rules by role and ownership, with 401 and 403 errors in ProblemDetail format.
- REST endpoints `GET /api/v1/users` (administrator), `GET /api/v1/users/{id}`, `GET /api/v1/users/{id}/orders` and `GET /api/v1/orders/{id}`, which only return the data of the user themselves (or any data to the administrator, and any order to employees).
- HTTPS on port 443 with a self-signed keystore generated with `keytool`.
- `.env.example` with all the environment variables; the backend reads a local `.env` file.
- Security tests: authentication, 401 without login, 403 with a wrong role and 403 with data of another user.
- Login flow, users and orders in the Postman collection.
- Client navigation with React Router and responsive design with React Bootstrap, with the Kombo palette (orange, navy and teal) defined in `theme.css`.
- Layout with a navigation bar that changes with the role of the user, `AuthContext` with the session and protected routes by role.
- Common HTTP client (`credentials: 'include'`, `ApiError`) and one service per resource (`authService`, `productService`, `userService`).
- Pages: menu with category filter and "show more", log in, profile with the order history of the customer, users list for the administrator, and 404, 403 and error pages with the same style.
- Client unit tests of the services, the session, the navigation by role, the protected routes and every page; client integration test of the log in; Selenium test of the log in.
- Multi-stage `docker/Dockerfile`: React build, Spring Boot jar with the client inside and final image with only the JRE, run by a non-root user.
- The server returns the React client for `/` and the client routes (`SpaConfig`), so the client and the REST API share the same origin.
- `docker/docker-compose.yml` (image `deliaml10/kombo:0.1`) and `docker/docker-compose-dev.yml` (image `deliaml10/kombo:dev`, can be built locally), with MySQL healthcheck and configuration with environment variables.
- Self-signed HTTPS keystore generated on the first start of the container (`docker/entrypoint.sh`) and kept in a volume.
- Quick start with Docker in the README.
- Continuous delivery workflow (`cd.yml`) with a reusable build and publish workflow (`docker-publish.yml`): image `dev` on every push to `main`, `<version>` and `latest` on every release, and `<branch>-<date-time>-<commit>` on manual runs.
- `docker/docker-compose.yml` published as an OCI artifact (`deliaml10/kombo-compose`) with the tag `dev` on every push to `main`, and `<version>` and `latest` on every release.
- Guide to publish a release and list of the DockerHub secrets.
- Kombo logo in the navigation bar, the footer, the home banner and the log in page, and favicon (`favicon.ico`, `favicon.png` and `apple-touch-icon.png`).
- Tests of the menu by category: blank category (server unit), combos listed in their category (server-database integration), a page of a category (REST API), *Todo* button (client unit), category filter and *Más resultados* with the real REST API (client integration) and *Menús* category in a real browser (Selenium).
- Sign up: `POST /api/v1/users` (public) creates a customer with name, optional surname and phone, a unique email and a BCrypt password of 8 to 72 characters; answers 201 with the `Location` header, 400 with the invalid fields and 409 if the email is already registered (`spring-boot-starter-validation`).
- Sign up form on the log in page, next to the log in form as in the mockup: optional surname and phone, repeated password checked in the client, and log in with the new account at once (`signUp` in `AuthContext`).
- Product and combo detail page (`/products/{id}`): picture, price, description, ingredients and, for a combo, its products with links to their detail; the product cards of the menu open it.
- Cart kept in the browser (`CartContext`, `localStorage`) with an *Añadir al carrito* button on the detail page and the number of units in the navigation bar.
- Tests of the product detail (server unit of products and combos, REST API detail of a combo, client unit and integration of the page, Selenium) and of the sign up (server unit, server-database integration, REST API, client unit and integration, Selenium).
- Sign up requests in the Postman collection.
- Cart: change the units of a product, remove it and empty the cart (`cartReducer`), and a cart page (`/cart`) with the subtotal and a note on the delivery cost of home deliveries (the delivery type, the delivery cost and the total are shown in the checkout); the cart counter of the navigation bar links to it.
- Checkout `POST /api/v1/orders` (anonymous users, customers and employees; 403 for the administrator): the server takes the current prices, copies the name and price of each product into its line, calculates the delivery cost, marks card payments as paid and answers 201 with the `Location` header. The order number is `1000 + id` (unique).
- Settings with the delivery cost of home deliveries (2,50 € by default, free from 25 €): `GET /api/v1/settings` (public) and `PUT /api/v1/settings` (administrator), and the administrator page *Ajustes* (`/admin/settings`).
- Checkout page (`/checkout`): delivery type (eat in, take away or home delivery with address), contact form with validation (filled in with the data of the logged in customer) and simulated payment by card or cash; confirmation page with the order number.
- Tests of the cart and the checkout: server unit (`OrderServiceTest`, `SettingsServiceTest`), server-database integration (`OrderServiceIT`), REST API (`OrderApiIT`), client unit (cart logic, cart, checkout and settings pages), client integration with the REST API (`CheckoutPage.integration.test.jsx`) and Selenium from the cart to the confirmation (`CheckoutE2E`).
- Checkout and settings requests in the Postman collection.
- Checkout with the saved data of the customer: their contact data is shown instead of the form (with a *Cambiar* button), and a home delivery goes to one of their saved addresses or to a new one, which the server saves in their profile when the order is placed.
- `GET /api/v1/users/me/orders`: order history of the logged in user, paginated, the most recent first.
- Order detail page (`/orders/{id}`) with the products and the price paid, the delivery, the payment and the totals, and 403 for the order of another user.
- *Repetir pedido* button in the last orders of the profile and in the order detail: adds the products of the order to the cart with the current prices.
- Tests of the checkout with saved data and of the order history: server unit, server-database integration, REST API, client unit, client integration with a real session (`test-session.js`) and Selenium (`OrderHistoryE2E` and a new `CheckoutE2E` test).
- `Get my orders` request in the Postman collection.
- Profile settings page (`/profile/settings`, *Configuración* button of the profile) with a header (picture, name and email) and one tab for each group of settings, each saved on its own: *Perfil* (personal data and profile picture), *Seguridad* (password), *Direcciones* (only customers) and *Cuenta* (delete the account, not for the administrator).
- `PUT /api/v1/users/me` (name, surname and phone; the email cannot be changed) and `PUT /api/v1/users/me/password` (needs the current password; 400 if it is wrong).
- `PUT /api/v1/users/me/addresses`: the whole list of saved addresses, to add and delete them.
- Profile pictures stored in the database: `PUT`, `GET` and `DELETE /api/v1/users/me/image` (multipart, field `image`). `ImageService` accepts JPEG, PNG, GIF and WebP pictures of 1 MB at most and takes the type from the first bytes of the file, not from its name; 400 for other files and 413 for bigger ones. `UserDTO` has the `imageId` of the picture, used in its URL so the browser shows a new picture at once. The picture (or the initial) is shown in the profile, the settings and the navigation bar (`UserAvatar`).
- `DELETE /api/v1/users/me`: deletes the account with its addresses and picture and closes the session; the orders are kept for the sales, without the user, name, email and phone. The account of the administrator cannot be deleted (403).
- Administrator endpoints for any user: `GET` and `PUT /api/v1/users/{id}`, `PUT /api/v1/users/{id}/addresses`, `PUT`, `GET` and `DELETE /api/v1/users/{id}/image` and `DELETE /api/v1/users/{id}`.
- *Mi perfil* link for the administrator in the navigation bar.
- Order dashboard for employees and the administrator (`/orders`, *Pedidos* link): *Pendientes* tab with the orders in preparation and ready, oldest first, with the minutes they have been waiting (in red after 10 minutes, updated every 30 seconds); *Terminados* tab with the orders delivered and cancelled of today, most recent first, with the time they were placed; buttons to charge a cash order, mark an order as ready, deliver it (only when paid) and cancel it (with a confirmation).
- `GET /api/v1/orders` (employees and administrator): paginated, filtered by `status` (one or more) and `since` (local date and time) in the database, sorted by age (oldest first by default).
- `PATCH /api/v1/orders/{id}` (employees and administrator): `{ "status" }` and `{ "paid": true }`. The status only moves forward (in preparation → ready → delivered, or cancelled before it is delivered), an order is delivered only when it is paid, and only cash orders are marked as paid; 409 for a change that is not possible.
- Counter orders: an employee uses the menu, the cart and the checkout (*Pedido en mostrador*, *Nuevo pedido en mostrador* button of the dashboard); only the name of the customer is required and a card is paid with the card reader of the restaurant (no card data). The confirmation has an *Ir a los pedidos* button.
- Tests (the six types) of the personal data and the password, the addresses, the profile picture, the deletion of the account, the order dashboard and the counter orders: `UserServiceTest`, `ImageServiceTest`, `OrderServiceTest`, `UserServiceIT`, `OrderServiceIT`, `UserApiIT`, `OrderDashboardApiIT`, `ProfileSettingsPage.test.jsx`, `OrdersDashboardPage.test.jsx`, the service and validation tests of the client, `userService.integration.test.js`, `orderService.integration.test.js`, `ProfileSettingsE2E` and `OrderDashboardE2E`.
- Profile, order dashboard and counter order requests in the Postman collection.
- `POST /api/v1/admin/users` (administrator): creates a customer or an employee with the same rules as the sign up and the role (`CUSTOMER` or `EMPLOYEE`; 400 for `ADMIN`, because there is only one administrator); answers 201 with the `Location` header of `/api/v1/users/{id}` and 409 if the email is already registered.
- User management of the administrator: *Nuevo usuario* button and page (`/admin/users/new`) with the role, the personal data and the first password; *Editar* and *Borrar* buttons in the users list (not for the administrator); edit page (`/admin/users/{id}`) with the personal data, the profile picture, the addresses of customers and the deletion of the user, with a confirmation.
- Tests (the six types) of the user management: `UserServiceTest`, `UserServiceIT`, `UserApiIT`, `UsersPage.test.jsx`, `NewUserPage.test.jsx`, `UserEditPage.test.jsx`, the service and validation tests of the client, `userService.integration.test.js` and `UserManagementE2E`.
- Management of products and kombos by the administrator (*Productos* link, `/admin/products`): cards with the picture, the price, the category and the ingredients (or the products of a kombo), *Nuevo producto* and *Nuevo kombo*, *Modificar*, and *Desactivar* or *Activar*. When a product cannot be deactivated because active kombos include it, a window lists those kombos with a *Modificar* button that opens each one (the window closes; pressing *Desactivar* again shows the kombos that still include it). Products are never deleted, because the orders keep them: a deactivated product leaves the menu and is shown in grey until it is activated again.
- Product form (`/admin/products/new` and `/admin/products/{id}`): name, price, description, category, the ingredients with their quantities (chosen from the existing ones) and the picture. Kombo form (`/admin/combos/new` and `/admin/combos/{id}`): name, the price written by the administrator (with the sum of its products as a reference), the active products that are not kombos with their units (at least 2 in total) and the picture.
- REST API of the administrator: `GET /api/v1/admin/products` (also the deactivated ones, filters `active` and `combo`), `GET`, `PUT` and `PATCH /api/v1/admin/products/{id}` (`{ "active" }`), `POST /api/v1/admin/products`, `POST /api/v1/admin/combos`, `PUT /api/v1/admin/combos/{id}`, `PUT` and `GET /api/v1/admin/products/{id}/image` and `GET /api/v1/admin/ingredients`. A product in an active kombo cannot be deactivated, and a kombo with a deactivated product cannot be activated (409 with their ids and names in the `products` property).
- Tests (the six types) of the management of products and kombos: `ProductServiceTest`, `ImageServiceTest`, `ProductServiceIT`, `AdminProductApiIT`, `AdminProductsPage.test.jsx`, `ProductFormPage.test.jsx`, `ComboFormPage.test.jsx`, the service, HTTP client and validation tests of the client, `productService.integration.test.js` and `ProductManagementE2E`.
- `SearchableSelect` component: a drop-down list where the administrator can also write to filter the options, without taking into account upper case or accents. It is used to choose the ingredients of a product and the products of a kombo.

### Changed

- Client redesign with the colours of the logo: light navigation bar, orange home banner, product cards with category and the price in orange, split log in page and Montserrat headings.
- Logging out from a protected page (for example *Mis pedidos*) goes to the menu instead of the log in page.
- The Selenium tests share their setup (`E2ETestSupport`), use a fixed window size and scroll to an element without animation before clicking it (Bootstrap enables smooth scrolling, which made the clicks land on other elements in CI).
- The user menu of the navigation bar is no longer a dropdown: the name, the role and a *Cerrar sesión* button are always visible (the dropdown did not open with the Chrome of the CI runners).
- The Selenium tests save a screenshot and the HTML of the page of every failed test in `target/e2e-failures`, uploaded by CI as the `e2e-failures` artifact.
- Logging out shows the menu at once (`flushSync` navigation of `RouterProvider` from `react-router/dom`) before the session ends, so a protected page can no longer send the user to the log in page while logging out.
- The Selenium log in test clicks the *Cerrar sesión* button of the navigation bar with JavaScript: in the headless Chrome of the CI runners neither mouse clicks nor the keyboard reached that bar.
- The full quality control workflow runs the UI tests against the production build of the client (`vite build` and `vite preview`), and shows the client log when they fail.
- The sample data shown in the application (products, combos and ingredients) is in Spanish, like the rest of the interface; the keys of the products and the code stay in English. "Email" is shown as "Correo electrónico".
- Sample pictures with the `.jpeg` extension are loaded, and the orange soda picture was renamed to `orange-soda.jpg`, so every sample product has its picture.
- The menu of the home page shows product cards with picture and price instead of a plain list (`ProductList` tests adapted).
- Secrets (database password, JWT key, keystore password and administrator password hash) are read from environment variables instead of `application.properties`.
- The administrator is no longer part of the sample data.
- The tests of the REST API, the Vite proxy, the client integration test and the Selenium test use HTTPS.
- The client integration tests and the Selenium tests of the full quality control run against the application started with `docker compose`, instead of the jar and the Vite server.
- `GET /api/v1/products` returns DTOs instead of the `Product` entity (the JSON fields do not change).
- AI usage log updated with the Phase 3 sessions.
- Analysis updated with all the entities of the code (Combo and OrderLine added) and their current attributes and relations.
- `GET /api/v1/products` returns only active products, paginated (10 per page by default), in the format `{ content, page }`.
- The products service returns DTOs instead of entities.
- The frontend product service reads the products from the `content` of the page.
- Backend tests adapted to the paginated API, the category filter, the product detail and the error responses.
- Gantt chart of the methodology updated with the real dates of the work done.
- OpenAPI specification and HTML documentation of the REST API regenerated in `docs/api/`.
- Sample data loader moved from the `service` package to the `config` package.
- Server integration test of the products service runs without sample data; REST API test updated to the new sample data.
- Development guide: sample data, credentials and how to disable it; tests table updated.
- Changelog split into phases.
- The log in page shows the sign up and log in forms side by side, separated by a dashed line, instead of the orange side panel; the Selenium log in test clicks the button of the log in form.
- Errors of invalid request bodies name each invalid field in the `detail` of the ProblemDetail.
- `OrderLineDTO` includes the name of the product at the time of the purchase and `OrderDTO` the subtotal; the sample orders are numbered like the new ones (`1000 + id`).
- SonarQube Cloud issues fixed: the promise of `navigate` in the log in page, repeated texts of the sample data as constants, the binary field of `Image` renamed to `data` (same database column), `LocalDateTime.now()` with the time zone, a duplicated CSS selector, `!important` in the navigation bar, `<fieldset>` and `<output>` instead of the `group` and `status` roles, and `findByText` in a test. `test-utils.jsx` is analysed as test code.
- Analysis, development guide (domain model and tests table) and OpenAPI documentation updated with the checkout and the settings.
- The entity relationship diagram of the analysis is drawn from left to right and has a legend of its symbols.
- The profile shows the last 4 orders of the customer (with *Más resultados*), and each one opens its detail; the client uses `GET /users/me/orders` instead of `GET /users/{id}/orders`.
- The checkout waits for the session to be checked before showing the form, so after reloading the page it starts with the data of the customer.
- Gantt chart of the methodology updated with the real dates of the Phase 3 tasks done until 15 November (from the Git history and the AI sessions) and the plan of the remaining tasks until the release 0.1 on 22 November.
- The combos are called *kombos* in the interface: the *Kombos* category of the menu, *Productos del kombo* in the detail, the home banner and the sample combos (*Kombo clásico*, *Kombo de pollo* and *Kombo familiar*). The code still uses `Combo`.
- `GET /api/v1/users/{id}` and `GET /api/v1/users/{id}/orders` are only for the administrator: the users read and manage their own account with the `/me` paths.
- Employees go to the order dashboard after logging in.
- In the checkout, the email and the phone are only optional in the counter orders of the employees (checked in `OrderService`), and an employee starts with an empty form instead of their own data.
- `ProductService` reads the pictures with `ImageService`; the client HTTP client sends `FormData` bodies (file uploads) as multipart.
- `spring.servlet.multipart.max-file-size=1MB` written in `application.properties`.
- Development guide (access rules, client pages, tests, sample data), analysis (permissions), README of the sample pictures, OpenAPI documentation and Gantt chart updated with the profile settings and the order dashboard.
- The forms of the personal data, the profile picture and the addresses of the profile settings are shared components (`AccountForms.jsx`) used also by the user management of the administrator; `UserAvatar` can show the picture of any user.
- The *Mi perfil* link of employees and the administrator opens the settings of their account directly, without the intermediate profile page (only customers have one, with their orders); `/profile` sends them to the settings, and the settings page only shows *Volver al perfil* to customers.
- The order dashboard reads its lists again every 30 seconds, so new orders appear without pressing *Actualizar*; the list does not flicker and an open confirmation stays open (only the first page is read again).
- Development guide (access rules, client pages and tests), OpenAPI documentation and Postman collection updated with the user management.
- Pictures of products and kombos can have up to 10 MB (`spring.servlet.multipart.max-file-size=10MB`); profile pictures keep their limit of 1 MB, now checked in `ImageService`, which answers 413 for a picture bigger than its limit.
- `ApiError` of the client keeps the whole ProblemDetail of the answer.
- The navigation bar opens its menu button below 992 px instead of 768 px, and the links are closer between 992 and 1199 px, so the six links of the administrator fit in one row; a link is never split in two lines.
- Development guide (access rules, client folders and pages, tests), analysis (permissions), OpenAPI documentation and Postman collection updated with the management of products and kombos.
- Customers open the settings of their account from a *Mi perfil* link at the end of the navigation bar, as employees and the administrator do; the *Configuración* button of *Mis pedidos* was removed, and the settings page is called *Mi perfil*.
- A long user name wraps next to the profile picture, which keeps its size, in the navigation bar, *Mis pedidos*, *Mi perfil* and the user edit page.

## Phase 2 - 2026-10-29

### Added

- Docker Compose file to run a MySQL 8.4 development database.
- Spring Boot backend project in `backend/`.
- `Product` entity with sample data loaded on startup.
- REST endpoint `GET /api/v1/products` to list all products.
- OpenAPI documentation of the REST API with Swagger UI (`/swagger-ui.html`).
- OpenAPI specification and HTML documentation in `docs/api/`.
- React frontend project in `frontend/`, created with Vite.
- Home page that lists the products returned by the REST API.
- Backend automated tests: unit test of the product service, integration test with Testcontainers and REST API system test with Rest Assured.
- Backend test coverage report with JaCoCo.
- Frontend automated tests with Vitest and Testing Library: unit and integration tests of the product list.
- Frontend test coverage report.
- UI system test with Selenium, run with the `e2e` Maven profile.
- Basic CI workflow with GitHub Actions: build, lint and unit tests on every push.
- Full CI workflow with GitHub Actions: all tests on every pull request to `main`.
- Static code analysis with SonarQube Cloud in the basic CI workflow, including the coverage of the backend tests and the frontend unit tests.
- Development guide and Postman collection of the REST API in `docs/`.

### Changed

- The basic CI workflow also runs on `main`, so SonarQube Cloud analyses the main branch.
- The frontend product service accepts a configurable API base URL (`VITE_API_URL`) for the tests.
- MySQL development container restarts automatically with Docker.
- `ProductList` component file renamed to follow React naming conventions.
- Documentation split into several files in `docs/` and translated into English.
- Methodology updated to the seven phases of the Final Degree Project guide, with the new dates.
- AI usage log updated with the Phase 2 sessions.

### Fixed

- REST API system test now uses the Testcontainers database instead of the development database.

### Removed

- Default Spring Boot context test, replaced by the REST API system test.
- Unused example assets from the Vite template.

## Phase 1 - 2026-10-04

### Added

- `README.md` with the project definition: objectives, features, screen mockups, entities and permissions.
- `CHANGELOG.md`.
- AI usage log.
