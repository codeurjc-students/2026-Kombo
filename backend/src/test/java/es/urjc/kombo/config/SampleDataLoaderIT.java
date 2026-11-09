package es.urjc.kombo.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.model.Combo;
import es.urjc.kombo.model.Ingredient;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.ComboRepository;
import es.urjc.kombo.repository.IngredientRepository;
import es.urjc.kombo.repository.OrderRepository;
import es.urjc.kombo.repository.ProductRepository;
import es.urjc.kombo.repository.UserRepository;

// Sample data enabled (default value of kombo.sample-data.enabled): it is loaded when the application starts
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class SampleDataLoaderIT {

    @Autowired
    private SampleDataLoader sampleDataLoader;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ComboRepository comboRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void loadsProductsCombosAndIngredients() {
        assertThat(productRepository.count()).isEqualTo(12);
        assertThat(comboRepository.findAll()).extracting(Combo::getName)
                .containsExactlyInAnyOrder("Menú clásico", "Menú de pollo", "Menú familiar");
        assertThat(ingredientRepository.count()).isEqualTo(15);
        assertThat(ingredientRepository.findAll()).filteredOn(Ingredient::isLowStock)
                .extracting(Ingredient::getName).containsExactly("Bacon");
    }

    @Test
    void loadsOneUserOfEachRoleWithEncodedPasswords() {
        List<User> users = userRepository.findAll();

        assertThat(users).extracting(User::getRole)
                .containsExactlyInAnyOrder(User.Role.CUSTOMER, User.Role.EMPLOYEE, User.Role.ADMIN);
        User admin = userRepository.findByEmail("admin@kombo.com").orElseThrow();
        assertThat(admin.getPassword()).isNotEqualTo("admin");
        assertThat(passwordEncoder.matches("admin", admin.getPassword())).isTrue();
    }

    // Every sample product has its picture in resources/sample-images (named after the key of the product)
    @Test
    @Transactional
    void loadsThePictureOfEveryProduct() {
        assertThat(productRepository.findAll()).allSatisfy(product -> {
            assertThat(product.getImage()).as(product.getName()).isNotNull();
            assertThat(product.getImage().getContentType()).isEqualTo("image/jpeg");
        });
    }

    @Test
    void loadsOrdersInEveryStatus() {
        assertThat(orderRepository.findAll()).extracting(Order::getStatus)
                .containsExactlyInAnyOrder(Order.OrderStatus.DELIVERED, Order.OrderStatus.IN_PREPARATION,
                        Order.OrderStatus.READY, Order.OrderStatus.CANCELLED);
    }

    @Test
    void doesNotLoadTheDataTwice() {
        sampleDataLoader.run();

        assertThat(productRepository.count()).isEqualTo(12);
        assertThat(userRepository.count()).isEqualTo(3);
    }
}
