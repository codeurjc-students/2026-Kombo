package es.urjc.kombo.security;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Reads the JWT from the session cookie and, if it is valid, authenticates the request.
// Without a valid cookie the request continues as anonymous and the access rules decide.
// Not a @Component on purpose: Spring Boot would also register it as a plain servlet filter,
// outside the security chain. SecurityConfig creates it and adds it to the chain.
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        readToken(request).flatMap(jwtService::getEmail).ifPresent(email -> authenticate(email, request));
        chain.doFilter(request, response);
    }

    private Optional<String> readToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> JwtService.COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> !value.isBlank())
                .findFirst();
    }

    // The user is loaded again so a deleted user or a changed role takes effect immediately
    private void authenticate(String email, HttpServletRequest request) {
        try {
            UserDetails user = userDetailsService.loadUserByUsername(email);
            var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (UsernameNotFoundException exception) {
            SecurityContextHolder.clearContext();
        }
    }
}
