package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.groups.Tuple.tuple;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

import org.hibernate.engine.jdbc.proxy.BlobProxy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.dto.AdminProductDTO;
import es.urjc.kombo.dto.ComboItemDTO;
import es.urjc.kombo.dto.ComboItemRequestDTO;
import es.urjc.kombo.dto.ComboRequestDTO;
import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.dto.IngredientQuantityDTO;
import es.urjc.kombo.dto.ProductDTO;
import es.urjc.kombo.dto.ProductDetailDTO;
import es.urjc.kombo.dto.ProductIngredientDTO;
import es.urjc.kombo.dto.ProductRequestDTO;
import es.urjc.kombo.model.Combo;
import es.urjc.kombo.model.Image;
import es.urjc.kombo.model.Ingredient;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.repository.ComboRepository;
import es.urjc.kombo.repository.IngredientRepository;
import es.urjc.kombo.repository.ProductRepository;

// Without sample data: each test creates the products it needs
@SpringBootTest(properties = "kombo.sample-data.enabled=false")
@Import(TestcontainersConfiguration.class)
class ProductServiceIT {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ComboRepository comboRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    private static final byte[] IMAGE_CONTENT = {1, 2, 3, 4};

    private Product burger;
    private Product drink;
    private Ingredient bread;
    private Combo menu;

    @BeforeEach
    void setUp() {
        // Combos first, because they reference other products
        comboRepository.deleteAll();
        productRepository.deleteAll();
        ingredientRepository.deleteAll();

        bread = ingredientRepository.save(new Ingredient("Bread", "units", 100, 20));
        Ingredient beef = ingredientRepository.save(new Ingredient("Beef", "g", 5000, 1000));

        burger = new Product("Test Burger", new BigDecimal("5.00"), "Test description", "Burgers");
        burger.addIngredient(bread, 1);
        burger.addIngredient(beef, 150);
        burger.setImage(new Image(BlobProxy.generateProxy(IMAGE_CONTENT), "image/png", "Test Burger"));
        drink = new Product("Test Drink", new BigDecimal("1.50"), "Test description", "Drinks");
        Product hidden = new Product("Hidden Burger", new BigDecimal("6.00"), "Not shown in the menu", "Burgers");
        hidden.setActive(false);
        productRepository.saveAll(List.of(burger, drink, hidden));

        menu = new Combo("Test Menu", new BigDecimal("9.00"), "Two burgers", "Combos");
        menu.addProduct(burger, 2);
        productRepository.save(menu);
    }

    @Test
    void findActiveReturnsOnlyActiveProductsStoredInDatabase() {
        Page<ProductDTO> result = productService.findActive(null, PageRequest.of(0, 10));

        assertThat(result.getContent()).extracting(ProductDTO::name)
                .containsExactlyInAnyOrder("Test Burger", "Test Drink", "Test Menu");
    }

    @Test
    void findActiveFiltersByCategory() {
        Page<ProductDTO> result = productService.findActive("burgers", PageRequest.of(0, 10));

        assertThat(result.getContent()).extracting(ProductDTO::name).containsExactly("Test Burger");
    }

    // Combos are products too: they are listed in their own category
    @Test
    void findActiveListsTheCombosInTheirCategory() {
        Page<ProductDTO> result = productService.findActive("Combos", PageRequest.of(0, 10));

        assertThat(result.getContent()).extracting(ProductDTO::name).containsExactly("Test Menu");
    }

    @Test
    void findActiveReturnsTheRequestedPage() {
        Page<ProductDTO> result = productService.findActive(null, PageRequest.of(1, 2));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(3);
        assertThat(result.getTotalPages()).isEqualTo(2);
    }

    @Test
    void findByIdReturnsTheIngredientsOfAProduct() {
        ProductDetailDTO detail = productService.findById(burger.getId());

        assertThat(detail.combo()).isFalse();
        assertThat(detail.products()).isEmpty();
        assertThat(detail.ingredients())
                .extracting(ProductIngredientDTO::name, ProductIngredientDTO::quantity)
                .containsExactly(tuple("Beef", 150),
                        tuple("Bread", 1));
    }

    @Test
    void findByIdReturnsTheProductsAndIngredientsOfACombo() {
        ProductDetailDTO detail = productService.findById(menu.getId());

        assertThat(detail.combo()).isTrue();
        assertThat(detail.products()).extracting(item -> item.product().name(), ComboItemDTO::quantity)
                .containsExactly(tuple("Test Burger", 2));
        assertThat(detail.ingredients())
                .extracting(ProductIngredientDTO::name, ProductIngredientDTO::quantity)
                .containsExactly(tuple("Beef", 300),
                        tuple("Bread", 2));
    }

    @Test
    void findImageReturnsTheContentAndTypeOfTheProductImage() throws IOException {
        ImageFileDTO image = productService.findImage(burger.getId());

        assertThat(image.contentType()).isEqualTo("image/png");
        assertThat(image.content().getContentAsByteArray()).containsExactly(IMAGE_CONTENT);
    }

