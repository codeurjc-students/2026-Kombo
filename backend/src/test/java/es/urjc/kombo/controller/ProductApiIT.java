package es.urjc.kombo.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.hamcrest.Matchers.hasItems;
import static io.restassured.RestAssured.given;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.testcontainers.utility.TestcontainersConfiguration;

import io.restassured.RestAssured;

@SpringBootTest (webEnvironment = WebEnvironment.RANDOM_PORT)
@Import (TestcontainersConfiguration.class)
public class ProductApiIT {
    @LocalServerPort 
    private int port;

    @BeforeEach 
    void setUp(){
        RestAssured.port = port;
        
    }

    @Test 
    void getProductsReturnsData(){
        given().when().get("/api/v1/products").then().statusCode(200).body("name", hasItems("Classic Burger", "Chicken Burger", "French Fries", "Cola"));
    }
}
