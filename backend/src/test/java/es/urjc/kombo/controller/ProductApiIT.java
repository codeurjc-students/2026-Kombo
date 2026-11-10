package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItems;

import java.math.BigDecimal;

import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.model.Image;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.repository.ProductRepository;

// System tests of the REST API: real server and database with the sample data
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class ProductApiIT {

    @LocalServerPort
    private int port;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void setUp() {
        ApiTestSupport.configureHttps(port);
    }

    @Test
    void getProductsReturnsTheFirstPageOfProducts() {
        given().when().get("/api/v1/products")
                .then().statusCode(200)
                .body("content.name", hasItems("Hamburguesa clásica", "Hamburguesa de pollo", "Patatas fritas", "Refresco de cola"))
                .body("page.number", equalTo(0))
                .body("page.size", equalTo(10));
    }

    @Test
    void getProductsFiltersByCategory() {
        given().queryParam("category", "Drinks")
                .when().get("/api/v1/products")
                .then().statusCode(200)
                .body("content.name", contains("Refresco de cola", "Refresco de naranja", "Agua"));
    }

    // The 3 sample combos, 2 per page: the second page has the last one.
    // Other tests of this class add products, but never to the "Combos" category.
    @Test
    void getProductsReturnsTheRequestedPageOfACategory() {
        given().queryParam("category", "Combos").queryParam("page", 1).queryParam("size", 2)
                .when().get("/api/v1/products")
                .then().statusCode(200)
                .body("content.name", contains("Menú familiar"))
                .body("page.number", equalTo(1))
                .body("page.totalElements", equalTo(3))
                .body("page.totalPages", equalTo(2));
    }

    @Test
    void getProductReturnsTheProductDetail() {
        int id = given().queryParam("category", "Sides")
                .when().get("/api/v1/products")
                .then().extract().path("content[0].id");

        given().when().get("/api/v1/products/{id}", id)
                .then().statusCode(200)
                .body("name", equalTo("Patatas fritas"))
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

    @Test
    void getProductImageReturnsTheImageWithItsContentType() {
        byte[] content = {10, 20, 30};
        Product product = new Product("Image Test Burger", new BigDecimal("5.00"), "Test description", "Test");
        product.setImage(new Image(BlobProxy.generateProxy(content), "image/jpeg", "Image Test Burger"));
        long id = productRepository.save(product).getId();

        byte[] body = given().when().get("/api/v1/products/{id}/image", id)
                .then().statusCode(200)
                .contentType("image/jpeg")
                .extract().asByteArray();

        assertThat(body).containsExactly(content);
    }

    @Test
    void getProductImageOfAProductWithoutImageReturns404() {
        Product product = new Product("No Image Burger", new BigDecimal("5.00"), "Test description", "Test");
        long id = productRepository.save(product).getId();

        given().when().get("/api/v1/products/{id}/image", id)
                .then().statusCode(404)
                .contentType("application/problem+json")
                .body("detail", equalTo("Product " + id + " has no image"));
    }
}
