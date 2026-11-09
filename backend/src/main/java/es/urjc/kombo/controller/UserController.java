package es.urjc.kombo.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.UserDTO;
import es.urjc.kombo.service.OrderService;
import es.urjc.kombo.service.UserService;

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
