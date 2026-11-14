package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

// A real Chrome browser opens the detail of a sample product and combo from the menu and adds them to the cart
class ProductDetailE2E extends E2ETestSupport {

    private static final By TITLE = By.id("product-title");
    private static final By CART_COUNT = By.cssSelector("[data-testid='cart-count']");

    @Test
    void productDetailShowsTheIngredientsAndAddsTheProductToTheCart() {
        driver.get(BASE_URL);
        click(By.linkText("Hamburguesa clásica"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(TITLE, "Hamburguesa clásica"));
        assertThat(driver.getCurrentUrl()).matches(".*/products/\\d+");
        WebElement image = driver.findElement(By.cssSelector(".product-detail-media img"));
        assertThat(image.getAttribute("alt")).isEqualTo("Hamburguesa clásica");
        assertThat(driver.findElement(By.cssSelector("[aria-label='Ingredientes']")).getText())
                .contains("Carne de ternera", "Queso cheddar", "Lechuga", "Tomate");
        assertThat(driver.findElement(CART_COUNT).getText()).isEqualTo("0");

        click(By.xpath("//button[normalize-space()='Añadir al carrito +']"));
        click(By.xpath("//button[normalize-space()='Añadir al carrito +']"));

        wait.until(ExpectedConditions.textToBe(CART_COUNT, "2"));
        assertThat(driver.findElement(By.cssSelector("[role='status']")).getText())
                .contains("Hamburguesa clásica añadido al carrito");

        // The cart is kept in the browser: it is still there after reloading the page
        driver.navigate().refresh();
        wait.until(ExpectedConditions.textToBePresentInElementLocated(TITLE, "Hamburguesa clásica"));
        assertThat(driver.findElement(CART_COUNT).getText()).isEqualTo("2");
    }

    @Test
    void comboDetailListsItsProductsWithLinksToTheirDetail() {
        driver.get(BASE_URL);
        click(By.xpath("//button[normalize-space()='Menús']"));
        click(By.linkText("Menú clásico"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(TITLE, "Menú clásico"));
        By products = By.cssSelector("[aria-label='Productos del menú']");
        assertThat(driver.findElement(products).getText())
                .contains("1 × Hamburguesa clásica", "1 × Patatas fritas", "1 × Refresco de cola");

        click(By.linkText("Patatas fritas"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(TITLE, "Patatas fritas"));
    }

    @Test
    void aProductThatDoesNotExistShowsTheNotFoundPage() {
        driver.get(BASE_URL + "/products/999999");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("status-title"),
                "Esta página no está en la carta"));
    }
}
