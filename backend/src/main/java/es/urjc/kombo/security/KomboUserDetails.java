package es.urjc.kombo.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import es.urjc.kombo.model.User;

// Authenticated user as seen by Spring Security. It keeps the id so the ownership rules
// can compare it with the id of the requested resource without querying the database again.
public class KomboUserDetails implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final User.Role role;

    public KomboUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.role = user.getRole();
    }

    public Long getId() {
        return id;
    }

    public User.Role getRole() {
        return role;
    }

    // Spring Security expects role authorities with the "ROLE_" prefix (hasRole("ADMIN") checks "ROLE_ADMIN")
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }
}
