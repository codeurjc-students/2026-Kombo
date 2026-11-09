package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.security.JwtService;

// The server returns the client (index.html) for its routes, and keeps the 404 of the REST API
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class SpaForwardingIT {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        ApiTestSupport.configureHttps(port);
    }

    @Test
    void theRootReturnsTheClient() {
        given().when().get("/").then().statusCode(200).body(containsString("kombo-spa"));
    }

    @Test
    void clientRoutesReturnTheClient() {
        given().when().get("/profile").then().statusCode(200).body(containsString("kombo-spa"));
        given().when().get("/admin/users").then().statusCode(200).body(containsString("kombo-spa"));
    }

    // Without login the security rules answer first with 401
    @Test
    void unknownApiEndpointsReturn404() {
        String token = ApiTestSupport.login("employee@kombo.com", "employee");
        given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/unknown").then().statusCode(404);
        given().when().get("/api/v1/unknown").then().statusCode(401);
    }

    @Test
    void missingFilesReturn404() {
        given().when().get("/assets/missing.js").then().statusCode(404);
    }
}
