package es.urjc.kombo.controller;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.OrderRequestDTO;
import es.urjc.kombo.dto.OrderUpdateDTO;
import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.User;
import es.urjc.kombo.security.KomboUserDetails;
import es.urjc.kombo.service.OrderService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    // The employees and the administrator manage the orders
    private static final String STAFF = "hasAnyRole('EMPLOYEE', 'ADMIN')";

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // Checkout: anonymous users, customers and employees (counter orders) can place orders; the administrator
    // cannot. Answers 201 with the new order and its URL in the Location header, and 400 if the data is not valid.
    @PostMapping
    @PreAuthorize("!hasRole('ADMIN')")
    public ResponseEntity<OrderDTO> createOrder(@Valid @RequestBody OrderRequestDTO request,
            @AuthenticationPrincipal KomboUserDetails user) {
        OrderDTO order = orderService.create(request, user);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(order.id()).toUri();
        return ResponseEntity.created(location).body(order);
    }

    // Dashboard of the employees and the administrator: the orders in the statuses of the URL, placed from since (a
    // local date and time, optional), by age (oldest first by default). For example:
    // GET /api/v1/orders?status=DELIVERED&status=CANCELLED&since=2026-11-22T00:00:00&sort=createdAt,desc
    @GetMapping
    @PreAuthorize(STAFF)
    public PagedModel<OrderDTO> getOrders(@RequestParam(required = false) List<Order.OrderStatus> status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return new PagedModel<>(orderService.findByStatus(status, since, pageable));
    }

    // Employees and the administrator change the status of an order or mark a cash order as paid; a customer can
    // only cancel one of their orders, with { "status": "CANCELLED" }. Answers 400 if the body is not valid, 403 if
    // a customer sends another change or the order of another user, and 409 if the order cannot change that way
    // (see OrderService.update and OrderService.cancelByCustomer).
    @PatchMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public OrderDTO updateOrder(@PathVariable long id, @RequestBody OrderUpdateDTO changes,
            @AuthenticationPrincipal KomboUserDetails user) {
        if (user.getRole() == User.Role.CUSTOMER) {
            return orderService.cancelByCustomer(id, changes, user);
        }
        return orderService.update(id, changes);
    }

    // A customer can only read their own orders (checked in OrderService)
    @GetMapping("/{id}")
    public OrderDTO getOrder(@PathVariable long id, @AuthenticationPrincipal KomboUserDetails user) {
        return orderService.findById(id, user);
    }
}
