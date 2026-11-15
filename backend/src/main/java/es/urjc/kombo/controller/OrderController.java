package es.urjc.kombo.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.dto.OrderRequestDTO;
import es.urjc.kombo.security.KomboUserDetails;
import es.urjc.kombo.service.OrderService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

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

    // A customer can only read their own orders (checked in OrderService)
    @GetMapping("/{id}")
    public OrderDTO getOrder(@PathVariable long id, @AuthenticationPrincipal KomboUserDetails user) {
        return orderService.findById(id, user);
    }
}
