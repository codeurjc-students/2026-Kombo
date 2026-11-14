package es.urjc.kombo.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.ProductRepository;
import es.urjc.kombo.repository.UserRepository;

// With kombo.sample-data.enabled=false the loader is not created: the only sample user is the administrator,
// which AdminInitializer always creates.
// Spring reuses the context (and the database) of ProductServiceIT and UserServiceIT, which have the same
// configuration and save their own test products and users, so the checks look for the sample data instead
// of an empty database and do not depend on the order of the tests.
@SpringBootTest(properties = "kombo.sample-data.enabled=false")
@Import(TestcontainersConfiguration.class)
class SampleDataDisabledIT {

    @Autowired
    private ApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void sampleDataIsNotLoaded() {
        assertThat(context.getBeansOfType(SampleDataLoader.class)).isEmpty();
        assertThat(productRepository.findAll()).extracting(Product::getName)
                .doesNotContain("Hamburguesa clásica", "Hamburguesa de pollo", "Patatas fritas", "Refresco de cola", "Menú clásico");
    }

    @Test
    void theOnlySampleUserIsTheAdministratorWithThePasswordOfTheConfiguration() {
        User admin = userRepository.findByEmail("admin@kombo.com").orElseThrow();
        assertThat(admin.getRole()).isEqualTo(User.Role.ADMIN);
        assertThat(passwordEncoder.matches("admin", admin.getPassword())).isTrue();
        assertThat(userRepository.countByRole(User.Role.ADMIN)).isEqualTo(1);
        assertThat(userRepository.findAll()).extracting(User::getEmail)
                .doesNotContain("customer@kombo.com", "employee@kombo.com");
    }
}
