package es.urjc.kombo.dto;

import java.math.BigDecimal;

// Delivery cost of home deliveries, the subtotal from which delivery is free and the percentage of the total that
// the restaurant keeps when a customer cancels a paid order that is already ready
public record SettingsDTO(
        BigDecimal deliveryCost,
        BigDecimal freeDeliveryThreshold,
        int cancellationFeePercent
) {
}