    @Test
    void findImageThrowsWhenTheProductHasNoImage() {
        long menuId = menu.getId();

        assertThatThrownBy(() -> productService.findImage(menuId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Product " + menuId + " has no image");
    }

    // Management of the administrator

    @Test
    void createAndUpdateProductStoreItsIngredientsInTheDatabase() {
        AdminProductDTO created = productService.createProduct(new ProductRequestDTO("New Burger",
                new BigDecimal("6.25"), "New", "Burgers", List.of(new IngredientQuantityDTO(bread.getId(), 2))));

        assertThat(productService.findForManagement(created.id()).ingredients())
                .extracting(ProductIngredientDTO::name, ProductIngredientDTO::quantity)
                .containsExactly(tuple("Bread", 2));

        productService.updateProduct(created.id(), new ProductRequestDTO("New Burger XL", new BigDecimal("7.00"),
                null, "Burgers", List.of()));

        Product stored = productRepository.findById(created.id()).orElseThrow();
        assertThat(stored.getName()).isEqualTo("New Burger XL");
        assertThat(stored.getPrice()).isEqualByComparingTo("7.00");
        assertThat(productService.findForManagement(created.id()).ingredients()).isEmpty();
    }

    @Test
    void createComboStoresItsProductsAndUpdateComboReplacesThem() {
        AdminProductDTO combo = productService.createCombo(new ComboRequestDTO("New Menu", new BigDecimal("6.00"),
                null, List.of(new ComboItemRequestDTO(burger.getId(), 1), new ComboItemRequestDTO(drink.getId(), 1))));

        assertThat(productService.findById(combo.id()).products())
                .extracting(item -> item.product().name()).containsExactly("Test Burger", "Test Drink");
        assertThat(productRepository.findById(combo.id()).orElseThrow().getCategory()).isEqualTo("Combos");

        productService.updateCombo(combo.id(), new ComboRequestDTO("New Menu", new BigDecimal("4.00"), null,
                List.of(new ComboItemRequestDTO(drink.getId(), 2))));

        assertThat(productService.findById(combo.id()).products())
                .extracting(item -> item.product().name(), ComboItemDTO::quantity)
                .containsExactly(tuple("Test Drink", 2));
    }

    @Test
    void aProductCanOnlyBeDeactivatedWhenNoActiveKomboIncludesIt() {
        assertThatThrownBy(() -> productService.changeActive(burger.getId(), false))
                .isInstanceOf(ProductInUseException.class)
                .hasMessage("The product is in active combos: Test Menu");

        productService.changeActive(menu.getId(), false);
        productService.changeActive(burger.getId(), false);

        assertThat(productRepository.findById(burger.getId()).orElseThrow().isActive()).isFalse();
        assertThat(productService.findActive(null, PageRequest.of(0, 10)).getContent()).extracting(ProductDTO::name)
                .containsExactly("Test Drink");
        // The kombo cannot be activated again while it includes the deactivated burger
        assertThatThrownBy(() -> productService.changeActive(menu.getId(), true))
                .isInstanceOf(ProductInUseException.class)
                .hasMessage("The combo includes deactivated products: Test Burger");
    }

    @Test
    void aProductRemovedFromItsKomboWithANewPriceCanBeDeactivated() {
        // The kombo keeps 2 units of the drink, with the price written by the administrator
        productService.updateCombo(menu.getId(), new ComboRequestDTO("Test Menu", new BigDecimal("3.50"), "Drinks",
                List.of(new ComboItemRequestDTO(drink.getId(), 2))));

        productService.changeActive(burger.getId(), false);

        // Read again from the database (the products of the kombo are loaded lazily)
        AdminProductDTO stored = productService.findForManagement(menu.getId());
        assertThat(stored.price()).isEqualByComparingTo("3.50");
        assertThat(stored.products()).extracting(item -> item.product().id()).containsExactly(drink.getId());
        assertThat(productRepository.findById(burger.getId()).orElseThrow().isActive()).isFalse();
    }

    @Test
    void theManagementListsActiveAndInactiveProductsAndKombos() {
        PageRequest page = PageRequest.of(0, 10, Sort.by("name"));

        assertThat(productService.findForManagement(null, null, page).getContent()).extracting(AdminProductDTO::name)
                .containsExactly("Hidden Burger", "Test Burger", "Test Drink", "Test Menu");
        assertThat(productService.findForManagement(true, false, page).getContent()).extracting(AdminProductDTO::name)
                .containsExactly("Test Burger", "Test Drink");
        assertThat(productService.findForManagement(false, null, page).getContent()).extracting(AdminProductDTO::name)
                .containsExactly("Hidden Burger");
        assertThat(productService.findForManagement(null, true, page).getContent()).extracting(AdminProductDTO::name)
                .containsExactly("Test Menu");
    }
}
