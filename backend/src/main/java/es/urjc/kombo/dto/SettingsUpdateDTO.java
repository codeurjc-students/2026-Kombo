package es.urjc.kombo.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

// Settings that the administrator can change: the delivery cost, in euros with two decimals
public record SettingsUpdateDTO(
        @NotNull @DecimalMin("0.00") @DecimalMax("99.99") @Digits(integer = 2, fraction = 2) BigDecimal deliveryCost
) {
}
