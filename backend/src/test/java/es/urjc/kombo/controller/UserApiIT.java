package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.repository.UserRepository;
import es.urjc.kombo.security.JwtService;
import io.restassured.http.ContentType;

// System tests of the sign up: real server over HTTPS and database with the sample data
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class UserApiIT {

    private static final String NEW_USER = """
            {"name":"Ana","surname":"Martín","email":"ana@example.com","phone":"600123456","password":"secret-password"}
            """;

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        ApiTestSupport.configureHttps(port);
        userRepository.findByEmail("ana@example.com").ifPresent(userRepository::delete);
    }

    @Test
    void signUpCreatesACustomerWhoCanLogIn() {
        int id = given().contentType(ContentType.JSON).body(NEW_USER)
                .when().post("/api/v1/users")
                .then().statusCode(201)
                .header("Location", containsString("/api/v1/users/"))
                .body("email", equalTo("ana@example.com"))
                .body("role", equalTo("CUSTOMER"))
                .body("$", not(hasKey("password")))
                .extract().path("id");

        String token = ApiTestSupport.login("ana@example.com", "secret-password");
        given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/users/{id}", id)
                .then().statusCode(200)
                .body("name", equalTo("Ana"));
    }

    @Test
    void signUpWithAnEmailThatIsAlreadyRegisteredReturns409() {
        given().contentType(ContentType.JSON)
                .body("{\"name\":\"Lucía\",\"email\":\"customer@kombo.com\",\"password\":\"secret-password\"}")
                .when().post("/api/v1/users")
                .then().statusCode(409)
                .contentType("application/problem+json")
                .body("detail", equalTo("The email customer@kombo.com is already registered"));
    }

    @Test
    void signUpWithInvalidFieldsReturns400WithTheFields() {
        given().contentType(ContentType.JSON)
                .body("{\"name\":\"\",\"email\":\"not-an-email\",\"password\":\"short\"}")
                .when().post("/api/v1/users")
                .then().statusCode(400)
                .contentType("application/problem+json")
                .body("detail", containsString("email:"))
                .body("detail", containsString("name:"))
                .body("detail", containsString("password:"));
    }

    // The role is always CUSTOMER: a "role" field in the body is ignored
    @Test
    void signUpCannotChooseTheRole() {
        given().contentType(ContentType.JSON)
                .body("{\"name\":\"Ana\",\"email\":\"ana@example.com\",\"password\":\"secret-password\",\"role\":\"ADMIN\"}")
                .when().post("/api/v1/users")
                .then().statusCode(201)
                .body("role", equalTo("CUSTOMER"));
    }
}
