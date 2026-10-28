# Methodology

[← Back to README](../README.md)

The development is organised in seven phases with the final delivery around 10 January. The implementation phases follow the order of the features: first the basic ones, then the intermediate ones and finally the advanced ones.

| Phase | Description | Dates |
|:---:|---|---|
| **1** | Definition of features and screens (wireframes, entity model, algorithm, complementary technology, README) | 28 Sep – 4 Oct 2026 |
| **2** | Repository, tests and CI (backend and frontend projects, minimal feature, automated tests, continuous integration and static code analysis) | 5 Oct – 26 Oct 2026 |
| **3** | Version 0.1 - Basic features (MVP) and Docker | 27 Oct – 22 Nov 2026 |
| **4** | Version 0.2 - Intermediate features (search, customisation, recommendations, PDF ticket, inventory, cash register closing) and deployment | 23 Nov – 13 Dec 2026 |
| **5** | Version 1.0 - Advanced features (charts, stock estimation) | 14 Dec – 27 Dec 2026 |
| **6** | Report | 28 Dec 2026 – 10 Jan 2027 |
| **7** | Defence | To be determined |

```mermaid
gantt
    title Final Degree Project schedule (28 Sep 2026 - 10 Jan 2027)
    dateFormat YYYY-MM-DD
    axisFormat %d/%m
    tickInterval 1week

    section Phase 1 - Definition
    Screen wireframes                                :done, f1a, 2026-09-28, 3d
    Entity model and permissions                     :done, f1b, 2026-10-01, 2d
    Algorithm and complementary technology           :done, f1c, 2026-10-03, 2d
    README and phase documentation                   :done, f1d, 2026-10-03, 2d

    section Phase 2 - Repository, tests and CI
    Phase planning and GitHub issues                 :done, f2a, 2026-10-07, 7d
    MySQL database and Spring Boot backend           :done, f2b, 2026-10-13, 1d
    OpenAPI documentation                            :done, f2c, 2026-10-14, 1d
    React frontend                                   :done, f2d, 2026-10-19, 1d
    Backend automated tests                          :done, f2e, 2026-10-19, 3d
    Frontend automated tests                         :done, f2f, 2026-10-21, 1d
    Continuous integration with GitHub Actions       :done, f2g, 2026-10-25, 1d
    Static code analysis with SonarQube Cloud        :active, f2h, 2026-10-25, 2d
    Phase 2 documentation                            :active, f2i, 2026-10-25, 2d

    section Phase 3 - Version 0.1
    Sign up, log in and roles                        :f3a, 2026-10-27, 5d
    Menu and product detail                          :f3b, after f3a, 3d
    Cart, checkout and simulated payment             :f3c, after f3b, 5d
    Profile and order history                        :f3d, after f3c, 3d
    Order dashboard and product and user management  :f3e, after f3d, 5d
    Docker, continuous delivery and release 0.1      :f3f, after f3e, 4d

    section Phase 4 - Version 0.2
    Search, filters and customisation                :f4a, 2026-11-23, 5d
    Recommendation algorithm and PDF ticket          :f4b, after f4a, 5d
    Inventory and cash register closing              :f4c, after f4b, 5d
    Deployment and release 0.2                       :f4d, after f4c, 5d

    section Phase 5 - Version 1.0
    Dashboard, charts and stock estimation           :f5a, 2026-12-14, 7d
    Database migration and release 1.0               :f5b, after f5a, 7d

    section Phase 6 - Report
    Report                                           :f6a, 2026-12-28, 14d
    Final Degree Project delivery                    :milestone, m1, 2027-01-10, 0d
```
