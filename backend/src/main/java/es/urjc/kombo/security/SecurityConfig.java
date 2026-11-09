package es.urjc.kombo.security;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

// Access rules of the REST API. Authentication is stateless: every request carries the JWT
// in an httpOnly cookie (see JwtService), so there is no HTTP session.
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    // Passwords are always stored encoded with BCrypt, never in plain text
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Built by Spring Boot with the UserDetailsService and PasswordEncoder beans; used by the login endpoint
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService,
            UserDetailsService userDetailsService,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver exceptionResolver) throws Exception {
        http
                // CSRF tokens are disabled because the session cookie is SameSite=Strict: the browser never
                // sends it in requests started from another site, which is the attack CSRF tokens prevent
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login", "/api/v1/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/users").hasRole("ADMIN")
                        // Ownership of /users/{id} and /orders/{id} is checked in the controllers and services
                        .requestMatchers("/api/**").authenticated()
                        // The React application (static files), Swagger UI and the OpenAPI document are public
                        .anyRequest().permitAll())
                // 401 and 403 are sent by GlobalExceptionHandler, so they have the same ProblemDetail
                // format as the rest of the errors of the API (the security filters run before Spring MVC)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                exceptionResolver.resolveException(request, response, null, exception))
                        .accessDeniedHandler((request, response, exception) ->
                                exceptionResolver.resolveException(request, response, null, exception)))
                .addFilterBefore(new JwtAuthenticationFilter(jwtService, userDetailsService),
                        UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
