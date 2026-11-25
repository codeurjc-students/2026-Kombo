package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

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
import es.urjc.kombo.repository.ComboRepository;
import es.urjc.kombo.repository.IngredientRepository;
import es.urjc.kombo.repository.ProductRepository;
import es.urjc.kombo.security.JwtService;
import io.restassured.http.ContentType;

// System tests of the management of products and kombos: real server over HTTPS and database with the sample data.
// The products and kombos created by each test are deleted afterwards, so the other system tests (which count the
// sample products) do not depend on the order of the tests.
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
class AdminProductApiIT {

    @LocalServerPort
    private int port;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ComboRepository comboRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    private final List<Long> createdProducts = new ArrayList<>();
    private final List<Long> createdCombos = new ArrayList<>();

    @BeforeEach
    void setUp() {
        ApiTestSupport.configureHttps(port);
    }

    // Kombos first, because they reference the products
    @AfterEach
    void deleteCreatedProducts() {
        createdCombos.forEach(comboRepository::deleteById);
        createdProducts.forEach(productRepository::deleteById);
    }

    @Test
    void theAdministratorCreatesAProductThatIsShownInTheMenu() {
        long bread = ingredientId("Pan de hamburguesa");
        String body = """
                {"name":"Hamburguesa de prueba","price":6.25,"description":"Solo para el test","category":"Burgers",
                 "ingredients":[{"ingredientId":%d,"quantity":1}]}
                """.formatted(bread);

        int id = given().cookie(JwtService.COOKIE_NAME, adminToken()).contentType(ContentType.JSON).body(body)
                .when().post("/api/v1/admin/products")
                .then().statusCode(201)
                .header("Location", containsString("/api/v1/admin/products/"))
                .body("active", equalTo(true))
                .body("combo", equalTo(false))
                .body("ingredients[0].name", equalTo("Pan de hamburguesa"))
                .extract().path("id");
        createdProducts.add((long) id);

        given().when().get("/api/v1/products/{id}", id).then().statusCode(200).body("price", equalTo(6.25f));
    }

    @Test
    void wrongProductsReturn400() {
        String admin = adminToken();

        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body("{\"name\":\"\",\"price\":0,\"category\":\"Combos\",\"ingredients\":[]}")
                .when().post("/api/v1/admin/products")
                .then().statusCode(400)
                .body("detail", containsString("category:"))
                .body("detail", containsString("name:"))
                .body("detail", containsString("price:"));
        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body("{\"name\":\"Hamburguesa\",\"price\":5,\"category\":\"Burgers\","
                        + "\"ingredients\":[{\"ingredientId\":999999,\"quantity\":1}]}")
                .when().post("/api/v1/admin/products")
                .then().statusCode(400)
                .body("detail", equalTo("ingredients: ingredient 999999 does not exist"));
    }

    @Test
    void theAdministratorCreatesAKomboAndChangesIt() {
        String admin = adminToken();
        long burger = createProduct(admin, "Hamburguesa de prueba", "Burgers");
        long drink = createProduct(admin, "Bebida de prueba", "Drinks");

        int id = given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body(comboBody("Kombo de prueba", 8.5, burger, 1, drink, 1))
                .when().post("/api/v1/admin/combos")
                .then().statusCode(201)
                .header("Location", containsString("/api/v1/admin/products/"))
                .body("combo", equalTo(true))
                .body("category", equalTo("Combos"))
                .body("products.product.name", contains("Bebida de prueba", "Hamburguesa de prueba"))
                .extract().path("id");
        createdCombos.add((long) id);

        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body(comboBody("Kombo de prueba", 7.0, burger, 2, drink, 1))
                .when().put("/api/v1/admin/combos/{id}", id)
                .then().statusCode(200)
                .body("price", equalTo(7.0f))
                .body("products.find { it.product.name == 'Hamburguesa de prueba' }.quantity", equalTo(2));
        // A kombo is not changed as a product
        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body("{\"name\":\"Kombo\",\"price\":5,\"category\":\"Burgers\",\"ingredients\":[]}")
                .when().put("/api/v1/admin/products/{id}", id)
                .then().statusCode(400);
    }

