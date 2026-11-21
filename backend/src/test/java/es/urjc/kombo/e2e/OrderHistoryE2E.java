package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

// A real Chrome browser: the sample customer sees their last orders in the profile, opens one and repeats it
class OrderHistoryE2E extends E2ETestSupport {

    private static final By ORDER_CARDS = By.cssSelector("[aria-label='Últimos pedidos'] li");
    private static final By CART_COUNT = By.cssSelector("[data-testid='cart-count']");

    @Test
    void aCustomerOpensAnOrderOfTheProfileAndRepeatsIt() {
        logIn("customer@kombo.com", "customer");

        // At most 4 orders in the profile, each one with a link to its detail
        wait.until(ExpectedConditions.numberOfElementsToBeMoreThan(ORDER_CARDS, 0));
        assertThat(driver.findElements(ORDER_CARDS)).hasSizeLessThanOrEqualTo(4);
        WebElement firstLink = driver.findElement(By.cssSelector("[aria-label='Últimos pedidos'] li a"));
        String orderTitle = firstLink.getText();
        assertThat(orderTitle).matches("Pedido nº \\d{4,}");
        click(By.cssSelector("[aria-label='Últimos pedidos'] li a"));

        // Detail: products with the price paid, delivery, payment and totals
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("order-title"), orderTitle));
        assertThat(driver.getCurrentUrl()).matches(".*/orders/\\d+");
        assertThat(driver.findElement(By.cssSelector(".order-facts")).getText()).contains("Entrega", "Pago");
        assertThat(driver.findElements(By.cssSelector("tbody tr"))).isNotEmpty();
        assertThat(driver.findElement(By.cssSelector("[data-testid='summary-total']")).getText()).contains("€");
        assertThat(driver.findElement(CART_COUNT).getText()).isEqualTo("0");

        click(By.xpath("//button[normalize-space()='Repetir pedido']"));

        // The products of the order are now in the cart
        wait.until(ExpectedConditions.urlMatches(".*/cart$"));
        wait.until(ExpectedConditions.not(ExpectedConditions.textToBe(CART_COUNT, "0")));
        assertThat(driver.findElements(By.cssSelector(".cart-item"))).isNotEmpty();
    }

    @Test
    void theRepeatButtonOfTheProfileFillsTheCart() {
        logIn("customer@kombo.com", "customer");
        wait.until(ExpectedConditions.numberOfElementsToBeMoreThan(ORDER_CARDS, 0));

        click(By.xpath("(//*[@aria-label='Últimos pedidos']//button[normalize-space()='Repetir pedido'])[1]"));

        wait.until(ExpectedConditions.urlMatches(".*/cart$"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".toast"), "Hemos añadido al carrito"));
        assertThat(driver.findElement(CART_COUNT).getText()).isNotEqualTo("0");
    }
}
