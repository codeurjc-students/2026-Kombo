package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

// A real Chrome browser signs up a new customer, who is logged in at once, and tries to repeat an email
class SignUpE2E extends E2ETestSupport {

    @Test
    void newCustomerSignsUpAndIsLoggedIn() {
        // A new email in every run, so the test can be repeated against the same database
        String email = "ui-test-" + System.currentTimeMillis() + "@example.com";

        signUp("Ana", email, "secret-password", "secret-password");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("profile-title"), "Ana Martín"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".toast"),
                "Hola, Ana. Tu cuenta se ha creado."));
        assertThat(driver.findElement(By.cssSelector(".navbar")).getText()).contains("Ana", "Cliente", "Cerrar sesión");
        assertThat(driver.findElement(By.tagName("main")).getText()).contains(email);
    }

    @Test
    void anEmailThatIsAlreadyRegisteredShowsAnError() {
        signUp("Lucía", "customer@kombo.com", "secret-password", "secret-password");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector("[role='alert']"),
                "Ya existe una cuenta con ese correo electrónico."));
    }

    @Test
    void differentPasswordsShowAnError() {
        signUp("Ana", "ui-test-mismatch@example.com", "secret-password", "other-password");

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector("[role='alert']"),
                "Las contraseñas no coinciden."));
        assertThat(driver.getCurrentUrl()).endsWith("/login");
    }

    private void signUp(String name, String email, String password, String repeatPassword) {
        driver.get(BASE_URL + "/login");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("sign-up-name"))).sendKeys(name);
        driver.findElement(By.id("sign-up-surname")).sendKeys("Martín");
        driver.findElement(By.id("sign-up-email")).sendKeys(email);
        driver.findElement(By.id("sign-up-phone")).sendKeys("600123456");
        driver.findElement(By.id("sign-up-password")).sendKeys(password);
        driver.findElement(By.id("sign-up-repeat-password")).sendKeys(repeatPassword);
        click(By.xpath("//button[normalize-space()='Crear cuenta']"));
    }
}
