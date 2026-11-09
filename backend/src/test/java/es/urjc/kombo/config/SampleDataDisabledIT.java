package es.urjc.kombo.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.ProductRepository;
import es.urjc.kombo.repository.UserRepository;

// With kombo.sample-data.enabled=false the loader is not created: the database only has the administrator,
// which AdminInitializer always creates
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
        assertThat(productRepository.count()).isZero();
    }

    @Test
    void theOnlyUserIsTheAdministratorWithThePasswordOfTheConfiguration() {
        assertThat(userRepository.findAll()).singleElement().satisfies(admin -> {
            assertThat(admin.getEmail()).isEqualTo("admin@kombo.com");
            assertThat(admin.getRole()).isEqualTo(User.Role.ADMIN);
            assertThat(passwordEncoder.matches("admin", admin.getPassword())).isTrue();
        });
    }
}
