package es.urjc.kombo.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

// Settings that the administrator can change: the delivery cost, in euros with two decimals, and the percentage of
// the total kept when a customer cancels a paid order that is already ready (from 0 to 100)
public record SettingsUpdateDTO(
        @NotNull @DecimalMin("0.00") @DecimalMax("99.99") @Digits(integer = 2, fraction = 2) BigDecimal deliveryCost,
        @NotNull @Min(0) @Max(100) Integer cancellationFeePercent
) {
}
