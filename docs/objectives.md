# **Objectives**

[← Back to README](../README.md)

## **Functional objectives**
- **FO1.** Allow any user, even anonymous, to browse the menu by category, with a search engine and filters, and to see the detail of each product.

- **FO2.** Allow users to build an order with a cart, customise products (removing ingredients), choose whether to eat in, take away or have it delivered, and complete it with a checkout with simulated payment.

- **FO3.** Offer registered customers a profile with personal data, saved addresses, order history and the option to repeat the last order.

- **FO4.** Offer employees counter ordering, a dashboard of pending and finished orders, the inventory view with low stock warnings and the cash register closing broken down by card and cash.

- **FO5.** Allow the administrator to manage products and combos, ingredients, supplier deliveries and employees.

- **FO6.** Keep the ingredient inventory automatically updated with each order and do not offer the products that cannot be prepared due to lack of stock.

- **FO7.** Recommend in the cart products that are usually bought together with the ones it already contains.

- **FO8.** Show the administrator sales statistics through charts (daily sales, best-selling products, ...), together with the average ticket and the peak hours, and allow exportable reports.

- **FO9.** Generate the ticket of each order, with its order number, in PDF format.


## **Technical objectives**

- **TO1.** Develop a REST API with Spring Boot that exposes all the resources and applies the business logic.

- **TO2.** Develop a SPA with React that consumes the API and adapts the interface to the role of the user.

- **TO3.** Store the data in MySQL (including the pictures) with a normalised relational model.

- **TO4.** Implement role-based authentication and authorisation and access control based on data ownership.

- **TO5.** Integrate the complementary technologies: generation of downloadable PDF tickets and sending of an email when an account is created.

- **TO6.** Automate the build and the tests with GitHub Actions and containerise the application with Docker.

- **TO7.** Apply static code analysis with SonarQube integrated in the continuous integration pipeline.

- **TO8.** Write automated tests of the business logic and the API.
