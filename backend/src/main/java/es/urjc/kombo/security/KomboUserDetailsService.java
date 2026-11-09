package es.urjc.kombo.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import es.urjc.kombo.repository.UserRepository;

// Loads the users of the database for Spring Security. The email is the username.
@Service
public class KomboUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public KomboUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return userRepository.findByEmail(email)
                .map(KomboUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("User " + email + " not found"));
    }
}
