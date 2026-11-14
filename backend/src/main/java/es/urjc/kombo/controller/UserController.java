package es.urjc.kombo.controller;

import java.net.URI;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.SignUpRequestDTO;
import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.service.OrderService;
import es.urjc.kombo.service.UserService;
import jakarta.validation.Valid;

// Ownership rule: a user can only read their own data (#id is their id); the administrator can read any user
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private static final String OWNER_OR_ADMIN = "hasRole('ADMIN') or #id == authentication.principal.id";

    private final UserService userService;
    private final OrderService orderService;

    public UserController(UserService userService, OrderService orderService) {
        this.userService = userService;
        this.orderService = orderService;
    }

    // Only the administrator (rule in SecurityConfig)
    @GetMapping
    public PagedModel<UserDTO> getUsers(@PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return new PagedModel<>(userService.findAll(pageable));
    }

    // Sign up of a new customer (public, rule in SecurityConfig). Answers 201 with the new user and its URL
    // in the Location header, 400 if a field is not valid and 409 if the email is already registered.
    // It does not log in: the client calls POST /api/v1/auth/login afterwards.
    @PostMapping
    public ResponseEntity<UserDTO> signUp(@Valid @RequestBody SignUpRequestDTO request) {
        UserDTO user = userService.signUp(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(user.id()).toUri();
        return ResponseEntity.created(location).body(user);
    }

    @GetMapping("/{id}")
    @PreAuthorize(OWNER_OR_ADMIN)
    public UserDTO getUser(@PathVariable long id) {
        return userService.findById(id);
    }

    // Order history of the user, the most recent first
    @GetMapping("/{id}/orders")
    @PreAuthorize(OWNER_OR_ADMIN)
    public PagedModel<OrderDTO> getUserOrders(@PathVariable long id,
            @PageableDefault(size = 10) Pageable pageable) {
        return new PagedModel<>(orderService.findByUser(id, pageable));
    }
}
