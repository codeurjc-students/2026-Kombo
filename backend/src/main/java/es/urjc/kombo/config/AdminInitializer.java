package es.urjc.kombo.config;

import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.model.User;
import es.urjc.kombo.repository.UserRepository;

// Creates the only administrator of the application when it starts, or updates its password.
// The password is never in the code: the configuration contains its BCrypt hash, read from the
// environment variable KOMBO_ADMIN_PASSWORD_HASH. Changing the variable and restarting changes the password.
// Runs before SampleDataLoader (lower order value).
@Component
@Order(1)
public class AdminInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    // $2a$, $2b$ or $2y$, the cost and 53 characters of salt and hash
    private static final Pattern BCRYPT_HASH = Pattern.compile("^\\$2[aby]?\\$\\d{2}\\$[./A-Za-z0-9]{53}$");

    private final UserRepository userRepository;
    private final String email;
    private final String passwordHash;

    public AdminInitializer(UserRepository userRepository, @Value("${kombo.admin.email}") String email,
            @Value("${kombo.admin.password-hash}") String passwordHash) {
        this.userRepository = userRepository;
        this.email = email;
        // The same .env file is read by docker compose, where every "$" of the hash must be written as "$$".
        // A BCrypt hash never contains "$$", so undoing the escape lets Spring read that file too.
        this.passwordHash = passwordHash.replace("$$", "$");
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!BCRYPT_HASH.matcher(passwordHash).matches()) {
            throw new IllegalStateException("KOMBO_ADMIN_PASSWORD_HASH must be a BCrypt hash, not a plain password");
        }
        User admin = userRepository.findByEmail(email)
                .orElseGet(() -> new User("Admin", "Kombo", email, null, passwordHash, User.Role.ADMIN));
        admin.setPassword(passwordHash);
        admin.setRole(User.Role.ADMIN);
        userRepository.save(admin);

        long admins = userRepository.countByRole(User.Role.ADMIN);
        if (admins > 1) {
            log.warn("There are {} users with the ADMIN role; only {} should have it", admins, email);
        }
        log.info("Administrator {} ready", email);
    }
}
