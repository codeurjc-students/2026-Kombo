package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.in;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.security.JwtService;
import io.restassured.http.ContentType;

// System tests of the order dashboard of the employees and of the counter orders: real server over HTTPS and
// database with the sample data. The orders of each test are placed by the test and deleted after it, so the
// sample orders do not change (other system tests count them).
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class OrderDashboardApiIT {

    private static final String COOKIE = JwtService.COOKIE_NAME;

    @LocalServerPort
    private int port;

    @Autowired
    private OrderRepository orderRepository;

    private final List<Long> testOrders = new ArrayList<>();

    @BeforeEach
    void setUp() {
        ApiTestSupport.configureHttps(port);
    }

    @AfterEach
    void deleteTheTestOrders() {
        orderRepository.deleteAllById(testOrders);
    }

    @Test
    void employeesSeeThePendingOrdersOldestFirstAndTheFinishedOnes() {
        String employee = employeeToken();
        long first = placeOrder("CARD");
        long second = placeOrder("CARD");

        List<Integer> pending = given().cookie(COOKIE, employee)
                .queryParam("status", "IN_PREPARATION", "READY").queryParam("size", 50)
                .when().get("/api/v1/orders")
                .then().statusCode(200)
                .body("content.status", everyItem(in(List.of("IN_PREPARATION", "READY"))))
                .extract().path("content.id");
        assertThat(pending.indexOf((int) first))
                .isGreaterThanOrEqualTo(0).isLessThan(pending.indexOf((int) second));

        given().cookie(COOKIE, employee)
                .queryParam("status", "DELIVERED", "CANCELLED").queryParam("sort", "createdAt,desc")
                .when().get("/api/v1/orders")
                .then().statusCode(200)
                .body("content.status", everyItem(in(List.of("DELIVERED", "CANCELLED"))))
                .body("page.totalElements", notNullValue());
    }

    @Test
    void anEmployeePreparesChargesAndDeliversACashOrder() {
        String employee = employeeToken();
        long id = placeOrder("CASH");
        String path = "/api/v1/orders/{id}";

        given().cookie(COOKIE, employee).contentType(ContentType.JSON).body("{\"status\":\"READY\"}")
                .when().patch(path, id)
                .then().statusCode(200)
                .body("status", equalTo("READY"))
                .body("paid", equalTo(false));

        // Not delivered before it is paid
        given().cookie(COOKIE, employee).contentType(ContentType.JSON).body("{\"status\":\"DELIVERED\"}")
                .when().patch(path, id)
                .then().statusCode(409)
                .contentType("application/problem+json")
                .body("detail", containsString("must be paid"));

        given().cookie(COOKIE, employee).contentType(ContentType.JSON).body("{\"paid\":true}")
                .when().patch(path, id)
                .then().statusCode(200)
                .body("paid", equalTo(true));

        given().cookie(COOKIE, employee).contentType(ContentType.JSON).body("{\"status\":\"DELIVERED\"}")
                .when().patch(path, id)
                .then().statusCode(200)
                .body("status", equalTo("DELIVERED"))
                .body("deliveredAt", notNullValue());

        // The finished orders of today: this one is the most recent
        String today = LocalDate.now().atStartOfDay().toString();
        given().cookie(COOKIE, employee)
                .queryParam("status", "DELIVERED", "CANCELLED").queryParam("since", today)
                .queryParam("sort", "createdAt,desc")
                .when().get("/api/v1/orders")
                .then().statusCode(200)
                .body("content[0].id", equalTo((int) id));
        String tomorrow = LocalDate.now().plusDays(1).atStartOfDay().toString();
        given().cookie(COOKIE, employee)
                .queryParam("status", "DELIVERED").queryParam("since", tomorrow)
                .when().get("/api/v1/orders")
                .then().statusCode(200)
                .body("page.totalElements", equalTo(0));
        given().cookie(COOKIE, employee).queryParam("since", "yesterday")
                .when().get("/api/v1/orders")
                .then().statusCode(400);
    }

    @Test
    void aFinishedOrderCannotChangeAndAWrongChangeReturns400() {
        String admin = ApiTestSupport.login("admin@kombo.com", "admin");
        long id = placeOrder("CARD");

        given().cookie(COOKIE, admin).contentType(ContentType.JSON).body("{\"status\":\"CANCELLED\"}")
                .when().patch("/api/v1/orders/{id}", id)
                .then().statusCode(200)
                .body("status", equalTo("CANCELLED"));
        given().cookie(COOKIE, admin).contentType(ContentType.JSON).body("{\"status\":\"READY\"}")
                .when().patch("/api/v1/orders/{id}", id)
                .then().statusCode(409);
        given().cookie(COOKIE, admin).contentType(ContentType.JSON).body("{}")
                .when().patch("/api/v1/orders/{id}", id)
                .then().statusCode(400);
        given().cookie(COOKIE, admin).contentType(ContentType.JSON).body("{\"status\":\"UNKNOWN\"}")
                .when().patch("/api/v1/orders/{id}", id)
                .then().statusCode(400);
        given().cookie(COOKIE, admin).contentType(ContentType.JSON).body("{\"status\":\"READY\"}")
                .when().patch("/api/v1/orders/{id}", 999999)
                .then().statusCode(404);
    }

    @Test
    void onlyEmployeesAndTheAdministratorManageTheOrders() {
        long id = placeOrder("CARD");
        String customer = ApiTestSupport.login("customer@kombo.com", "customer");

        given().when().get("/api/v1/orders").then().statusCode(401);
        given().cookie(COOKIE, customer).when().get("/api/v1/orders").then().statusCode(403);
        given().cookie(COOKIE, customer).contentType(ContentType.JSON).body("{\"status\":\"READY\"}")
                .when().patch("/api/v1/orders/{id}", id)
                .then().statusCode(403);
    }

    @Test
    void anEmployeePlacesACounterOrderWithOnlyTheNameOfTheCustomer() {
        int productId = given().queryParam("size", 50).when().get("/api/v1/products")
                .then().extract().path("content.find { it.name == 'Agua' }.id");

        int id = given().cookie(COOKIE, employeeToken()).contentType(ContentType.JSON)
                .body("""
                        {"lines":[{"productId":%d,"quantity":2}],"deliveryType":"EAT_IN",
                         "paymentMethod":"CASH","customerName":"Mesa 4","customerEmail":"","customerPhone":""}
                        """.formatted(productId))
                .when().post("/api/v1/orders")
                .then().statusCode(201)
                .body("userId", nullValue())
                .body("customerName", equalTo("Mesa 4"))
                .body("customerEmail", nullValue())
                .body("paid", equalTo(false))
                .extract().path("id");
        testOrders.add((long) id);
    }

    @Test
    void anAnonymousUserStillGivesTheirEmailAndPhone() {
        int productId = given().queryParam("size", 50).when().get("/api/v1/products")
                .then().extract().path("content.find { it.name == 'Agua' }.id");

        given().contentType(ContentType.JSON)
                .body("""
                        {"lines":[{"productId":%d,"quantity":1}],"deliveryType":"EAT_IN",
                         "paymentMethod":"CASH","customerName":"Ana","customerEmail":"","customerPhone":"600123456"}
                        """.formatted(productId))
                .when().post("/api/v1/orders")
                .then().statusCode(400)
                .body("detail", equalTo("customerEmail: is required"));
    }

    // Places an anonymous take away order of one water and returns its id
    private long placeOrder(String paymentMethod) {
        int productId = given().queryParam("size", 50).when().get("/api/v1/products")
                .then().extract().path("content.find { it.name == 'Agua' }.id");
        int id = given().contentType(ContentType.JSON)
                .body("""
                        {"lines":[{"productId":%d,"quantity":1}],"deliveryType":"TAKE_AWAY","paymentMethod":"%s",
                         "customerName":"Ana","customerEmail":"dashboard-test@example.com","customerPhone":"600123456"}
                        """.formatted(productId, paymentMethod))
                .when().post("/api/v1/orders")
                .then().statusCode(201)
                .extract().path("id");
        testOrders.add((long) id);
        return id;
    }

    private static String employeeToken() {
        return ApiTestSupport.login("employee@kombo.com", "employee");
    }
}
