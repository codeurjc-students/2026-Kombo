package es.urjc.kombo.controller;

import java.util.Objects;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import es.urjc.kombo.dto.LoginRequestDTO;
import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.security.JwtService;
import es.urjc.kombo.security.KomboUserDetails;
import es.urjc.kombo.service.UserService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService,
            UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    // Checks the email and password and sends the JWT in an httpOnly cookie.
    // Wrong credentials throw BadCredentialsException, answered with 401 by GlobalExceptionHandler.
    @PostMapping("/login")
    public ResponseEntity<UserDTO> login(@RequestBody LoginRequestDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(Objects.toString(request.email(), ""),
                        Objects.toString(request.password(), "")));
        KomboUserDetails user = (KomboUserDetails) authentication.getPrincipal();
        String token = jwtService.createToken(user.getUsername());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtService.createCookie(token).toString())
                .body(userService.findById(user.getId()));
    }

    // The JWT cannot be invalidated in the server (stateless): logging out deletes the cookie
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, jwtService.deleteCookie().toString())
                .build();
    }

    @GetMapping("/me")
    public UserDTO me(@AuthenticationPrincipal KomboUserDetails user) {
        return userService.findById(user.getId());
    }
}
