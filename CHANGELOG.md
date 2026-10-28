# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
