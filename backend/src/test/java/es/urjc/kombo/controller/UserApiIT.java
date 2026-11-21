package es.urjc.kombo.controller;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasKey;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.io.IOException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.repository.UserRepository;
import es.urjc.kombo.security.JwtService;
import io.restassured.http.ContentType;

// System tests of the sign up and the account of the user: real server over HTTPS and database with the sample data
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
        given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/auth/me")
                .then().statusCode(200)
                .body("id", equalTo(id))
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

    @Test
    void aUserChangesTheirPersonalDataButNotTheirEmail() {
        String token = signUpAna();

        given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON)
                .body("{\"name\":\" Ana María \",\"surname\":\"\",\"phone\":\"611222333\",\"email\":\"other@example.com\"}")
                .when().put("/api/v1/users/me")
                .then().statusCode(200)
                .body("name", equalTo("Ana María"))
                .body("surname", nullValue())
                .body("phone", equalTo("611222333"))
                .body("email", equalTo("ana@example.com"));

        given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/auth/me")
                .then().statusCode(200)
                .body("name", equalTo("Ana María"));
    }

    @Test
    void changingThePersonalDataWithInvalidFieldsReturns400() {
        given().cookie(JwtService.COOKIE_NAME, signUpAna()).contentType(ContentType.JSON)
                .body("{\"name\":\"\",\"phone\":\"123\"}")
                .when().put("/api/v1/users/me")
                .then().statusCode(400)
                .contentType("application/problem+json")
                .body("detail", containsString("name:"))
                .body("detail", containsString("phone:"));
    }

    @Test
    void changingThePersonalDataWithoutLoggingInReturns401() {
        given().contentType(ContentType.JSON).body("{\"name\":\"Ana\"}")
                .when().put("/api/v1/users/me")
                .then().statusCode(401);
    }

    @Test
    void aUserChangesTheirPasswordAndLogsInWithTheNewOne() {
        String token = signUpAna();

        given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON)
                .body("{\"currentPassword\":\"secret-password\",\"newPassword\":\"new-secret-password\"}")
                .when().put("/api/v1/users/me/password")
                .then().statusCode(204);

        ApiTestSupport.login("ana@example.com", "new-secret-password");
        given().contentType(ContentType.JSON)
                .body("{\"email\":\"ana@example.com\",\"password\":\"secret-password\"}")
                .when().post("/api/v1/auth/login")
                .then().statusCode(401);
    }

    @Test
    void changingThePasswordWithAWrongCurrentPasswordReturns400() {
        given().cookie(JwtService.COOKIE_NAME, signUpAna()).contentType(ContentType.JSON)
                .body("{\"currentPassword\":\"wrong-password\",\"newPassword\":\"new-secret-password\"}")
                .when().put("/api/v1/users/me/password")
                .then().statusCode(400)
                .body("detail", equalTo("currentPassword: is not correct"));
    }

    @Test
    void theAdministratorChangesThePersonalDataOfAnyUser() {
        signUpAna();
        long id = userRepository.findByEmail("ana@example.com").orElseThrow().getId();

        given().cookie(JwtService.COOKIE_NAME, adminToken())
                .contentType(ContentType.JSON).body("{\"name\":\"Ana\",\"surname\":\"López\"}")
                .when().put("/api/v1/users/{id}", id)
                .then().statusCode(200)
                .body("surname", equalTo("López"));
    }

    @Test
    void aCustomerCannotChangeTheDataOfAUserById() {
        String token = signUpAna();
        long id = userRepository.findByEmail("ana@example.com").orElseThrow().getId();

        given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON).body("{\"name\":\"Ana\"}")
                .when().put("/api/v1/users/{id}", id)
                .then().statusCode(403);
    }

    @Test
    void aUserAddsAndDeletesSavedAddresses() {
        String token = signUpAna();

        given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON)
                .body("{\"addresses\":[\"Calle Mayor 1\",\" Calle Luna 2 \"]}")
                .when().put("/api/v1/users/me/addresses")
                .then().statusCode(200)
                .body("addresses", contains("Calle Mayor 1", "Calle Luna 2"));

        given().cookie(JwtService.COOKIE_NAME, token).contentType(ContentType.JSON)
                .body("{\"addresses\":[\"Calle Luna 2\"]}")
                .when().put("/api/v1/users/me/addresses")
                .then().statusCode(200)
                .body("addresses", contains("Calle Luna 2"));
    }

    @Test
    void aBlankAddressReturns400() {
        given().cookie(JwtService.COOKIE_NAME, signUpAna()).contentType(ContentType.JSON)
                .body("{\"addresses\":[\" \"]}")
                .when().put("/api/v1/users/me/addresses")
                .then().statusCode(400)
                .contentType("application/problem+json");
    }

    @Test
    void theAdministratorChangesTheAddressesOfAnyUser() {
        signUpAna();
        long id = userRepository.findByEmail("ana@example.com").orElseThrow().getId();

        given().cookie(JwtService.COOKIE_NAME, adminToken()).contentType(ContentType.JSON)
                .body("{\"addresses\":[\"Calle Sol 3\"]}")
                .when().put("/api/v1/users/{id}/addresses", id)
                .then().statusCode(200)
                .body("addresses", contains("Calle Sol 3"));
    }

    @Test
    void aUserUploadsReadsAndDeletesTheirProfilePicture() throws IOException {
        String token = signUpAna();
        byte[] picture = samplePicture();

        given().cookie(JwtService.COOKIE_NAME, token)
                .multiPart("image", "photo.jpg", picture, "image/jpeg")
                .when().put("/api/v1/users/me/image")
                .then().statusCode(200)
                .body("imageId", notNullValue());

        byte[] stored = given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/users/me/image")
                .then().statusCode(200)
                .contentType("image/jpeg")
                .header("Cache-Control", "no-cache")
                .extract().asByteArray();
        assertThat(stored).isEqualTo(picture);

        given().cookie(JwtService.COOKIE_NAME, token).when().delete("/api/v1/users/me/image")
                .then().statusCode(204);
        given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/users/me/image")
                .then().statusCode(404);
        given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/auth/me")
                .then().body("imageId", nullValue());
    }

    @Test
    void aFileThatIsNotAPictureReturns400() {
        given().cookie(JwtService.COOKIE_NAME, signUpAna())
                .multiPart("image", "photo.jpg", "<svg><script>alert(1)</script></svg>".getBytes(), "image/jpeg")
                .when().put("/api/v1/users/me/image")
                .then().statusCode(400)
                .body("detail", equalTo("image: the file must be a JPEG, PNG, GIF or WebP picture"));
    }

    @Test
    void aPictureBiggerThan1MegabyteReturns413() {
        given().cookie(JwtService.COOKIE_NAME, signUpAna())
                .multiPart("image", "big.jpg", new byte[1024 * 1024 + 1], "image/jpeg")
                .when().put("/api/v1/users/me/image")
                .then().statusCode(413);
    }

    @Test
    void onlyTheAdministratorManagesThePictureOfAnotherUser() throws IOException {
        String token = signUpAna();
        long id = userRepository.findByEmail("ana@example.com").orElseThrow().getId();

        given().cookie(JwtService.COOKIE_NAME, token).multiPart("image", "photo.jpg", samplePicture(), "image/jpeg")
                .when().put("/api/v1/users/{id}/image", id)
                .then().statusCode(403);

        String admin = adminToken();
        given().cookie(JwtService.COOKIE_NAME, admin).multiPart("image", "photo.jpg", samplePicture(), "image/jpeg")
                .when().put("/api/v1/users/{id}/image", id)
                .then().statusCode(200);
        given().cookie(JwtService.COOKIE_NAME, admin).when().get("/api/v1/users/{id}/image", id)
                .then().statusCode(200).contentType("image/jpeg");
        given().cookie(JwtService.COOKIE_NAME, admin).when().delete("/api/v1/users/{id}/image", id)
                .then().statusCode(204);
    }

    @Test
    void aCustomerDeletesTheirAccountAndCannotLogInAgain() {
        String token = signUpAna();

        given().cookie(JwtService.COOKIE_NAME, token).when().delete("/api/v1/users/me")
                .then().statusCode(204)
                .header("Set-Cookie", containsString(JwtService.COOKIE_NAME + "=;"));

        assertThat(userRepository.findByEmail("ana@example.com")).isEmpty();
        given().cookie(JwtService.COOKIE_NAME, token).when().get("/api/v1/auth/me").then().statusCode(401);
        given().contentType(ContentType.JSON)
                .body("{\"email\":\"ana@example.com\",\"password\":\"secret-password\"}")
                .when().post("/api/v1/auth/login")
                .then().statusCode(401);
    }

    @Test
    void theAdministratorDeletesAnyAccountButNotTheirOwn() {
        signUpAna();
        long id = userRepository.findByEmail("ana@example.com").orElseThrow().getId();
        long adminId = userRepository.findByEmail("admin@kombo.com").orElseThrow().getId();
        String admin = adminToken();

        given().cookie(JwtService.COOKIE_NAME, admin).when().delete("/api/v1/users/me").then().statusCode(403);
        given().cookie(JwtService.COOKIE_NAME, admin).when().delete("/api/v1/users/{id}", adminId)
                .then().statusCode(403);
        given().cookie(JwtService.COOKIE_NAME, admin).when().delete("/api/v1/users/{id}", id).then().statusCode(204);
        assertThat(userRepository.findById(id)).isEmpty();
    }

    @Test
    void aCustomerCannotDeleteAnotherAccount() {
        String token = signUpAna();
        long employeeId = userRepository.findByEmail("employee@kombo.com").orElseThrow().getId();

        given().cookie(JwtService.COOKIE_NAME, token).when().delete("/api/v1/users/{id}", employeeId)
                .then().statusCode(403);
    }

    private static String adminToken() {
        return ApiTestSupport.login("admin@kombo.com", "admin");
    }

    private static byte[] samplePicture() throws IOException {
        return new ClassPathResource("sample-images/chocolate-sundae.jpg").getContentAsByteArray();
    }

    // Signs up the test customer and returns their session cookie
    private String signUpAna() {
        given().contentType(ContentType.JSON).body(NEW_USER).when().post("/api/v1/users").then().statusCode(201);
        return ApiTestSupport.login("ana@example.com", "secret-password");
    }
}
