package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.dto.SignUpRequestDTO;
import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.UserRepository;

// Real service and MySQL database (Testcontainers), without sample data
@SpringBootTest(properties = "kombo.sample-data.enabled=false")
@Import(TestcontainersConfiguration.class)
class UserServiceIT {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.findByEmail("ana@example.com").ifPresent(userRepository::delete);
    }

    @Test
    void signUpStoresTheCustomerInTheDatabaseWithAnEncodedPassword() {
        UserDTO user = userService.signUp(new SignUpRequestDTO("Ana", "Martín", "ana@example.com", "600123456",
                "secret-password"));

        User stored = userRepository.findById(user.id()).orElseThrow();
        assertThat(stored.getEmail()).isEqualTo("ana@example.com");
        assertThat(stored.getRole()).isEqualTo(User.Role.CUSTOMER);
        assertThat(stored.getPassword()).isNotEqualTo("secret-password");
        assertThat(passwordEncoder.matches("secret-password", stored.getPassword())).isTrue();
    }

    @Test
    void signUpRejectsAnEmailThatIsAlreadyInTheDatabase() {
        userService.signUp(new SignUpRequestDTO("Ana", null, "ana@example.com", null, "secret-password"));
        long users = userRepository.count();

        assertThatThrownBy(() -> userService.signUp(new SignUpRequestDTO("Otra Ana", null, "ana@example.com", null,
                "other-password")))
                .isInstanceOf(EmailAlreadyUsedException.class);
        assertThat(userRepository.count()).isEqualTo(users);
    }
}
