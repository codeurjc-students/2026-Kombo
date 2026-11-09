package es.urjc.kombo.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

// Creates and validates the JWT of the session and the httpOnly cookie that carries it
@Service
public class JwtService {

    public static final String COOKIE_NAME = "kombo_token";

    private final SecretKey key;
    private final Duration expiration;

    public JwtService(@Value("${kombo.jwt.secret}") String secret,
            @Value("${kombo.jwt.expiration:PT2H}") Duration expiration) {
        // HS256 needs a key of at least 256 bits; Keys.hmacShaKeyFor fails at startup with a shorter secret
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    public String createToken(String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(key)
                .compact();
    }

    // Returns the email of the token, or empty if the token is not valid (wrong signature, expired...)
    public Optional<String> getEmail(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload().getSubject());
        } catch (JwtException | IllegalArgumentException exception) {
            return Optional.empty();
        }
    }

    // httpOnly: JavaScript cannot read the token (protects it from XSS).
    // Secure: only sent over HTTPS. SameSite=Strict: not sent by requests started from other sites,
    // which is what protects the API from CSRF (see SecurityConfig).
    public ResponseCookie createCookie(String token) {
        return baseCookie(token).maxAge(expiration).build();
    }

    public ResponseCookie deleteCookie() {
        return baseCookie("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/");
    }
}
