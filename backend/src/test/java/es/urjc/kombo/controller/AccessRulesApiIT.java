package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.repository.UserRepository;
import es.urjc.kombo.security.JwtService;

// System tests of the access rules: 401 without login, 403 with a role that is not allowed
// and 403 when reading the data of another user
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class AccessRulesApiIT {

    private static final String COOKIE = JwtService.COOKIE_NAME;

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    private long customerId;
    private long employeeId;

    @BeforeEach
    void setUp() {
        ApiTestSupport.configureHttps(port);
        customerId = userRepository.findByEmail("customer@kombo.com").orElseThrow().getId();
        employeeId = userRepository.findByEmail("employee@kombo.com").orElseThrow().getId();
    }

    // 401 without login

    @Test
    void protectedEndpointsWithoutLoginReturn401() {
        given().when().get("/api/v1/users").then().statusCode(401);
        given().when().get("/api/v1/users/{id}", customerId).then().statusCode(401);
        given().when().get("/api/v1/users/{id}/orders", customerId).then().statusCode(401);
        given().when().get("/api/v1/orders/{id}", anonymousOrderId()).then().statusCode(401);
    }

    @Test
    void theMenuIsPublic() {
        given().when().get("/api/v1/products").then().statusCode(200);
    }

    // 403 with a role that is not allowed

    @Test
    void customersAndEmployeesCannotListTheUsers() {
        given().cookie(COOKIE, customerToken()).when().get("/api/v1/users")
                .then().statusCode(403)
                .contentType("application/problem+json")
                .body("status", equalTo(403));
        given().cookie(COOKIE, employeeToken()).when().get("/api/v1/users").then().statusCode(403);
    }

    @Test
    void theAdministratorListsTheUsers() {
        given().cookie(COOKIE, adminToken()).when().get("/api/v1/users")
                .then().statusCode(200)
                .body("page.totalElements", greaterThanOrEqualTo(3));
    }

    // 403 when reading the data of another user

    @Test
    void aUserReadsTheirOwnProfile() {
        given().cookie(COOKIE, customerToken()).when().get("/api/v1/users/{id}", customerId)
                .then().statusCode(200)
                .body("email", equalTo("customer@kombo.com"));
    }

    @Test
    void aUserCannotReadTheProfileOfAnotherUser() {
        given().cookie(COOKIE, customerToken()).when().get("/api/v1/users/{id}", employeeId)
                .then().statusCode(403);
        given().cookie(COOKIE, employeeToken()).when().get("/api/v1/users/{id}", customerId)
                .then().statusCode(403);
    }

    @Test
    void theAdministratorReadsAnyProfile() {
        given().cookie(COOKIE, adminToken()).when().get("/api/v1/users/{id}", customerId)
                .then().statusCode(200);
    }

    @Test
    void aCustomerReadsTheirOwnOrderHistory() {
        given().cookie(COOKIE, customerToken()).when().get("/api/v1/users/{id}/orders", customerId)
                .then().statusCode(200)
                .body("page.totalElements", equalTo(2))
                .body("content.userId", everyItem(equalTo((int) customerId)));
    }

    @Test
    void aUserCannotReadTheOrderHistoryOfAnotherUser() {
        given().cookie(COOKIE, employeeToken()).when().get("/api/v1/users/{id}/orders", customerId)
                .then().statusCode(403);
    }

    @Test
    void aCustomerReadsTheirOwnOrder() {
        given().cookie(COOKIE, customerToken()).when().get("/api/v1/orders/{id}", customerOrderId())
                .then().statusCode(200)
                .body("userId", equalTo((int) customerId));
    }

    @Test
    void aCustomerCannotReadTheOrderOfAnotherCustomer() {
        given().cookie(COOKIE, customerToken()).when().get("/api/v1/orders/{id}", anonymousOrderId())
                .then().statusCode(403);
    }

    @Test
    void employeesReadAnyOrder() {
        given().cookie(COOKIE, employeeToken()).when().get("/api/v1/orders/{id}", anonymousOrderId())
                .then().statusCode(200);
    }

    @Test
    void anOrderThatDoesNotExistReturns404() {
        given().cookie(COOKIE, employeeToken()).when().get("/api/v1/orders/{id}", 999999)
                .then().statusCode(404);
    }

    private String customerToken() {
        return ApiTestSupport.login("customer@kombo.com", "customer");
    }

    private String employeeToken() {
        return ApiTestSupport.login("employee@kombo.com", "employee");
    }

    private String adminToken() {
        return ApiTestSupport.login("admin@kombo.com", "admin");
    }

    private long customerOrderId() {
        return orderRepository.findAll().stream()
                .filter(order -> order.getUser() != null).findFirst().map(Order::getId).orElseThrow();
    }

    private long anonymousOrderId() {
        return orderRepository.findAll().stream()
                .filter(order -> order.getUser() == null).findFirst().map(Order::getId).orElseThrow();
    }
}
