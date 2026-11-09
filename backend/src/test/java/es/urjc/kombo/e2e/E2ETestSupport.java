package es.urjc.kombo.e2e;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.junit.jupiter.api.extension.TestWatcher;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

// Common setup of the Selenium tests: headless Chrome with a fixed window size
abstract class E2ETestSupport {

    protected static final String BASE_URL = System.getProperty("e2e.baseUrl", "http://localhost:5173");

    private static final Path FAILURES_FOLDER = Path.of("target", "e2e-failures");

    protected WebDriver driver;
    protected WebDriverWait wait;

    // When a test fails, a screenshot and the HTML of the page are saved in target/e2e-failures
    // (CI uploads them as an artifact), before the browser is closed
    @RegisterExtension
    final TestWatcher saveFailures = new TestWatcher() {
        @Override
        public void testFailed(ExtensionContext context, Throwable cause) {
            saveFailure(context.getRequiredTestClass().getSimpleName() + "-" + context.getRequiredTestMethod().getName());
        }

        @Override
        public void testSuccessful(ExtensionContext context) {
            quitBrowser();
        }

        @Override
        public void testAborted(ExtensionContext context, Throwable cause) {
            quitBrowser();
        }
    };

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

    // The browser is closed by the watcher (not in @AfterEach) because JUnit calls the watcher after
    // @AfterEach, and the screenshot of a failure needs the browser open
    private void quitBrowser() {
        if (driver != null) {
            driver.quit();
            driver = null;
        }
    }

    private void saveFailure(String name) {
        if (driver == null) {
            return;
        }
        try {
            Files.createDirectories(FAILURES_FOLDER);
            Files.write(FAILURES_FOLDER.resolve(name + ".png"), ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES));
            Files.writeString(FAILURES_FOLDER.resolve(name + ".html"), driver.getPageSource(), StandardCharsets.UTF_8);
        } catch (IOException | RuntimeException exception) {
            // Saving the evidence must never hide the real failure of the test
        } finally {
            quitBrowser();
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

    // Activates a button with the keyboard (focus and Enter), like a keyboard user. Used for the buttons of the
    // sticky navigation bar: in the Chrome of the GitHub runners the simulated mouse clicks on that bar did
    // not reach the button (no error, no effect), while keyboard activation does not depend on coordinates.
    protected void pressWithKeyboard(By locator) {
        wait.until(ExpectedConditions.elementToBeClickable(locator)).sendKeys(Keys.ENTER);
    }
}
