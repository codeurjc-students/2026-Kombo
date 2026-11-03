# Repository Guidelines

## Scope and simplicity

Kombo is the Final Degree Project (TFG) of the author: a web application for a fast food restaurant (ordering, order dashboard, inventory and cash register closing). The URJC guide "Desarrollo de una aplicación web como TFG" defines the requirements of each phase and must be followed literally; the current phase and dates are in [methodology](docs/methodology.md).

Use the GitHub issue the author is working on as scope. The author may ask for an explanation, a proposal to review, or a change in the repository: explain when asked for guidance, and change files when asked to do the work.

Implement the smallest complete change within the existing structure. Reuse the repository code and the installed dependencies; add a dependency, abstraction or special case only when a current requirement needs it. Finish when the requested behavior and its tests are complete. Improve unrelated code only when the author asks for it.

## Structure and conventions

The Spring Boot backend lives in `backend/` and the React frontend in `frontend/`. Backend packages under `es.urjc.kombo`: `controller` → `service` → `repository`, plus `model` (JPA entities), `dto` (records and MapStruct mappers) and `config`. A controller never uses a repository. Frontend: `src/components` (UI) and `src/services` (calls to the REST API). Tests mirror the production packages.

Use four-space Java indentation, constructor injection and descriptive English names. Code and comments in English; Spanish only in texts shown in the user interface. Name API representations `*DTO`, mappers `*Mapper`, repositories `*Repository` and services `*Service`. Test classes: `*Test` (unit), `*IT` (integration and system, Testcontainers), `*E2E` (Selenium).

Rules from the TFG guide and the domain model:

- REST API under `/api/v1`, resources in English and plural, correct methods and status codes, `Location` header on creation, filters as URL parameters, paginated lists. The API returns DTOs, never entities.
- Filter and sort in the database with repository queries, never in memory. Use the logger, not `System.out.println()`.
- Entities use `GenerationType.IDENTITY`, enums nested in their entity with `@Enumerated(EnumType.STRING)`, and `FetchType.LAZY` on `@OneToOne` and `@ManyToOne`. `Product` and `Ingredient` are map keys: `equals` by id and a constant `hashCode`. `Combo` extends `Product` and overrides `getIngredientUsage()`.
- Images are stored in the database. Sample data can be enabled or disabled with a property.
- Line endings are LF (`.gitattributes`).

## Commands and tests

Runtimes: Java 21 and Node.js 22 (as in `.github/workflows`). Commands are in `backend/pom.xml`, `frontend/package.json` and the [development guide](docs/development-guide.md). On Windows PowerShell use `.\mvnw`.

- Database, from root: `docker compose -f docker/docker-compose-db.yml up -d`. After changing entities, recreate it with `down -v` (`ddl-auto=update`).
- Backend, from `backend/`: `./mvnw spring-boot:run` (http://localhost:8080, Swagger UI at `/swagger-ui.html`); `./mvnw test` (unit); `./mvnw verify` (unit, integration and system tests and JaCoCo report, needs Docker); `./mvnw verify -Pe2e` (Selenium, needs database, backend, frontend and Chrome running).
- Frontend, from `frontend/`: `npm run dev` (http://localhost:5173); `npm run lint`; `npm run build`; `npm test` (unit); `npm run test:integration` (needs the backend running).

Each feature needs six tests: REST API e2e, UI e2e, server-database integration, client-REST API integration, server unit and client unit. A feature is not done until they pass. Coverage must reach at least 70% at the end of each phase. Before handing over, run `./mvnw verify`, `npm run lint`, `npm test` and `git diff --check`.

## Context

Documentation is in `docs/`: [development guide](docs/development-guide.md) (technologies, architecture, quality control, process), [analysis](docs/analysis.md) (entities, permissions and complementary technology), [features](docs/features.md), [tracking](docs/tracking.md) and the REST API documentation in `docs/api/` (regenerate it when the API changes, as explained in the development guide). Screen mockups are in `images/` and linked from `README.md`.

Tasks are GitHub Issues in `codeurjc-students/2026-Kombo`, with one milestone per phase and a GitHub Projects Kanban board.

## Communication and delivery

Reply in Spanish when the author writes in Spanish. Use plain words and short sentences. Explain what changed, where it is and why, so the author can review the work, explain it in the defence and continue manually.

Use GitHub Flow: every feature or fix is developed in its own branch, created from an up-to-date `main`, with a short English kebab-case name (`add-login-page`, `fix-login-page`). Never commit directly to `main`. Changes reach `main` only through a pull request that must pass the tests: the "Full quality control" workflow runs on every pull request to `main`, and `main` is protected. The pull request description includes `Closes #<issue>`. Commit messages are short, imperative and in English.

Keep the documentation up to date in the same branch as the change:

- [CHANGELOG.md](CHANGELOG.md): add every notable change under `[Unreleased]` (Keep a Changelog format).
- [docs/AI_USAGE.md](docs/AI_USAGE.md): record everything the AI does in the project (explanations, proposals, reviews, code, documentation, Git operations) in the entry of that day, with the fields required by the guide: date, phase, tool, version, configuration, objective and issue, how it was used, and context files (including this `CLAUDE.md`). State honestly what the AI did and what the author did.

Leave changes unstaged. Obtain the author's explicit approval before staging, committing, pushing, opening a pull request, merging or closing an issue.
