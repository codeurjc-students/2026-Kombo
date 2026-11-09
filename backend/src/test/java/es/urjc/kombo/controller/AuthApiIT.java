package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.security.JwtService;
import io.restassured.http.ContentType;

// System tests of the authentication endpoints: real server over HTTPS and database with the sample data
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class AuthApiIT {

    private static final String COOKIE = JwtService.COOKIE_NAME;

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        ApiTestSupport.configureHttps(port);
    }

    @Test
    void loginReturnsTheUserAndAnHttpOnlySecureCookie() {
        given().contentType(ContentType.JSON)
                .body("{\"email\":\"customer@kombo.com\",\"password\":\"customer\"}")
                .when().post("/api/v1/auth/login")
                .then().statusCode(200)
                .header("Set-Cookie", containsString(COOKIE + "="))
                .header("Set-Cookie", containsString("HttpOnly"))
                .header("Set-Cookie", containsString("Secure"))
                .header("Set-Cookie", containsString("SameSite=Strict"))
                .body("email", equalTo("customer@kombo.com"))
                .body("role", equalTo("CUSTOMER"))
                .body("$", not(hasKey("password")));
    }

    @Test
    void loginWithAWrongPasswordReturns401() {
        given().contentType(ContentType.JSON)
                .body("{\"email\":\"customer@kombo.com\",\"password\":\"wrong\"}")
                .when().post("/api/v1/auth/login")
                .then().statusCode(401)
                .contentType("application/problem+json")
                .body("status", equalTo(401));
    }

    @Test
    void loginOfAnUnknownUserReturns401() {
        given().contentType(ContentType.JSON)
                .body("{\"email\":\"nobody@kombo.com\",\"password\":\"customer\"}")
                .when().post("/api/v1/auth/login")
                .then().statusCode(401);
    }

    @Test
    void theAdministratorLogsInWithThePasswordOfTheConfiguration() {
        String token = ApiTestSupport.login("admin@kombo.com", "admin");

        given().cookie(COOKIE, token).when().get("/api/v1/auth/me")
                .then().statusCode(200)
                .body("role", equalTo("ADMIN"));
    }

    @Test
    void meReturnsTheLoggedInUser() {
        String token = ApiTestSupport.login("employee@kombo.com", "employee");

        given().cookie(COOKIE, token).when().get("/api/v1/auth/me")
                .then().statusCode(200)
                .body("email", equalTo("employee@kombo.com"))
                .body("role", equalTo("EMPLOYEE"));
    }

    @Test
    void meWithoutLoginReturns401() {
        given().when().get("/api/v1/auth/me")
                .then().statusCode(401)
                .contentType("application/problem+json")
                .body("status", equalTo(401));
    }

    @Test
    void meWithAnInvalidTokenReturns401() {
        given().cookie(COOKIE, "not-a-valid-token").when().get("/api/v1/auth/me")
                .then().statusCode(401);
    }

    @Test
    void logoutDeletesTheCookie() {
        given().when().post("/api/v1/auth/logout")
                .then().statusCode(204)
                .header("Set-Cookie", containsString(COOKIE + "=;"))
                .header("Set-Cookie", containsString("Max-Age=0"));
    }
}
