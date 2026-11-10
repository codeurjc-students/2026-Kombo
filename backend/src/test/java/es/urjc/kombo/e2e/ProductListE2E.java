package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;


// A real Chrome browser opens the home page and checks that the sample products are shown
class ProductListE2E extends E2ETestSupport {

    @Test
    void homePageShowsSampleProducts() {
        driver.get(BASE_URL);

        By grid = By.cssSelector("[data-testid='product-grid']");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(grid, "Hamburguesa clásica"));

        assertThat(driver.findElement(By.cssSelector(".navbar-brand img")).getAttribute("alt")).isEqualTo("Kombo");
        assertThat(driver.findElement(grid).getText())
                .contains("Hamburguesa clásica", "Hamburguesa de pollo", "Patatas fritas", "Refresco de cola");
    }

    // The menu shows the first 10 of the 12 sample products and the rest with "Más resultados"
    @Test
    void moreResultsShowsTheNextProducts() {
        driver.get(BASE_URL);

        By cards = By.cssSelector("article.product-card");
        wait.until(ExpectedConditions.numberOfElementsToBe(cards, 10));

        click(By.xpath("//button[normalize-space()='Más resultados']"));

        wait.until(ExpectedConditions.numberOfElementsToBe(cards, 12));
        assertThat(driver.findElements(By.xpath("//button[normalize-space()='Más resultados']"))).isEmpty();
    }

    // The "Menús" category shows only the 3 sample combos
    @Test
    void categoryShowsOnlyItsProducts() {
        driver.get(BASE_URL);

        By cards = By.cssSelector("article.product-card");
        wait.until(ExpectedConditions.numberOfElementsToBe(cards, 10));

        click(By.xpath("//button[normalize-space()='Menús']"));

        wait.until(ExpectedConditions.numberOfElementsToBe(cards, 3));
        // Names of the cards (the descriptions of the combos also name their products)
        assertThat(driver.findElements(By.cssSelector("article.product-card h3")))
                .extracting(WebElement::getText)
                .containsExactly("Menú clásico", "Menú de pollo", "Menú familiar");
    }
}
