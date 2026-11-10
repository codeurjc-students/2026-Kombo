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

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.dto.ComboItemDTO;
import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.dto.ProductDTO;
import es.urjc.kombo.dto.ProductDetailDTO;
import es.urjc.kombo.dto.ProductIngredientDTO;
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
    private Combo menu;

    @BeforeEach
    void setUp() {
        // Combos first, because they reference other products
        comboRepository.deleteAll();
        productRepository.deleteAll();
        ingredientRepository.deleteAll();

        Ingredient bread = ingredientRepository.save(new Ingredient("Bread", "units", 100, 20));
        Ingredient beef = ingredientRepository.save(new Ingredient("Beef", "g", 5000, 1000));

        burger = new Product("Test Burger", new BigDecimal("5.00"), "Test description", "Burgers");
        burger.addIngredient(bread, 1);
        burger.addIngredient(beef, 150);
        burger.setImage(new Image(BlobProxy.generateProxy(IMAGE_CONTENT), "image/png", "Test Burger"));
        Product drink = new Product("Test Drink", new BigDecimal("1.50"), "Test description", "Drinks");
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
}
