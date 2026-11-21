package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.pagefactory.ByChained;
import org.openqa.selenium.support.ui.ExpectedConditions;

// A real Chrome browser with the sample employee: a counter order made with the menu, the cart and the checkout,
// and its way through the order dashboard until it is delivered. Every run places a new order.
class OrderDashboardE2E extends E2ETestSupport {

    @Test
    void anEmployeePlacesACounterOrderChargesItAndDeliversIt() {
        logIn("employee@kombo.com", "employee");
        wait.until(ExpectedConditions.urlMatches(".*/orders$"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("dashboard-title"), "Pedidos"));

        // Counter order: the same menu, cart and checkout as the customers, with only the name of the customer
        click(By.linkText("Nuevo pedido en mostrador"));
        click(By.linkText("Agua"));
        click(By.xpath("//button[normalize-space()='Añadir al carrito +']"));
        wait.until(ExpectedConditions.textToBe(By.cssSelector("[data-testid='cart-count']"), "1"));
        driver.get(BASE_URL + "/checkout");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("checkout-title"), "Pedido en mostrador"));
        click(By.id("delivery-EAT_IN"));
        wait.until(ExpectedConditions.elementToBeClickable(By.id("checkout-name"))).sendKeys("Mesa 4");
        click(By.id("payment-CASH"));
        click(By.xpath("//button[starts-with(normalize-space(), 'Confirmar pedido')]"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("confirmation-title"),
                "Pedido confirmado"));
        String number = driver.findElement(By.cssSelector("[data-testid='order-number']")).getText();

        // The order is pending in the dashboard, not paid yet
        click(By.linkText("Ir a los pedidos"));
        By card = By.cssSelector("li[aria-label='Pedido nº " + number + "']");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(card, "Pendiente de pago"));
        // "Pedido nº 1005 - 0 min": the minutes it has been waiting
        assertThat(driver.findElement(card).getText())
                .containsPattern("Pedido nº " + number + " - \\d+ min")
                .contains("Mesa 4", "En preparación", "1 × Agua");

        clickInCard(card, "Cobrar en efectivo");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"),
                "Pedido nº " + number + " cobrado en efectivo."));
        clickInCard(card, "Marcar como listo");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(card, "Listo"));
        clickInCard(card, "Entregar");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"),
                "Pedido nº " + number + " entregado."));

        // Delivered: it is no longer pending, and it is the first finished order
        wait.until(ExpectedConditions.numberOfElementsToBe(card, 0));
        click(By.xpath("//button[@role='tab' and normalize-space()='Terminados']"));
        By finished = By.cssSelector("ul[aria-label='Pedidos terminados'] li");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(finished, "Pedido nº " + number));
        // "Pedido nº 1005 - 13:05": the time it was placed
        assertThat(driver.findElement(finished).getText())
                .containsPattern("Pedido nº " + number + " - \\d{1,2}:\\d{2}")
                .contains("Entregado", "Pagado");
    }

    @Test
    void anEmployeeCancelsAnOrderAfterConfirmingIt() {
        logIn("employee@kombo.com", "employee");
        wait.until(ExpectedConditions.urlMatches(".*/orders$"));
        String number = placeCounterOrder("Mesa 7");
        driver.get(BASE_URL + "/orders");
        By card = By.cssSelector("li[aria-label='Pedido nº " + number + "']");
        wait.until(ExpectedConditions.visibilityOfElementLocated(card));

        clickInCard(card, "Cancelar");
        click(By.xpath("//button[normalize-space()='Sí, cancelar el pedido']"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"),
                "Pedido nº " + number + " cancelado."));
        wait.until(ExpectedConditions.numberOfElementsToBe(card, 0));
    }

    @Test
    void customersCannotOpenTheDashboard() {
        logIn("customer@kombo.com", "customer");
        wait.until(ExpectedConditions.urlMatches(".*/profile$"));

        driver.get(BASE_URL + "/orders");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"),
                "No tienes acceso a esta página"));
        assertThat(driver.findElements(By.id("dashboard-title"))).isEmpty();
    }

    // Places a counter order of one water paid by card and returns its number
    private String placeCounterOrder(String customerName) {
        driver.get(BASE_URL);
        click(By.linkText("Agua"));
        click(By.xpath("//button[normalize-space()='Añadir al carrito +']"));
        wait.until(ExpectedConditions.textToBe(By.cssSelector("[data-testid='cart-count']"), "1"));
        driver.get(BASE_URL + "/checkout");
        wait.until(ExpectedConditions.elementToBeClickable(By.id("checkout-name"))).sendKeys(customerName);
        click(By.xpath("//button[starts-with(normalize-space(), 'Confirmar pedido')]"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("confirmation-title"),
                "Pedido confirmado"));
        return driver.findElement(By.cssSelector("[data-testid='order-number']")).getText();
    }

    private void clickInCard(By card, String button) {
        click(new ByChained(card, By.xpath(".//button[normalize-space()='" + button + "']")));
    }
}