    @Test
    void aKomboOnlyIncludesActiveProductsThatAreNotKombos() {
        String admin = adminToken();
        long burger = createProduct(admin, "Hamburguesa de prueba", "Burgers");
        long sampleCombo = productRepository.findAll().stream()
                .filter(product -> "Combos".equals(product.getCategory())).findFirst().orElseThrow().getId();

        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body(comboBody("Kombo de prueba", 8.5, burger, 1, sampleCombo, 1))
                .when().post("/api/v1/admin/combos")
                .then().statusCode(400)
                .body("detail", equalTo("products: a combo cannot include another combo"));
        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body("{\"name\":\"Kombo\",\"price\":5,\"products\":[{\"productId\":" + burger + ",\"quantity\":1}]}")
                .when().post("/api/v1/admin/combos")
                .then().statusCode(400)
                .body("detail", equalTo("products: a combo has at least 2 units"));
    }

    @Test
    void aDeactivatedProductLeavesTheMenuButNotWhileAnActiveKomboIncludesIt() {
        String admin = adminToken();
        long burger = createProduct(admin, "Hamburguesa de prueba", "Burgers");
        long drink = createProduct(admin, "Bebida de prueba", "Drinks");
        int combo = given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body(comboBody("Kombo de prueba", 8.5, burger, 1, drink, 1))
                .when().post("/api/v1/admin/combos")
                .then().statusCode(201).extract().path("id");
        createdCombos.add((long) combo);

        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON).body("{\"active\":false}")
                .when().patch("/api/v1/admin/products/{id}", burger)
                .then().statusCode(409)
                .contentType("application/problem+json")
                .body("products.name", contains("Kombo de prueba"))
                .body("products.id", contains(combo));

        changeActive(admin, combo, false);
        changeActive(admin, burger, false);

