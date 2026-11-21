package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

// A real Chrome browser goes from the cart to the confirmation of the order, as an anonymous user
class CheckoutE2E extends E2ETestSupport {

    private static final By CART_COUNT = By.cssSelector("[data-testid='cart-count']");
    private static final By SUBTOTAL = By.cssSelector("[data-testid='summary-subtotal']");
    private static final By DELIVERY = By.cssSelector("[data-testid='summary-delivery']");
    private static final By TOTAL = By.cssSelector("[data-testid='summary-total']");

    @Test
    void anAnonymousUserOrdersAHomeDeliveryPaidByCard() {
        // Two classic burgers (8,50 € each) in the cart
        driver.get(BASE_URL);
        click(By.linkText("Hamburguesa clásica"));
        click(By.xpath("//button[normalize-space()='Añadir al carrito +']"));
        click(By.xpath("//button[normalize-space()='Añadir al carrito +']"));
        wait.until(ExpectedConditions.textToBe(CART_COUNT, "2"));

        // Cart: only the subtotal, because the delivery type is chosen in the checkout
        clickInNavbar(By.cssSelector("a.nav-cart"));
        wait.until(ExpectedConditions.urlMatches(".*/cart$"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(SUBTOTAL, "17,00"));
        assertThat(driver.findElements(DELIVERY)).isEmpty();
        assertThat(driver.findElements(TOTAL)).isEmpty();

        // One more unit: 25,50 €
        click(By.cssSelector("[aria-label='Añadir una unidad de Hamburguesa clásica']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(SUBTOTAL, "25,50"));
        assertThat(text(CART_COUNT)).isEqualTo("3");

        // Checkout: take away has no delivery cost; a home delivery from 25 € is free too
        click(By.linkText("Tramitar pedido"));
        wait.until(ExpectedConditions.urlMatches(".*/checkout$"));
        wait.until(ExpectedConditions.textToBe(DELIVERY, "Gratis"));
        assertThat(text(TOTAL)).contains("25,50");
        click(By.id("delivery-DELIVERY"));
        assertThat(text(DELIVERY)).isEqualTo("Gratis");
        type("checkout-address", "Calle Tulipán s/n, Móstoles");
        type("checkout-name", "Ana Pérez");
        type("checkout-email", "ana@example.com");
        type("checkout-phone", "600123456");
        type("checkout-card-number", "4111 1111 1111 1111");
        type("checkout-card-expiry", "12/99");
        type("checkout-card-cvv", "123");
        click(By.xpath("//button[starts-with(normalize-space(), 'Confirmar y pagar')]"));

        // Confirmation with the order number, and the cart is empty
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("confirmation-title"), "Pedido confirmado"));
        assertThat(driver.getCurrentUrl()).endsWith("/order-confirmation");
        assertThat(text(By.cssSelector("[data-testid='order-number']"))).matches("\\d{4,}");
        assertThat(driver.findElement(By.cssSelector("[aria-label='Productos del pedido']")).getText())
                .contains("3 × Hamburguesa clásica");
        assertThat(text(CART_COUNT)).isEqualTo("0");
    }

    @Test
    void aCustomerOrdersWithTheirSavedDataAndAddress() {
        logIn("customer@kombo.com", "customer");
        wait.until(ExpectedConditions.urlMatches(".*/profile$"));
        driver.get(BASE_URL);
        click(By.linkText("Agua"));
        click(By.xpath("//button[normalize-space()='Añadir al carrito +']"));
        wait.until(ExpectedConditions.textToBe(CART_COUNT, "1"));
        driver.get(BASE_URL + "/checkout");

        // No contact form: the data of the profile is shown
        WebElement contact = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[data-testid='contact-summary']")));
        assertThat(contact.getText()).contains("Lucía García", "customer@kombo.com", "600111222");
        assertThat(driver.findElements(By.id("checkout-name"))).isEmpty();

        // Home delivery: the saved address is chosen at first
        click(By.id("delivery-DELIVERY"));
        assertThat(driver.findElement(By.id("address-0")).isSelected()).isTrue();
        assertThat(driver.findElement(By.cssSelector("label[for='address-0']")).getText()).contains("Calle Tulipán");
        click(By.id("payment-CASH"));
        click(By.xpath("//button[starts-with(normalize-space(), 'Confirmar y pagar')]"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("confirmation-title"), "Pedido confirmado"));
        assertThat(driver.findElement(By.cssSelector("main")).getText()).contains("Calle Tulipán");
    }

    @Test
    void theCheckoutShowsTheWrongFields() {
        driver.get(BASE_URL);
        click(By.linkText("Agua"));
        click(By.xpath("//button[normalize-space()='Añadir al carrito +']"));
        wait.until(ExpectedConditions.textToBe(CART_COUNT, "1"));
        driver.get(BASE_URL + "/checkout");

        click(By.xpath("//button[starts-with(normalize-space(), 'Confirmar y pagar')]"));

        wait.until(ExpectedConditions.visibilityOfElementLocated(By.xpath("//*[normalize-space()='Escribe tu nombre.']")));
        assertThat(driver.findElement(By.id("checkout-email")).getAttribute("class")).contains("is-invalid");
        assertThat(driver.getCurrentUrl()).endsWith("/checkout");
    }

    private String text(By locator) {
        return driver.findElement(locator).getText();
    }

    private void type(String id, String value) {
        WebElement input = wait.until(ExpectedConditions.elementToBeClickable(By.id(id)));
        input.clear();
        input.sendKeys(value);
    }
}
