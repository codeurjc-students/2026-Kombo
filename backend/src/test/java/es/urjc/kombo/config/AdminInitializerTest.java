package es.urjc.kombo.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.UserRepository;

class AdminInitializerTest {

    private static final String HASH = "$2b$10$GfBhP7nNxexOinn7O4x0w.GfVoH.WobAAFbuerLEUfjiiP43QFFd6";

    private final UserRepository userRepository = mock(UserRepository.class);

    @Test
    void createsTheAdministratorWithTheHashOfTheConfiguration() {
        when(userRepository.findByEmail("admin@kombo.com")).thenReturn(Optional.empty());

        new AdminInitializer(userRepository, "admin@kombo.com", HASH).run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getRole()).isEqualTo(User.Role.ADMIN);
        assertThat(saved.getValue().getPassword()).isEqualTo(HASH);
    }

    @Test
    void updatesThePasswordOfAnExistingAdministrator() {
        User existing = new User("Admin", "Kombo", "admin@kombo.com", null, "old", User.Role.ADMIN);
        when(userRepository.findByEmail("admin@kombo.com")).thenReturn(Optional.of(existing));

        new AdminInitializer(userRepository, "admin@kombo.com", HASH).run();

        assertThat(existing.getPassword()).isEqualTo(HASH);
    }

    @Test
    void aHashEscapedForDockerComposeIsAccepted() {
        when(userRepository.findByEmail("admin@kombo.com")).thenReturn(Optional.empty());

        new AdminInitializer(userRepository, "admin@kombo.com", HASH.replace("$", "$$")).run();

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getPassword()).isEqualTo(HASH);
    }

    @Test
    void aPlainPasswordIsRejected() {
        AdminInitializer initializer = new AdminInitializer(userRepository, "admin@kombo.com", "admin");

        assertThatThrownBy(initializer::run).isInstanceOf(IllegalStateException.class);
        verify(userRepository, never()).save(any());
    }
}