        given().when().get("/api/v1/products/{id}", burger).then().statusCode(404);
        given().queryParam("size", 100).when().get("/api/v1/products")
                .then().body("content.name", not(hasItem("Hamburguesa de prueba")));
        // The administrator still sees it, in grey in the client
        given().cookie(JwtService.COOKIE_NAME, admin).queryParam("active", false).queryParam("size", 100)
                .when().get("/api/v1/admin/products")
                .then().statusCode(200)
                .body("content.name", hasItem("Hamburguesa de prueba"))
                .body("content.active", everyItem(equalTo(false)));
        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON).body("{\"active\":true}")
                .when().patch("/api/v1/admin/products/{id}", combo)
                .then().statusCode(409)
                .body("products.name", contains("Hamburguesa de prueba"));

        changeActive(admin, burger, true);
        changeActive(admin, combo, true);
        given().when().get("/api/v1/products/{id}", burger).then().statusCode(200);
    }

    // The window of the client removes a product from its kombo with PUT, changing the price at the same time, and
    // then deactivates the product; a kombo cannot keep fewer than 2 units
    @Test
    void aProductRemovedFromItsKomboWithANewPriceCanBeDeactivated() {
        String admin = adminToken();
        long sauce = createProduct(admin, "Salsa de prueba", "Sides");
        long drink = createProduct(admin, "Refresco de prueba", "Drinks");
        int combo = given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body(comboBody("Kombo de salsa", 4.0, sauce, 1, drink, 2))
                .when().post("/api/v1/admin/combos")
                .then().statusCode(201).extract().path("id");
        createdCombos.add((long) combo);

        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body("{\"name\":\"Kombo de salsa\",\"price\":3.5,\"products\":[{\"productId\":%d,\"quantity\":1}]}"
                        .formatted(drink))
                .when().put("/api/v1/admin/combos/{id}", combo)
                .then().statusCode(400);
        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body("{\"name\":\"Kombo de salsa\",\"price\":3.5,\"products\":[{\"productId\":%d,\"quantity\":2}]}"
                        .formatted(drink))
                .when().put("/api/v1/admin/combos/{id}", combo)
                .then().statusCode(200)
                .body("price", equalTo(3.5f))
                .body("products.product.id", contains((int) drink));

        changeActive(admin, sauce, false);
    }

    // 10 MB for the pictures of products and kombos; the profile pictures keep their limit of 1 MB (UserApiIT)
    @Test
    void thePictureOfAProductCanHaveMoreThan1MegabyteButNotMoreThan10() {
        String admin = adminToken();
        long burger = createProduct(admin, "Hamburguesa de prueba", "Burgers");

        int imageId = given().cookie(JwtService.COOKIE_NAME, admin)
                .multiPart("image", "photo.jpg", jpegOfSize(2 * 1024 * 1024), "image/jpeg")
                .when().put("/api/v1/admin/products/{id}/image", burger)
                .then().statusCode(200)
                .body("imageId", notNullValue())
                .extract().path("imageId");
        assertThat(imageId).isPositive();
        given().cookie(JwtService.COOKIE_NAME, admin).when().get("/api/v1/admin/products/{id}/image", burger)
                .then().statusCode(200).contentType("image/jpeg").header("Cache-Control", "no-cache");
        given().when().get("/api/v1/products/{id}/image", burger).then().statusCode(200);

        given().cookie(JwtService.COOKIE_NAME, admin)
                .multiPart("image", "big.jpg", jpegOfSize(10 * 1024 * 1024 + 1), "image/jpeg")
                .when().put("/api/v1/admin/products/{id}/image", burger)
                .then().statusCode(413);
        given().cookie(JwtService.COOKIE_NAME, ApiTestSupport.login("customer@kombo.com", "customer"))
                .multiPart("image", "big.jpg", jpegOfSize(2 * 1024 * 1024), "image/jpeg")
                .when().put("/api/v1/users/me/image")
                .then().statusCode(413);
    }

    @Test
    void theAdministratorReadsTheIngredientsByName() {
        given().cookie(JwtService.COOKIE_NAME, adminToken()).queryParam("size", 100)
                .when().get("/api/v1/admin/ingredients")
                .then().statusCode(200)
                .body("page.totalElements", equalTo((int) ingredientRepository.count()))
                .body("content[0].name", notNullValue());
    }

    @Test
    void onlyTheAdministratorManagesTheProducts() {
        given().when().get("/api/v1/admin/products").then().statusCode(401);
        given().contentType(ContentType.JSON).body("{\"active\":false}")
                .when().patch("/api/v1/admin/products/1").then().statusCode(401);
        String employee = ApiTestSupport.login("employee@kombo.com", "employee");
        given().cookie(JwtService.COOKIE_NAME, employee).when().get("/api/v1/admin/products").then().statusCode(403);
        given().cookie(JwtService.COOKIE_NAME, employee).when().get("/api/v1/admin/ingredients").then().statusCode(403);
        given().cookie(JwtService.COOKIE_NAME, employee).contentType(ContentType.JSON)
                .body("{\"name\":\"Kombo\",\"price\":5,\"products\":[{\"productId\":1,\"quantity\":2}]}")
                .when().post("/api/v1/admin/combos").then().statusCode(403);
    }

    private long createProduct(String admin, String name, String category) {
        int id = given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON)
                .body("{\"name\":\"" + name + "\",\"price\":5,\"category\":\"" + category + "\",\"ingredients\":[]}")
                .when().post("/api/v1/admin/products")
                .then().statusCode(201).extract().path("id");
        createdProducts.add((long) id);
        return id;
    }

    private static void changeActive(String admin, long id, boolean active) {
        given().cookie(JwtService.COOKIE_NAME, admin).contentType(ContentType.JSON).body("{\"active\":" + active + "}")
                .when().patch("/api/v1/admin/products/{id}", id)
                .then().statusCode(200)
                .body("active", equalTo(active));
    }

    private static String comboBody(String name, double price, long first, int firstUnits, long second,
            int secondUnits) {
        return """
                {"name":"%s","price":%s,"products":[{"productId":%d,"quantity":%d},{"productId":%d,"quantity":%d}]}
                """.formatted(name, price, first, firstUnits, second, secondUnits);
    }

    private long ingredientId(String name) {
        return ingredientRepository.findAll().stream().filter(ingredient -> name.equals(ingredient.getName()))
                .findFirst().orElseThrow().getId();
    }

    private static byte[] jpegOfSize(int size) {
        byte[] content = new byte[size];
        content[0] = (byte) 0xFF;
        content[1] = (byte) 0xD8;
        content[2] = (byte) 0xFF;
        return content;
    }

    private static String adminToken() {
        return ApiTestSupport.login("admin@kombo.com", "admin");
    }
}
