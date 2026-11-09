package es.urjc.kombo.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;

import io.jsonwebtoken.security.WeakKeyException;

class JwtServiceTest {

    private static final String SECRET = "a-secret-key-for-unit-tests-0123456789";

    private final JwtService jwtService = new JwtService(SECRET, Duration.ofHours(1));

    @Test
    void theEmailIsReadFromAValidToken() {
        String token = jwtService.createToken("customer@kombo.com");

        assertThat(jwtService.getEmail(token)).contains("customer@kombo.com");
    }

    @Test
    void aTokenSignedWithAnotherKeyIsRejected() {
        JwtService other = new JwtService("another-secret-key-for-unit-tests-9876543210", Duration.ofHours(1));
        String token = other.createToken("customer@kombo.com");

        assertThat(jwtService.getEmail(token)).isEmpty();
    }

    @Test
    void anExpiredTokenIsRejected() {
        JwtService expired = new JwtService(SECRET, Duration.ofSeconds(-1));
        String token = expired.createToken("customer@kombo.com");

        assertThat(jwtService.getEmail(token)).isEmpty();
    }

    @Test
    void aMalformedTokenIsRejected() {
        assertThat(jwtService.getEmail("not-a-token")).isEmpty();
    }

    @Test
    void aShortSecretIsRejectedAtStartup() {
        assertThatThrownBy(() -> new JwtService("too-short", Duration.ofHours(1)))
                .isInstanceOf(WeakKeyException.class);
    }

    @Test
    void theCookieIsHttpOnlySecureAndSameSiteStrict() {
        ResponseCookie cookie = jwtService.createCookie("token");

        assertThat(cookie.getName()).isEqualTo(JwtService.COOKIE_NAME);
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.isSecure()).isTrue();
        assertThat(cookie.getSameSite()).isEqualTo("Strict");
        assertThat(cookie.getMaxAge()).isEqualTo(Duration.ofHours(1));
    }

    @Test
    void theLogoutCookieExpiresImmediately() {
        assertThat(jwtService.deleteCookie().getMaxAge()).isZero();
    }
}
