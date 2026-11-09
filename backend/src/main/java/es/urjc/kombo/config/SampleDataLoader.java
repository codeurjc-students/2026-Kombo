package es.urjc.kombo.config;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.model.Combo;
import es.urjc.kombo.model.Image;
import es.urjc.kombo.model.Ingredient;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.IngredientRepository;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.repository.ProductRepository;
import es.urjc.kombo.repository.UserRepository;

// Loads representative sample data when the application starts and the database is empty.
// It only exists when kombo.sample-data.enabled is true (the default value).
@Component
// Fully qualified because es.urjc.kombo.model.Order is also imported; runs after AdminInitializer
@org.springframework.core.annotation.Order(2)
@ConditionalOnProperty(name = "kombo.sample-data.enabled", havingValue = "true", matchIfMissing = true)
public class SampleDataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SampleDataLoader.class);

    private static final String IMAGES_FOLDER = "sample-images/";
    private static final String BURGERS = "Burgers";
    private static final String SIDES = "Sides";
    private static final String DRINKS = "Drinks";
    private static final String COMBOS = "Combos";

    private final IngredientRepository ingredientRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    private final Map<String, Ingredient> ingredients = new HashMap<>();
    private final Map<String, Product> products = new HashMap<>();

    public SampleDataLoader(IngredientRepository ingredientRepository, ProductRepository productRepository,
            UserRepository userRepository, OrderRepository orderRepository, PasswordEncoder passwordEncoder) {
        this.ingredientRepository = ingredientRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (productRepository.count() > 0) {
            log.info("Sample data not loaded: the database already has data");
            return;
        }
        createIngredients();
        createProducts();
        createCombos();
        User customer = createUsers();
        createOrders(customer);
        log.info("Sample data loaded: {} ingredients, {} products and combos, {} users and {} orders",
                ingredientRepository.count(), productRepository.count(), userRepository.count(),
                orderRepository.count());
    }

    private void createIngredients() {
        // name, unit, stock, alert limit (bacon starts below its limit to show a low stock ingredient)
        saveIngredient("Burger bun", "units", 200, 50);
        saveIngredient("Beef patty", "units", 150, 40);
        saveIngredient("Chicken fillet", "units", 100, 30);
        saveIngredient("Cheddar cheese", "slices", 300, 80);
        saveIngredient("Bacon", "slices", 40, 50);
        saveIngredient("Lettuce", "g", 3000, 1000);
        saveIngredient("Tomato", "g", 4000, 1000);
        saveIngredient("Mayonnaise", "g", 2000, 500);
        saveIngredient("Potatoes", "g", 20000, 5000);
        saveIngredient("Chicken nuggets", "units", 400, 100);
        saveIngredient("Cola", "units", 120, 30);
        saveIngredient("Orange soda", "units", 80, 20);
        saveIngredient("Water bottle", "units", 100, 30);
        saveIngredient("Vanilla ice cream", "g", 5000, 1000);
        saveIngredient("Chocolate sauce", "ml", 2000, 500);
    }

    private void createProducts() {
        // The first four products are the ones used by the existing UI and REST API tests
        saveProduct("Classic Burger", "8.50", "Beef burger with lettuce, tomato and cheese", BURGERS,
                Map.of("Burger bun", 1, "Beef patty", 1, "Cheddar cheese", 1, "Lettuce", 20, "Tomato", 30));
        saveProduct("Chicken Burger", "7.90", "Crispy chicken burger with mayonnaise", BURGERS,
                Map.of("Burger bun", 1, "Chicken fillet", 1, "Lettuce", 20, "Mayonnaise", 15));
        saveProduct("French Fries", "2.95", "Medium portion of fries", SIDES, Map.of("Potatoes", 150));
        saveProduct("Cola", "2.20", "500 ml soft drink", DRINKS, Map.of("Cola", 1));
        saveProduct("Bacon Cheeseburger", "9.90", "Double beef burger with bacon and cheddar cheese", BURGERS,
                Map.of("Burger bun", 1, "Beef patty", 2, "Cheddar cheese", 2, "Bacon", 2));
        saveProduct("Chicken Nuggets", "5.50", "Six chicken nuggets", SIDES, Map.of("Chicken nuggets", 6));
        saveProduct("Orange Soda", "2.20", "500 ml orange soft drink", DRINKS, Map.of("Orange soda", 1));
        saveProduct("Water", "1.50", "500 ml bottle of water", DRINKS, Map.of("Water bottle", 1));
        saveProduct("Chocolate Sundae", "3.50", "Vanilla ice cream with chocolate sauce", "Desserts",
                Map.of("Vanilla ice cream", 150, "Chocolate sauce", 30));
    }

    private void createCombos() {
        saveCombo("Classic Menu", "11.50", "Classic Burger, French Fries and Cola",
                Map.of("Classic Burger", 1, "French Fries", 1, "Cola", 1));
        saveCombo("Chicken Menu", "10.90", "Chicken Burger, French Fries and Orange Soda",
                Map.of("Chicken Burger", 1, "French Fries", 1, "Orange Soda", 1));
        saveCombo("Family Menu", "29.90", "Two Classic Burgers, two Chicken Burgers, four French Fries and four Colas",
                Map.of("Classic Burger", 2, "Chicken Burger", 2, "French Fries", 4, "Cola", 4));
    }

    // A customer and an employee (the administrator is created by AdminInitializer); returns the customer, who places some of the sample orders
    private User createUsers() {
        User customer = new User("Lucía", "García", "customer@kombo.com", "600111222",
                passwordEncoder.encode("customer"), User.Role.CUSTOMER);
        customer.addAddress("Calle Tulipán s/n, 28933 Móstoles, Madrid");
        userRepository.save(customer);
        userRepository.save(new User("Carlos", "López", "employee@kombo.com", "600333444",
                passwordEncoder.encode("employee"), User.Role.EMPLOYEE));
        return customer;
    }

    // Orders of the customer and of anonymous users, in every status
    private void createOrders(User customer) {
        Order delivered = new Order(customer, Order.DeliveryType.DELIVERY, Order.PaymentMethod.CARD);
        delivered.addLine(products.get("Classic Menu"), 1);
        delivered.addLine(products.get("Water"), 1);
        delivered.setDeliveryAddress(customer.getAddresses().get(0));
        delivered.setDeliveryCost(new BigDecimal("2.50"));
        delivered.setPaid(true);
        delivered.setStatus(Order.OrderStatus.DELIVERED);
        delivered.setDeliveredAt(LocalDateTime.now());
        saveOrder(delivered, 1);

        Order inPreparation = new Order(customer, Order.DeliveryType.TAKE_AWAY, Order.PaymentMethod.CASH);
        inPreparation.addLine(products.get("Chicken Burger"), 2);
        inPreparation.addLine(products.get("French Fries"), 1);
        saveOrder(inPreparation, 2);

        Order ready = new Order(null, Order.DeliveryType.EAT_IN, Order.PaymentMethod.CARD);
        ready.addLine(products.get("Family Menu"), 1);
        ready.setCustomerName("Pablo Sánchez");
        ready.setCustomerEmail("pablo@example.com");
        ready.setCustomerPhone("600777888");
        ready.setPaid(true);
        ready.setStatus(Order.OrderStatus.READY);
        saveOrder(ready, 3);

        Order cancelled = new Order(null, Order.DeliveryType.TAKE_AWAY, Order.PaymentMethod.CASH);
        cancelled.addLine(products.get("Cola"), 1);
        cancelled.setCustomerName("Marta Ruiz");
        cancelled.setCustomerPhone("600999000");
        cancelled.setStatus(Order.OrderStatus.CANCELLED);
        saveOrder(cancelled, 4);
    }

    private void saveIngredient(String name, String unit, int stock, int alertLimit) {
        ingredients.put(name, ingredientRepository.save(new Ingredient(name, unit, stock, alertLimit)));
    }

    private void saveProduct(String name, String price, String description, String category,
            Map<String, Integer> recipe) {
        Product product = new Product(name, new BigDecimal(price), description, category);
        recipe.forEach((ingredient, quantity) -> product.addIngredient(ingredients.get(ingredient), quantity));
        product.setImage(loadImage(name));
        products.put(name, productRepository.save(product));
    }

    private void saveCombo(String name, String price, String description, Map<String, Integer> items) {
        Combo combo = new Combo(name, new BigDecimal(price), description, COMBOS);
        items.forEach((product, quantity) -> combo.addProduct(products.get(product), quantity));
        combo.setImage(loadImage(name));
        products.put(name, productRepository.save(combo));
    }

    private void saveOrder(Order order, int orderNumber) {
        order.setOrderNumber(orderNumber);
        orderRepository.save(order);
    }

    // Reads resources/sample-images/<product-name>.jpg (or .png). Without the file, the product has no image.
    private Image loadImage(String productName) {
        String fileName = productName.toLowerCase(Locale.ROOT).replace(' ', '-');
        for (String extension : List.of("jpg", "png")) {
            ClassPathResource resource = new ClassPathResource(IMAGES_FOLDER + fileName + "." + extension);
            if (resource.exists()) {
                String contentType = extension.equals("png") ? "image/png" : "image/jpeg";
                return new Image(BlobProxy.generateProxy(readBytes(resource)), contentType, productName);
            }
        }
        log.warn("Sample image not found: {}{}.jpg", IMAGES_FOLDER, fileName);
        return null;
    }

    private static byte[] readBytes(ClassPathResource resource) {
        try (InputStream input = resource.getInputStream()) {
            return input.readAllBytes();
        } catch (IOException exception) {
            throw new UncheckedIOException("Sample image could not be read: " + resource.getPath(), exception);
        }
    }
}
