package es.urjc.kombo.dto;

import es.urjc.kombo.model.Order;

// Body of PATCH /api/v1/orders/{id} (employees and the administrator): the new status, the cash payment or both.
// A field that is not sent (null) does not change.
public record OrderUpdateDTO(
        Order.OrderStatus status,
        Boolean paid
) {
}
