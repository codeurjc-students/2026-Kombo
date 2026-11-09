package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;

import es.urjc.kombo.security.JwtService;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

// Common setup of the REST API system tests
final class ApiTestSupport {

    private ApiTestSupport() {
    }

    // The server only listens on HTTPS with a self-signed certificate (generated for the tests),
    // so RestAssured is told not to validate it
    static void configureHttps(int port) {
        RestAssured.baseURI = "https://localhost";
        RestAssured.port = port;
        RestAssured.useRelaxedHTTPSValidation();
    }

    // Logs in with the sample users and returns the value of the session cookie
    static String login(String email, String password) {
        return given().contentType(ContentType.JSON)
                .body("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")
                .when().post("/api/v1/auth/login")
                .then().statusCode(200)
                .extract().cookie(JwtService.COOKIE_NAME);
    }
}
