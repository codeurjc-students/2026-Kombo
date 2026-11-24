package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.support.TransactionTemplate;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.repository.UserRepository;
import es.urjc.kombo.security.JwtService;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

// System tests of the checkout: real server over HTTPS and database with the sample data.
// The whole flow goes through HTTP: read the menu and the delivery cost, place the order and read it back.
// The orders placed here, the addresses they save in the profile of the customer and the users they sign up
// are deleted after each test, because the other system tests share the database and count the sample data
// (for example the order history of the customer in AccessRulesApiIT).
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class OrderApiIT {

    // Every order of these tests uses this email; the sample orders do not
    private static final String TEST_EMAIL = "ana@example.com";
    // Home deliveries of the customer use this address, which is saved in their profile
    private static final String TEST_ADDRESS = "Calle de las Pruebas 1";
    private static final String OTHER_CUSTOMER = "other-customer@example.com";

    @LocalServerPort
    private int port;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void setUp() {
        ApiTestSupport.configureHttps(port);
    }

    @AfterEach
    void deleteTheTestOrders() {
        orderRepository.deleteAll(orderRepository.findAll().stream()
                .filter(order -> TEST_EMAIL.equals(order.getCustomerEmail()))
                .toList());
        // The addresses are loaded lazily, so they are changed inside a transaction
        transactionTemplate.executeWithoutResult(status -> userRepository.findByEmail("customer@kombo.com")
                .ifPresent(customer -> customer.removeAddress(TEST_ADDRESS)));
        userRepository.findByEmail(OTHER_CUSTOMER).ifPresent(userRepository::delete);
    }

    @Test
    void aCustomerPlacesAHomeDeliveryAndFindsItInTheirHistory() {
        String token = ApiTestSupport.login("customer@kombo.com", "customer");
        int customerId = given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/auth/me")
                .then().statusCode(200).extract().path("id");
        int burgerId = productId("Hamburguesa clásica");
        float deliveryCost = given().when().get("/api/v1/settings")
                .then().statusCode(200).extract().path("deliveryCost");

        String location = given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON)
                .body(order(burgerId, 2, "DELIVERY", "\"" + TEST_ADDRESS + "\"", "CASH"))
                .when().post("/api/v1/orders")
                .then().statusCode(201)
                .header("Location", containsString("/api/v1/orders/"))
                .body("userId", equalTo(customerId))
                .body("lines[0].productName", equalTo("Hamburguesa clásica"))
                .body("lines[0].unitPrice", equalTo(8.5f))
                .body("subtotal", equalTo(17.0f))
                .body("deliveryCost", equalTo(deliveryCost))
                .body("total", equalTo(17.0f + deliveryCost))
                .body("status", equalTo("IN_PREPARATION"))
                .body("paid", equalTo(false))
                .extract().header("Location");
        int orderId = Integer.parseInt(location.substring(location.lastIndexOf('/') + 1));

        given().cookie(JwtService.COOKIE_NAME, token).when().get(location)
                .then().statusCode(200)
                .body("id", equalTo(orderId))
                .body("orderNumber", equalTo(1000 + orderId));
        given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/users/me/orders")
                .then().statusCode(200)
                .body("content.id", hasItem(orderId));
    }

    @Test
    void aCustomerReadsTheirHistoryAndKeepsTheNewAddress() {
        String token = ApiTestSupport.login("customer@kombo.com", "customer");
        int customerId = given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/auth/me")
                .then().extract().path("id");
        int orderId = given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON)
                .body(order(productId("Agua"), 1, "DELIVERY", "\"" + TEST_ADDRESS + "\"", "CARD"))
                .when().post("/api/v1/orders")
                .then().statusCode(201).extract().path("id");

        // The newest order comes first, and the history only has orders of the customer
        given().cookie(JwtService.COOKIE_NAME, token).queryParam("size", 4)
                .when().get("/api/v1/users/me/orders")
                .then().statusCode(200)
                .body("content[0].id", equalTo(orderId))
                .body("content[0].lines[0].productName", equalTo("Agua"))
                .body("content.userId", everyItem(equalTo(customerId)))
                .body("page.size", equalTo(4));
        // The new address is now in the profile, to be chosen in the next checkout
        given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/auth/me")
                .then().body("addresses", hasItem(TEST_ADDRESS));
    }

    @Test
    void theHistoryNeedsASessionAndOnlyTheOwnerReadsAnOrder() {
        given().when().get("/api/v1/users/me/orders").then().statusCode(401);

        String customer = ApiTestSupport.login("customer@kombo.com", "customer");
        int orderOfTheCustomer = given().cookie(JwtService.COOKIE_NAME, customer)
                .when().get("/api/v1/users/me/orders")
                .then().extract().path("content[0].id");
        given().contentType(ContentType.JSON)
                .body("{\"name\":\"Otro\",\"email\":\"" + OTHER_CUSTOMER + "\",\"password\":\"secret-password\"}")
                .when().post("/api/v1/users").then().statusCode(201);
        String other = ApiTestSupport.login(OTHER_CUSTOMER, "secret-password");

        given().cookie(JwtService.COOKIE_NAME, other).when().get("/api/v1/orders/{id}", orderOfTheCustomer)
                .then().statusCode(403);
        given().cookie(JwtService.COOKIE_NAME, other).when().get("/api/v1/users/me/orders")
                .then().statusCode(200)
                .body("page.totalElements", equalTo(0));
    }

    @Test
    void anAnonymousUserPlacesAnOrderPaidByCard() {
        given().contentType(ContentType.JSON)
                .body(order(productId("Agua"), 1, "TAKE_AWAY", "null", "CARD"))
                .when().post("/api/v1/orders")
                .then().statusCode(201)
                .header("Location", containsString("/api/v1/orders/"))
                .body("userId", equalTo(null))
                .body("deliveryCost", equalTo(0))
                .body("paid", equalTo(true));
    }

    @Test
    void anOrderWithoutAddressOrWithWrongDataReturns400() {
        given().contentType(ContentType.JSON)
                .body(order(productId("Agua"), 1, "DELIVERY", "null", "CARD"))
                .when().post("/api/v1/orders")
                .then().statusCode(400)
                .contentType("application/problem+json")
                .body("detail", containsString("deliveryAddress"));

        given().contentType(ContentType.JSON)
                .body("{\"lines\":[],\"deliveryType\":\"EAT_IN\",\"paymentMethod\":\"CARD\",\"customerName\":\"\","
                        + "\"customerEmail\":\"not-an-email\",\"customerPhone\":\"12\"}")
                .when().post("/api/v1/orders")
                .then().statusCode(400)
                .body("detail", containsString("lines:"))
                .body("detail", containsString("customerEmail:"))
                .body("detail", containsString("customerPhone:"));
    }

    @Test
    void theAdministratorCannotPlaceOrders() {
        String token = ApiTestSupport.login("admin@kombo.com", "admin");

        given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON)
                .body(order(productId("Agua"), 1, "EAT_IN", "null", "CARD"))
                .when().post("/api/v1/orders")
                .then().statusCode(403);
    }

    @Test
    void onlyTheAdministratorChangesTheDeliveryCost() {
        String customer = ApiTestSupport.login("customer@kombo.com", "customer");
        given().cookie(JwtService.COOKIE_NAME, customer).contentType(ContentType.JSON)
                .body("{\"deliveryCost\":1.00,\"cancellationFeePercent\":80}")
                .when().put("/api/v1/settings")
                .then().statusCode(403);

        String admin = ApiTestSupport.login("admin@kombo.com", "admin");
        float previous = given().when().get("/api/v1/settings").then().extract().path("deliveryCost");
        int previousPercent = given().when().get("/api/v1/settings").then().extract().path("cancellationFeePercent");
        try {
            given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                    .body("{\"deliveryCost\":3.10,\"cancellationFeePercent\":50}")
                    .when().put("/api/v1/settings")
                    .then().statusCode(200)
                    .body("deliveryCost", equalTo(3.1f))
                    .body("freeDeliveryThreshold", equalTo(25.0f))
                    .body("cancellationFeePercent", equalTo(50));
            given().contentType(ContentType.JSON)
                    .body(order(productId("Agua"), 1, "DELIVERY", "\"Calle Mayor 1\"", "CARD"))
                    .when().post("/api/v1/orders")
                    .then().statusCode(201)
                    .body("deliveryCost", equalTo(3.1f));
            given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                    .body("{\"deliveryCost\":-1,\"cancellationFeePercent\":80}")
                    .when().put("/api/v1/settings")
                    .then().statusCode(400);
            given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                    .body("{\"deliveryCost\":3.10,\"cancellationFeePercent\":101}")
                    .when().put("/api/v1/settings")
                    .then().statusCode(400);
        } finally {
            given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                    .body("{\"deliveryCost\":" + previous + ",\"cancellationFeePercent\":" + previousPercent + "}")
                    .when().put("/api/v1/settings")
                    .then().statusCode(200);
        }
    }

    @Test
    void thePhoneIsOptionalExceptForHomeDeliveries() {
        int water = productId("Agua");
        given().contentType(ContentType.JSON)
                .body(withoutPhone(order(water, 1, "TAKE_AWAY", "null", "CASH")))
                .when().post("/api/v1/orders")
                .then().statusCode(201)
                .body("customerPhone", equalTo(null));
        given().contentType(ContentType.JSON)
                .body(withoutPhone(order(water, 1, "DELIVERY", "\"Calle Mayor 1\"", "CASH")))
                .when().post("/api/v1/orders")
                .then().statusCode(400)
                .body("detail", equalTo("customerPhone: is required for home deliveries"));
    }

    // Cancellation by the customer

    @Test
    void aCustomerCancelsTheirOrderInPreparationWithoutAFee() {
        String customer = ApiTestSupport.login("customer@kombo.com", "customer");
        int id = placeOrderAs(customer, "CARD");

        cancelAs(customer, id)
                .then().statusCode(200)
                .body("status", equalTo("CANCELLED"))
                .body("paid", equalTo(true))
                .body("cancellationFee", equalTo(0));
        // Once it is cancelled it cannot be cancelled again
        cancelAs(customer, id).then().statusCode(409);
    }

    @Test
    void aCustomerWhoCancelsAPaidReadyOrderPaysThePercentageOfTheSettings() {
        String customer = ApiTestSupport.login("customer@kombo.com", "customer");
        int id = placeOrderAs(customer, "CARD");
        given().cookie(JwtService.COOKIE_NAME, ApiTestSupport.login("employee@kombo.com", "employee"))
                .contentType(ContentType.JSON).body("{\"status\":\"READY\"}")
                .when().patch("/api/v1/orders/{id}", id)
                .then().statusCode(200);
        int percent = given().when().get("/api/v1/settings").then().extract().path("cancellationFeePercent");

        var cancelled = cancelAs(customer, id).then().statusCode(200).extract().jsonPath();

        BigDecimal total = new BigDecimal(cancelled.getString("total"));
        BigDecimal expected = total.multiply(BigDecimal.valueOf(percent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        assertThat(new BigDecimal(cancelled.getString("cancellationFee"))).isEqualByComparingTo(expected);
    }

    @Test
    void aCustomerOnlyCancelsTheirOwnOrdersAndCannotChangeThemOtherwise() {
        String customer = ApiTestSupport.login("customer@kombo.com", "customer");
        int anonymous = given().contentType(ContentType.JSON)
                .body(order(productId("Agua"), 1, "TAKE_AWAY", "null", "CASH"))
                .when().post("/api/v1/orders")
                .then().statusCode(201).extract().path("id");
        int own = placeOrderAs(customer, "CASH");

        cancelAs(customer, anonymous).then().statusCode(403);
        given().cookie(JwtService.COOKIE_NAME, customer).contentType(ContentType.JSON)
                .body("{\"status\":\"READY\"}")
                .when().patch("/api/v1/orders/{id}", own)
                .then().statusCode(403);
        given().contentType(ContentType.JSON).body("{\"status\":\"CANCELLED\"}")
                .when().patch("/api/v1/orders/{id}", own)
                .then().statusCode(401);
    }

    private static int placeOrderAs(String token, String payment) {
        return given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON)
                .body(order(productId("Agua"), 2, "TAKE_AWAY", "null", payment))
                .when().post("/api/v1/orders")
                .then().statusCode(201).extract().path("id");
    }

    private static Response cancelAs(String token, int id) {
        return given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON)
                .body("{\"status\":\"CANCELLED\"}")
                .when().patch("/api/v1/orders/{id}", id);
    }

    private static String withoutPhone(String order) {
        return order.replace("\"customerPhone\":\"600123456\"", "\"customerPhone\":\"\"");
    }

    private static int productId(String name) {
        return given().queryParam("size", 50).when().get("/api/v1/products")
                .then().statusCode(200)
                .extract().path("content.find { it.name == '" + name + "' }.id");
    }

    private static String order(int productId, int quantity, String deliveryType, String address, String payment) {
        return """
                {"lines":[{"productId":%d,"quantity":%d}],"deliveryType":"%s","deliveryAddress":%s,
                 "paymentMethod":"%s","customerName":"Ana Pérez","customerEmail":"%s",
                 "customerPhone":"600123456"}
                """.formatted(productId, quantity, deliveryType, address, payment, TEST_EMAIL);
    }
}
