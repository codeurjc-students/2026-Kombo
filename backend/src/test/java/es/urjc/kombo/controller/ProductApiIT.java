package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItems;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

import es.urjc.kombo.TestcontainersConfiguration;
import io.restassured.RestAssured;

// System tests of the REST API: real server and database with the sample data
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class ProductApiIT {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
    }

    @Test
    void getProductsReturnsTheFirstPageOfProducts() {
        given().when().get("/api/v1/products")
                .then().statusCode(200)
                .body("content.name", hasItems("Classic Burger", "Chicken Burger", "French Fries", "Cola"))
                .body("page.number", equalTo(0))
                .body("page.size", equalTo(10));
    }

    @Test
    void getProductsFiltersByCategory() {
        given().queryParam("category", "Drinks")
                .when().get("/api/v1/products")
                .then().statusCode(200)
                .body("content.name", contains("Cola"));
    }

    @Test
    void getProductReturnsTheProductDetail() {
        int id = given().queryParam("category", "Sides")
                .when().get("/api/v1/products")
                .then().extract().path("content[0].id");

        given().when().get("/api/v1/products/{id}", id)
                .then().statusCode(200)
                .body("name", equalTo("French Fries"))
                .body("combo", equalTo(false));
    }

    @Test
    void getProductThatDoesNotExistReturns404() {
        given().when().get("/api/v1/products/{id}", 999999)
                .then().statusCode(404)
                .contentType("application/problem+json")
                .body("status", equalTo(404))
                .body("title", equalTo("Not Found"))
                .body("detail", equalTo("Product 999999 not found"));
    }

    @Test
    void getProductWithAnInvalidIdReturns400() {
        given().when().get("/api/v1/products/abc")
                .then().statusCode(400)
                .contentType("application/problem+json")
                .body("status", equalTo(400));
    }
}
