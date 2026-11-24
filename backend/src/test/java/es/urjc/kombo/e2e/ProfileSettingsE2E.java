package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

// A real Chrome browser manages the account of a new customer from the settings page: personal data, password,
// saved addresses, profile picture and deletion of the account
class ProfileSettingsE2E extends E2ETestSupport {

    private static final String PASSWORD = "secret-password";
    private static final By ADDRESSES = By.cssSelector("section[aria-labelledby='addresses-title']");

    @Test
    void customerChangesTheirPersonalData() {
        signUpNewCustomer("ui-profile", PASSWORD);
        openSettings();

        assertThat(driver.findElement(By.id("profile-email")).isEnabled()).isFalse();
        replaceText(By.id("profile-name"), "Ana María");
        replaceText(By.id("profile-phone"), "611222333");
        click(By.xpath("//button[normalize-space()='Guardar datos']"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"), "Tus datos se han guardado."));
        click(By.linkText("Volver a mis pedidos"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("profile-title"), "Ana María"));
        assertThat(driver.findElement(By.tagName("main")).getText()).contains("611222333");
    }

    @Test
    void wrongDataIsShownAndNotSaved() {
        signUpNewCustomer("ui-profile-error", PASSWORD);
        openSettings();

        replaceText(By.id("profile-phone"), "123");
        click(By.xpath("//button[normalize-space()='Guardar datos']"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"),
                "Escribe un teléfono de 9 a 15 cifras."));
        click(By.linkText("Volver a mis pedidos"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.id("profile-title"), "Ana"));
        assertThat(driver.findElement(By.tagName("main")).getText()).doesNotContain("123");
    }

    @Test
    void customerChangesTheirPasswordAndLogsInWithTheNewOne() {
        String email = signUpNewCustomer("ui-password", PASSWORD);
        openSettings();
        openTab("Seguridad");

        driver.findElement(By.id("password-current")).sendKeys(PASSWORD);
        driver.findElement(By.id("password-new")).sendKeys("new-secret-password");
        driver.findElement(By.id("password-repeat")).sendKeys("new-secret-password");
        click(By.xpath("//button[normalize-space()='Cambiar contraseña']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"), "Tu contraseña se ha cambiado."));

        clickInNavbar(By.xpath("//nav//button[normalize-space() = 'Cerrar sesión']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".navbar"), "Iniciar sesión"));
        logIn(email, "new-secret-password");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".navbar"), "Cerrar sesión"));
    }

    @Test
    void customerAddsAndDeletesSavedAddresses() {
        signUpNewCustomer("ui-addresses", PASSWORD);
        openSettings();
        openTab("Direcciones");

        driver.findElement(By.id("address-new")).sendKeys("Calle Mayor 1");
        click(By.xpath("//button[normalize-space()='Añadir dirección']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(ADDRESSES, "Calle Mayor 1"));
        driver.findElement(By.id("address-new")).sendKeys("Calle Luna 2");
        click(By.xpath("//button[normalize-space()='Añadir dirección']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(ADDRESSES, "Calle Luna 2"));

        click(By.cssSelector("button[aria-label='Borrar Calle Mayor 1']"));

        wait.until(ExpectedConditions.not(ExpectedConditions.textToBePresentInElementLocated(ADDRESSES, "Calle Mayor 1")));
        assertThat(driver.findElement(ADDRESSES).getText()).contains("Calle Luna 2");
    }

    @Test
    void customerUploadsAndRemovesTheirProfilePicture() {
        signUpNewCustomer("ui-picture", PASSWORD);
        openSettings();

        driver.findElement(By.id("picture-file")).sendKeys(
                Path.of("src/main/resources/sample-images/chocolate-sundae.jpg").toAbsolutePath().toString());
        click(By.xpath("//button[normalize-space()='Guardar foto']"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"), "Tu foto se ha guardado."));
        By picture = By.cssSelector("main img[alt='Foto de perfil de Ana']");
        wait.until(driver -> (Boolean) ((JavascriptExecutor) driver).executeScript(
                "const img = document.querySelector(arguments[0]); return img !== null && img.complete && img.naturalWidth > 0;",
                "main img[alt='Foto de perfil de Ana']"));

        click(By.xpath("//button[normalize-space()='Quitar foto']"));

        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"), "Tu foto se ha quitado."));
        assertThat(driver.findElements(picture)).isEmpty();
    }

    @Test
    void customerDeletesTheirAccount() {
        String email = signUpNewCustomer("ui-delete", PASSWORD);
        openSettings();
        openTab("Cuenta");

        click(By.xpath("//button[normalize-space()='Eliminar cuenta']"));
        click(By.xpath("//button[normalize-space()='Sí, eliminar mi cuenta']"));

        wait.until(ExpectedConditions.urlToBe(BASE_URL + "/"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".toast"), "Tu cuenta se ha eliminado."));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".navbar"), "Iniciar sesión"));

        logIn(email, PASSWORD);
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector("[role='alert']"),
                "El correo electrónico o la contraseña no son correctos."));
    }

    // From the "Mi perfil" link of the menu, as for the employees and the administrator
    private void openSettings() {
        driver.get(BASE_URL + "/profile");
        clickInNavbar(By.linkText("Mi perfil"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("h1"), "Mi perfil"));
    }

    // The settings are grouped in tabs: "Perfil" is open at first
    private void openTab(String name) {
        click(By.xpath("//button[@role='tab' and normalize-space()='" + name + "']"));
    }

    private void replaceText(By locator, String text) {
        WebElement field = driver.findElement(locator);
        field.clear();
        field.sendKeys(text);
    }
}
