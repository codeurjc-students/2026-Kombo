package es.urjc.kombo.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import es.urjc.kombo.dto.UserCreationRequestDTO;
import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.service.UserService;
import jakarta.validation.Valid;

// The administrator creates customers and employees. The public sign up (always a customer) is POST /api/v1/users;
// the rest of the management of the users (read, change and delete) is in the /api/v1/users/{id} paths.
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    // Answers 201 with the new user and its URL (/api/v1/users/{id}) in the Location header, 400 if a field is not
    // valid (also the role ADMIN) and 409 if the email is already registered
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserCreationRequestDTO request) {
        UserDTO user = userService.createUser(request);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/v1/users/{id}")
                .buildAndExpand(user.id()).toUri();
        return ResponseEntity.created(location).body(user);
    }
}
