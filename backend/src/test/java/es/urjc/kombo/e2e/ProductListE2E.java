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


//A real Chrome browser opens the home page and checks that the sample products are shown

class ProductListE2E {


    private static final String BASE_URL = System.getProperty("e2e.baseUrl", "http://localhost:5173");

    private WebDriver driver;

    @BeforeEach
    void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        driver = new ChromeDriver(options);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    @Test
    void homePageShowsSampleProducts() {
        driver.get(BASE_URL);

        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("ul"), "Classic Burger"));

        assertThat(driver.findElement(By.tagName("h1")).getText()).isEqualTo("Kombo");
        assertThat(driver.findElement(By.tagName("ul")).getText())
                .contains("Classic Burger", "Chicken Burger", "French Fries", "Cola");
    }
}