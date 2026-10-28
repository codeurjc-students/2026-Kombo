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
- Backend automated tests: unit test of the product service, integration test with TestContainers and REST API system test with Rest Assured.
- Backend test coverage report with JaCoCo.
- Frontend automated tests with Vitest and Testint Library: unit and integration tests of the product list. 
- Frontend test coverage report.
- UI system test with Selenium, run with the 'e2e' Maven profile.
- Basic CI workflow with GitHub Actions: build, lint and unit tests on every push to a feature branch.
- Full CI workflow with GitHub Actions: all tests on every pull request to `main`.

### Changed
- The frontend product service accepts a configurable API base URL (`VITE_API_URL`) for the tests.
- Fixed one of the imports in the `ProductApiIT` file.


### Removed
- Default Spring Boot context test, replaced by the REST API system test. 


## Phase 1 - 2026-10-04

### Added

- `README.md` with the project definition: objectives, features, screen mockups, entities and permissions.
- `CHANGELOG.md`.
- AI usage log.