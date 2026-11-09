package es.urjc.kombo.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import es.urjc.kombo.dto.OrderDTO;
import es.urjc.kombo.security.KomboUserDetails;
import es.urjc.kombo.service.OrderService;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // A customer can only read their own orders (checked in OrderService)
    @GetMapping("/{id}")
    public OrderDTO getOrder(@PathVariable long id, @AuthenticationPrincipal KomboUserDetails user) {
        return orderService.findById(id, user);
    }
}
