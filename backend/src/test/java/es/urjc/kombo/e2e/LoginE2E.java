package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

// A real Chrome browser logs in with the sample customer, sees their orders and logs out
class LoginE2E {

    private static final String BASE_URL = System.getProperty("e2e.baseUrl", "http://localhost:5173");

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeEach
    void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        // The application uses a self-signed certificate when it is served over HTTPS (Docker)
        options.setAcceptInsecureCerts(true);
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    void customerLogsInSeesTheirOrdersAndLogsOut() {
        logIn("customer@kombo.com", "customer");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("orders-title"), "Mis pedidos"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"), "Pedido nº 1"));
        assertThat(driver.findElement(By.cssSelector(".navbar")).getText()).contains("Lucía", "Mis pedidos");

        driver.findElement(By.id("user-menu")).click();
        wait.until(ExpectedConditions.elementToBeClickable(By.linkText("Cerrar sesión"))).click();

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".navbar"), "Iniciar sesión"));
    }

    @Test
    void wrongPasswordShowsAnError() {
        logIn("customer@kombo.com", "wrong-password");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector("[role='alert']"),
                "El email o la contraseña no son correctos."));
    }

    @Test
    void anonymousUsersAreSentToTheLoginPage() {
        driver.get(BASE_URL + "/profile");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("login-title"), "Inicia sesión"));
    }

    private void logIn(String email, String password) {
        driver.get(BASE_URL + "/login");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-email"))).sendKeys(email);
        driver.findElement(By.id("login-password")).sendKeys(password);
        driver.findElement(By.cssSelector("button[type='submit']")).click();
    }
}
