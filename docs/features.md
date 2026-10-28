# **Features**

[← Back to README](../README.md)

## **Basic features (MVP)**

**Anonymous user**
- View the menu by category on the home page.

- View the detail of a product or combo.

- Add products to the cart and view the cart with quantities, subtotal, delivery costs and total.

- Choose whether the order is to eat in, take away or be delivered.

- Complete the checkout by filling in a contact form (with address and personal data).

- Pay by simulated payment (card or cash) and see the confirmation with the order number.

- Sign up and log in.

**Registered user**
- All the features of the anonymous user, but without filling in the checkout form, since the saved data is used.

- Basic profile: personal data, password change and saved addresses.

- View the order history.


**Employee**
- Order dashboard: pending and finished orders, sorted by age, with the option to change their status and to mark cash orders as paid.

- Counter ordering.

**Administrator**
- Product and combo management: basic CRUD.
- User management: basic CRUD of employees.


## **Intermediate features**

**Anonymous and registered user**

- Search engine and filters in the menu.

- Product customisation (removing ingredients).

- Recommendations section in the cart.

- Checkout logic: hide the cash payment if the order is delivered.

- Drop-down side panel to see the current order without leaving the page.

- Download of the order ticket in PDF.

**Registered user**
- Repeat the last order from the profile.

**Employee**
- Inventory view, with the ingredients highlighted in red if their stock is low.

- Cash register closing.

- Print or download the PDF ticket of any order.

**Administrator**
- Product management: association of each product with its list of ingredients and quantities.
- Inventory management: CRUD of ingredients and alert thresholds.
- Basic dashboard: daily sales chart.


## **Advanced features**

**Administrator**
- Full dashboard: best-selling products chart, daily or monthly view of the sales, average ticket and peak hours.
- Estimation of the remaining stock based on historical consumption.
