package es.urjc.kombo.e2e;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

// A real Chrome browser: the administrator creates an employee from the users page, who can then log in, changes
// their personal data and deletes them
class UserManagementE2E extends E2ETestSupport {

    private static final String PASSWORD = "secret-password";

    @Test
    void theAdministratorCreatesAnEmployeeWhoCanLogIn() {
        String email = "ui-employee-" + System.currentTimeMillis() + "@kombo.com";
        logIn("admin@kombo.com", "admin");
        createEmployee(email);

        clickInNavbar(By.xpath("//nav//button[normalize-space() = 'Cerrar sesión']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".navbar"), "Iniciar sesión"));
        logIn(email, PASSWORD);
        // Employees are taken to the order dashboard
        wait.until(ExpectedConditions.urlToBe(BASE_URL + "/orders"));
    }

    @Test
    void theAdministratorEditsAndDeletesAnEmployee() {
        String email = "ui-edit-employee-" + System.currentTimeMillis() + "@kombo.com";
        logIn("admin@kombo.com", "admin");
        createEmployee(email);

        showRowOf(email);
        click(By.xpath("//tr[td[normalize-space()='" + email + "']]//a[normalize-space()='Editar']"));
        WebElement name = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("profile-name")));
        name.clear();
        name.sendKeys("Luis Miguel");
        click(By.xpath("//button[normalize-space()='Guardar datos']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("main"),
                "Los datos se han guardado."));
        assertThat(driver.findElement(By.tagName("main")).getText()).contains("Luis Miguel");

        click(By.xpath("//button[normalize-space()='Borrar usuario']"));
        click(By.xpath("//div[@role='dialog']//button[normalize-space()='Sí, borrar']"));
        wait.until(ExpectedConditions.urlToBe(BASE_URL + "/admin/users"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"),
                "Se ha borrado a Luis Miguel."));
    }

    // The list shows 10 users per page, oldest first: "Más resultados" is clicked until the user is shown
    private void showRowOf(String email) {
        By row = By.xpath("//tr[td[normalize-space()='" + email + "']]");
        By more = By.xpath("//button[normalize-space()='Más resultados']");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("table")));
        while (driver.findElements(row).isEmpty()) {
            click(more);
            wait.until(ExpectedConditions.or(ExpectedConditions.presenceOfElementLocated(row),
                    ExpectedConditions.elementToBeClickable(more)));
        }
    }

    // Creates an employee called Luis from the users page and waits until the list shows them
    private void createEmployee(String email) {
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".navbar"), "Cerrar sesión"));
        driver.get(BASE_URL + "/admin/users");
        click(By.linkText("Nuevo usuario"));
        new Select(wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("new-user-role"))))
                .selectByVisibleText("Empleado");
        driver.findElement(By.id("new-user-name")).sendKeys("Luis");
        driver.findElement(By.id("new-user-email")).sendKeys(email);
        driver.findElement(By.id("new-user-password")).sendKeys(PASSWORD);
        driver.findElement(By.id("new-user-repeat-password")).sendKeys(PASSWORD);
        click(By.xpath("//button[normalize-space()='Crear usuario']"));
        wait.until(ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"),
                "Se ha creado el empleado Luis."));
    }
}
