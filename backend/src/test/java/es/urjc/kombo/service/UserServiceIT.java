package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.dto.AddressesUpdateDTO;
import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.dto.PasswordChangeDTO;
import es.urjc.kombo.dto.ProfileUpdateDTO;
import es.urjc.kombo.dto.SignUpRequestDTO;
import es.urjc.kombo.dto.UserCreationRequestDTO;
import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.OrderRepository;
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

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setUp() {
        userRepository.findByEmail("ana@example.com").ifPresent(user -> userService.deleteAccount(user.getId()));
        userRepository.findByEmail("luis@kombo.com").ifPresent(user -> userService.deleteAccount(user.getId()));
    }

    @Test
    void createUserStoresTheEmployeeInTheDatabaseWithAnEncodedPassword() {
        UserDTO user = userService.createUser(new UserCreationRequestDTO("Luis", "Gómez", "luis@kombo.com",
                "600123456", "secret-password", "EMPLOYEE"));

        User stored = userRepository.findById(user.id()).orElseThrow();
        assertThat(stored.getRole()).isEqualTo(User.Role.EMPLOYEE);
        assertThat(stored.getSurname()).isEqualTo("Gómez");
        assertThat(passwordEncoder.matches("secret-password", stored.getPassword())).isTrue();
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

    @Test
    void updateProfileStoresTheNewDataInTheDatabase() {
        UserDTO user = userService.signUp(new SignUpRequestDTO("Ana", "Martín", "ana@example.com", "600123456",
                "secret-password"));

        userService.updateProfile(user.id(), new ProfileUpdateDTO("Ana María", null, "611222333"));

        User stored = userRepository.findById(user.id()).orElseThrow();
        assertThat(stored.getName()).isEqualTo("Ana María");
        assertThat(stored.getSurname()).isNull();
        assertThat(stored.getPhone()).isEqualTo("611222333");
        assertThat(stored.getEmail()).isEqualTo("ana@example.com");
    }

    @Test
    void changePasswordStoresTheNewPasswordEncodedInTheDatabase() {
        UserDTO user = userService.signUp(new SignUpRequestDTO("Ana", null, "ana@example.com", null,
                "secret-password"));

        userService.changePassword(user.id(), new PasswordChangeDTO("secret-password", "new-secret-password"));

        String stored = userRepository.findById(user.id()).orElseThrow().getPassword();
        assertThat(stored).isNotEqualTo("new-secret-password");
        assertThat(passwordEncoder.matches("new-secret-password", stored)).isTrue();
        assertThat(passwordEncoder.matches("secret-password", stored)).isFalse();
    }

    @Test
    void updateAddressesStoresTheNewListInTheDatabase() {
        UserDTO user = signUpAna();

        userService.updateAddresses(user.id(), new AddressesUpdateDTO(List.of("Calle Mayor 1", "Calle Luna 2")));
        userService.updateAddresses(user.id(), new AddressesUpdateDTO(List.of("Calle Luna 2")));

        assertThat(userService.findById(user.id()).addresses()).containsExactly("Calle Luna 2");
    }

    @Test
    void theProfilePictureIsStoredInTheDatabaseAndCanBeDeleted() throws IOException {
        UserDTO user = signUpAna();

        UserDTO withImage = userService.updateImage(user.id(),
                new MockMultipartFile("image", "photo.jpg", "image/jpeg", ImageServiceTest.JPEG));

        assertThat(withImage.imageId()).isNotNull();
        ImageFileDTO stored = userService.findImage(user.id());
        assertThat(stored.contentType()).isEqualTo("image/jpeg");
        assertThat(stored.content().getContentAsByteArray()).containsExactly(ImageServiceTest.JPEG);

        userService.deleteImage(user.id());

        assertThat(userService.findById(user.id()).imageId()).isNull();
        assertThatThrownBy(() -> userService.findImage(user.id())).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteAccountDeletesTheUserAndKeepsTheirOrdersWithoutCustomerData() {
        UserDTO user = signUpAna();
        Order order = new Order(userRepository.findById(user.id()).orElseThrow(), Order.DeliveryType.TAKE_AWAY,
                Order.PaymentMethod.CASH);
        order.setCustomerName("Ana");
        order.setCustomerEmail("ana@example.com");
        order.setCustomerPhone("600123456");
        long orderId = orderRepository.save(order).getId();

        userService.deleteAccount(user.id());

        assertThat(userRepository.findById(user.id())).isEmpty();
        Order kept = orderRepository.findById(orderId).orElseThrow();
        assertThat(kept.getUser()).isNull();
        assertThat(kept.getCustomerName()).isNull();
        assertThat(kept.getCustomerEmail()).isNull();
        assertThat(kept.getCustomerPhone()).isNull();
    }

    private UserDTO signUpAna() {
        return userService.signUp(new SignUpRequestDTO("Ana", null, "ana@example.com", null, "secret-password"));
    }
}
