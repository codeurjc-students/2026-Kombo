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

### Changed

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
