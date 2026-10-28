# Analysis

[← Back to README](../README.md)

The screen mockups and the navigation flow are in the [README](../README.md).

## Entities
1. **Entity 1**: User.
2. **Entity 2**: Ingredient.
3. **Entity 3**: Order.
4. **Entity 4**: Product.
5. **Entity 5**: Image.

- User - Order (1:N): a user can place several orders, but an order belongs to one user (anonymous orders will not have a user).

- Order - Product (N:N): an order is made up of N products and a product can belong to N orders.

- Product - Ingredient (N:N): a product contains N ingredients and an ingredient can be in N products.

- Image - User (1:1): each user has an associated image and an image belongs to one user.

- Image - Product (1:1): each product has an associated image and an image belongs to one product.

### Entity attributes
**User**
- Id: identifier.
- Full name.
- Email.
- Phone number.
- Image.
- Password.
- Role.
- Addresses.
- Last order.

**Product**
- Id: identifier.
- Name.
- Image.
- Price.
- Description.
- Category.
- Active: boolean that indicates whether it is shown to users.

**Ingredient**
- Id: identifier.
- Name.
- Unit of measurement.
- Current stock.
- Alert threshold.

**Order**
- Id: identifier.
- Order number.
- User.
- Delivery type: eat in, take away or delivery.
- Delivery address.
- Status: in preparation, ready, delivered or cancelled.
- Creation date.
- Delivery date.
- Price.

**Image**
- Id: identifier.
- Text.



## User permissions

| Action | Anonymous | Customer | Employee | Administrator |
| :----- | :-----: | :-----: | :------: | :-----------: |
| View the menu, the product detail and the recommendations | X | X | X | X |
| Sign up | X | | | |
| Log in | | X | X | X |
| Create an order and pay it (simulated payment) | X | X | X | |
| Check out without filling in the data form | | X | | |
| Download the PDF ticket of their own order | X | X | | |
| View their order history and repeat the last one | | X | | |
| Manage their profile | | X | X | |
| Manage their saved addresses | | X | | |
| View all the orders | | | X | X |
| Change the status of an order and mark a cash payment as paid | | | X | |
| Download the PDF ticket of any order | | | X | X |
| View the ingredient inventory | | | X | X |
| View the cash register closing | | | X | X |
| Manage products (create, edit, delete, picture) | | | | X |
| Manage ingredients and restock | | | | X |
| Manage employees | | | | X |
| View the dashboard and the sales reports | | | | X |


## Entities with associated images
- **User**: profile picture. A default one will be set when the user is created, and the user will be able to change it in the settings.

- **Product**: picture of the product.


## Complementary technology
- **PDF order ticket generation**: the ticket of each order will be generated in a PDF. It will contain the name of the restaurant, the order number, the products of the order and the price paid.

- **Email sending** to users when they sign up on the website.


## Advanced query algorithm
- **Cart recommendations**: users will be recommended products they can buy based on the products most often bought together with the ones already in the cart.


## Charts
- **Daily sales chart**: a bar chart showing the number of orders sold per hour.
- **Best-selling products chart**: a pie chart showing the best-selling products of the month.
