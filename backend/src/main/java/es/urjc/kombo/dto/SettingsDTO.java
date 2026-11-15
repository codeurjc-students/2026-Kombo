package es.urjc.kombo.dto;

import java.math.BigDecimal;

// Delivery cost of home deliveries and the subtotal from which delivery is free
public record SettingsDTO(
        BigDecimal deliveryCost,
        BigDecimal freeDeliveryThreshold
) {
}
