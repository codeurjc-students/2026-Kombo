package es.urjc.kombo.config;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
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

    // Names, descriptions and units are in Spanish because the application shows them to the users
    private void createIngredients() {
        // name, unit, stock, alert limit (bacon starts below its limit to show a low stock ingredient)
        saveIngredient("Pan de hamburguesa", "unidades", 200, 50);
        saveIngredient("Carne de ternera", "unidades", 150, 40);
        saveIngredient("Filete de pollo", "unidades", 100, 30);
        saveIngredient("Queso cheddar", "lonchas", 300, 80);
        saveIngredient("Bacon", "lonchas", 40, 50);
        saveIngredient("Lechuga", "g", 3000, 1000);
        saveIngredient("Tomate", "g", 4000, 1000);
        saveIngredient("Mayonesa", "g", 2000, 500);
        saveIngredient("Patatas", "g", 20000, 5000);
        saveIngredient("Nuggets de pollo", "unidades", 400, 100);
        saveIngredient("Refresco de cola", "unidades", 120, 30);
        saveIngredient("Refresco de naranja", "unidades", 80, 20);
        saveIngredient("Botella de agua", "unidades", 100, 30);
        saveIngredient("Helado de vainilla", "g", 5000, 1000);
        saveIngredient("Sirope de chocolate", "ml", 2000, 500);
    }

    // Each product has a key in English, which is also the name of its picture in sample-images/.
    // The first four products are the ones used by the existing UI and REST API tests.
    private void createProducts() {
        saveProduct("classic-burger", "Hamburguesa clásica", "8.50",
                "Hamburguesa de ternera con lechuga, tomate y queso", BURGERS,
                Map.of("Pan de hamburguesa", 1, "Carne de ternera", 1, "Queso cheddar", 1, "Lechuga", 20, "Tomate", 30));
        saveProduct("chicken-burger", "Hamburguesa de pollo", "7.90", "Hamburguesa de pollo crujiente con mayonesa",
                BURGERS, Map.of("Pan de hamburguesa", 1, "Filete de pollo", 1, "Lechuga", 20, "Mayonesa", 15));
        saveProduct("french-fries", "Patatas fritas", "2.95", "Ración mediana de patatas fritas", SIDES,
                Map.of("Patatas", 150));
        saveProduct("cola", "Refresco de cola", "2.20", "Refresco de cola de 500 ml", DRINKS,
                Map.of("Refresco de cola", 1));
        saveProduct("bacon-cheeseburger", "Hamburguesa doble con bacon", "9.90",
                "Doble hamburguesa de ternera con bacon y queso cheddar", BURGERS,
                Map.of("Pan de hamburguesa", 1, "Carne de ternera", 2, "Queso cheddar", 2, "Bacon", 2));
        saveProduct("chicken-nuggets", "Nuggets de pollo", "5.50", "Seis nuggets de pollo", SIDES,
                Map.of("Nuggets de pollo", 6));
        saveProduct("orange-soda", "Refresco de naranja", "2.20", "Refresco de naranja de 500 ml", DRINKS,
                Map.of("Refresco de naranja", 1));
        saveProduct("water", "Agua", "1.50", "Botella de agua de 500 ml", DRINKS, Map.of("Botella de agua", 1));
        saveProduct("chocolate-sundae", "Sundae de chocolate", "3.50", "Helado de vainilla con sirope de chocolate",
                "Desserts", Map.of("Helado de vainilla", 150, "Sirope de chocolate", 30));
    }

    private void createCombos() {
        saveCombo("classic-menu", "Menú clásico", "11.50", "Hamburguesa clásica, patatas fritas y refresco de cola",
                Map.of("classic-burger", 1, "french-fries", 1, "cola", 1));
        saveCombo("chicken-menu", "Menú de pollo", "10.90",
                "Hamburguesa de pollo, patatas fritas y refresco de naranja",
                Map.of("chicken-burger", 1, "french-fries", 1, "orange-soda", 1));
        saveCombo("family-menu", "Menú familiar", "29.90",
                "Dos hamburguesas clásicas, dos de pollo, cuatro raciones de patatas fritas y cuatro refrescos de cola",
                Map.of("classic-burger", 2, "chicken-burger", 2, "french-fries", 4, "cola", 4));
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
        delivered.addLine(products.get("classic-menu"), 1);
        delivered.addLine(products.get("water"), 1);
        delivered.setDeliveryAddress(customer.getAddresses().get(0));
        delivered.setDeliveryCost(new BigDecimal("2.50"));
        delivered.setPaid(true);
        delivered.setStatus(Order.OrderStatus.DELIVERED);
        delivered.setDeliveredAt(LocalDateTime.now());
        saveOrder(delivered, 1);

        Order inPreparation = new Order(customer, Order.DeliveryType.TAKE_AWAY, Order.PaymentMethod.CASH);
        inPreparation.addLine(products.get("chicken-burger"), 2);
        inPreparation.addLine(products.get("french-fries"), 1);
        saveOrder(inPreparation, 2);

        Order ready = new Order(null, Order.DeliveryType.EAT_IN, Order.PaymentMethod.CARD);
        ready.addLine(products.get("family-menu"), 1);
        ready.setCustomerName("Pablo Sánchez");
        ready.setCustomerEmail("pablo@example.com");
        ready.setCustomerPhone("600777888");
        ready.setPaid(true);
        ready.setStatus(Order.OrderStatus.READY);
        saveOrder(ready, 3);

        Order cancelled = new Order(null, Order.DeliveryType.TAKE_AWAY, Order.PaymentMethod.CASH);
        cancelled.addLine(products.get("cola"), 1);
        cancelled.setCustomerName("Marta Ruiz");
        cancelled.setCustomerPhone("600999000");
        cancelled.setStatus(Order.OrderStatus.CANCELLED);
        saveOrder(cancelled, 4);
    }

    private void saveIngredient(String name, String unit, int stock, int alertLimit) {
        ingredients.put(name, ingredientRepository.save(new Ingredient(name, unit, stock, alertLimit)));
    }

    private void saveProduct(String key, String name, String price, String description, String category,
            Map<String, Integer> recipe) {
        Product product = new Product(name, new BigDecimal(price), description, category);
        recipe.forEach((ingredient, quantity) -> product.addIngredient(ingredients.get(ingredient), quantity));
        product.setImage(loadImage(key, name));
        products.put(key, productRepository.save(product));
    }

    private void saveCombo(String key, String name, String price, String description, Map<String, Integer> items) {
        Combo combo = new Combo(name, new BigDecimal(price), description, COMBOS);
        items.forEach((product, quantity) -> combo.addProduct(products.get(product), quantity));
        combo.setImage(loadImage(key, name));
        products.put(key, productRepository.save(combo));
    }

    private void saveOrder(Order order, int orderNumber) {
        order.setOrderNumber(orderNumber);
        orderRepository.save(order);
    }

    // Reads resources/sample-images/<key>.jpg (or .jpeg or .png). Without the file, the product has no image.
    private Image loadImage(String key, String productName) {
        for (String extension : List.of("jpg", "jpeg", "png")) {
            ClassPathResource resource = new ClassPathResource(IMAGES_FOLDER + key + "." + extension);
            if (resource.exists()) {
                String contentType = extension.equals("png") ? "image/png" : "image/jpeg";
                return new Image(BlobProxy.generateProxy(readBytes(resource)), contentType, productName);
            }
        }
        log.warn("Sample image not found: {}{}.jpg", IMAGES_FOLDER, key);
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
