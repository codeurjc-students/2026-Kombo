package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

// A real Chrome browser: the administrator creates a product from the products page (looking for its ingredient
// by writing part of its name), sees it in the menu, deactivates it (in grey, out of the menu) and cannot
// deactivate a product of an active kombo: a window lists those kombos, with a link to change each one.
// What is created is left deactivated, so the menu of the other tests does not change.
class ProductManagementE2E extends E2ETestSupport {

    @Test
    void theAdministratorCreatesAProductAndDeactivatesIt() {
        String name = "Hamburguesa e2e " + System.currentTimeMillis();
        logIn("admin@kombo.com", "admin");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".navbar"), "Cerrar sesión"));

        driver.get(BASE_URL + "/admin/products");
        click(By.linkText("Nuevo producto"));
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("product-name"))).sendKeys(name);
        driver.findElement(By.id("product-price")).sendKeys("6,75");
        new Select(driver.findElement(By.id("product-category"))).selectByVisibleText("Hamburguesas");
        click(By.xpath("//button[normalize-space()='Añadir ingrediente']"));
        // The ingredient is found by writing part of its name, without upper case or accents
        WebElement ingredient = driver.findElement(By.cssSelector("[role='combobox'][aria-label='Ingrediente 1']"));
        ingredient.click();
        ingredient.sendKeys("PAN DE HAMBURGUÉSA");
        click(By.xpath("//li[@role='option' and normalize-space()='Pan de hamburguesa']"));
        click(By.xpath("//button[normalize-space()='Guardar']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), name + " se ha guardado."));

        // In the menu of the customers
        driver.get(BASE_URL + "/");
        click(By.xpath("//button[contains(@class, 'category-pill') and normalize-space()='Hamburguesas']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"), name));

        WebElement card = showCardOf(name);
        assertThat(card.getText()).contains("Pan de hamburguesa", "6,75");
        click(By.xpath(cardXpath(name) + "//button[normalize-space()='Desactivar']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"),
                name + " ya no sale en la carta."));
        wait.until(ExpectedConditions.attributeContains(By.xpath(cardXpath(name)), "class", "is-inactive"));
        assertThat(driver.findElement(By.xpath(cardXpath(name))).getText()).contains("Desactivado");
    }

    @Test
    void aProductOfAnActiveKomboCannotBeDeactivated() {
        logIn("admin@kombo.com", "admin");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".navbar"), "Cerrar sesión"));

        showCardOf("Hamburguesa clásica");
        click(By.xpath(cardXpath("Hamburguesa clásica") + "//button[normalize-space()='Desactivar']"));

        // A window lists the active kombos that include it, with a link to change each one
        By dialog = By.cssSelector("div[role='dialog']");
        wait.until(ExpectedConditions.textToBePresentInElementLocated(dialog, "CONFLICTO"));
        assertThat(driver.findElement(dialog).getText()).contains("Hamburguesa clásica no se puede desactivar");
        assertThat(driver.findElement(dialog).getText()).contains("Kombo clásico", "Kombo familiar");
        assertThat(driver.findElement(By.xpath(cardXpath("Hamburguesa clásica"))).getAttribute("class"))
                .doesNotContain("is-inactive");

        click(By.cssSelector("div[role='dialog'] a[aria-label='Modificar Kombo clásico']"));
        wait.until(ExpectedConditions.urlMatches(".*/admin/combos/\\d+$"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("h1"), "Modificar Kombo clásico"));
        assertThat(driver.findElements(dialog)).isEmpty();
    }

    private static String cardXpath(String name) {
        return "//article[.//h2[normalize-space()='" + name + "']]";
    }

    // The products page shows 12 at a time, oldest first: "Más resultados" is clicked until the product is shown
    private WebElement showCardOf(String name) {
        driver.get(BASE_URL + "/admin/products");
        By card = By.xpath(cardXpath(name));
        By more = By.xpath("//button[normalize-space()='Más resultados']");
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("ul[aria-label='Productos y kombos']")));
        while (driver.findElements(card).isEmpty()) {
            click(more);
            wait.until(ExpectedConditions.or(ExpectedConditions.presenceOfElementLocated(card),
                    ExpectedConditions.elementToBeClickable(more)));
        }
        return driver.findElement(card);
    }
}
