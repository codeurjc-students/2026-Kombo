package es.urjc.kombo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import es.urjc.kombo.model.Order;

public record OrderDTO(
        Long id,
        Integer orderNumber,
        Long userId,
        List<OrderLineDTO> lines,
        Order.DeliveryType deliveryType,
        String deliveryAddress,
        Order.OrderStatus status,
        Order.PaymentMethod paymentMethod,
        boolean paid,
        String customerName,
        String customerEmail,
        String customerPhone,
        LocalDateTime createdAt,
        LocalDateTime deliveredAt,
        BigDecimal deliveryCost,
        BigDecimal total
) {
}
