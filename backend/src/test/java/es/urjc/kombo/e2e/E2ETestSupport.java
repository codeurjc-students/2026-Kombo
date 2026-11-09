package es.urjc.kombo.e2e;

import java.time.Duration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

// Common setup of the Selenium tests: headless Chrome with a fixed window size
abstract class E2ETestSupport {

    protected static final String BASE_URL = System.getProperty("e2e.baseUrl", "http://localhost:5173");

    protected WebDriver driver;
    protected WebDriverWait wait;

    @BeforeEach
    void startBrowser() {
        ChromeOptions options = new ChromeOptions();
        // Fixed size so the layout (and the position of the elements) is the same in every machine
        options.addArguments("--headless=new", "--window-size=1280,900");
        // The application uses a self-signed certificate when it is served over HTTPS (Docker)
        options.setAcceptInsecureCerts(true);
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterEach
    void closeBrowser() {
        if (driver != null) {
            driver.quit();
        }
    }

    // Bootstrap enables "scroll-behavior: smooth": when WebDriver scrolls to an element before clicking it,
    // the page is still moving and the click lands on another element (ElementClickInterceptedException).
    // The element is first scrolled into view without animation, and then clicked.
    protected void click(By locator) {
        WebElement element = wait.until(ExpectedConditions.elementToBeClickable(locator));
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block: 'center', behavior: 'instant'});", element);
        wait.until(ExpectedConditions.elementToBeClickable(element)).click();
    }
}
