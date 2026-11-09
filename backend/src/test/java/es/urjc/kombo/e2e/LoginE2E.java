package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

// A real Chrome browser logs in with the sample customer, sees their orders and logs out
class LoginE2E extends E2ETestSupport {

    @Test
    void customerLogsInSeesTheirOrdersAndLogsOut() {
        logIn("customer@kombo.com", "customer");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("orders-title"), "Mis pedidos"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"), "Pedido nº 1"));
        assertThat(driver.findElement(By.cssSelector(".navbar")).getText()).contains("Lucía", "Mis pedidos");

        pressWithKeyboard(By.xpath("//nav//button[normalize-space() = 'Cerrar sesión']"));

        // Back on the menu, with the confirmation and the navigation bar of an anonymous user
        wait.until(ExpectedConditions.urlToBe(BASE_URL + "/"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".toast"), "Has cerrado sesión."));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".navbar"), "Iniciar sesión"));
        assertThat(driver.findElement(By.cssSelector(".navbar")).getText()).doesNotContain("Lucía", "Cerrar sesión");

        // The session really ended in the server (the cookie was deleted): a protected page asks to log in again
        driver.get(BASE_URL + "/profile");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("login-title"), "Inicia sesión"));
    }

    @Test
    void wrongPasswordShowsAnError() {
        logIn("customer@kombo.com", "wrong-password");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector("[role='alert']"),
                "El correo electrónico o la contraseña no son correctos."));
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
        click(By.cssSelector("button[type='submit']"));
    }
}
