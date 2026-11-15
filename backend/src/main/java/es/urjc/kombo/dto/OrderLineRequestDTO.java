package es.urjc.kombo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

// A product of the cart and its units. The price is not sent: the server uses the current price.
public record OrderLineRequestDTO(
        @NotNull Long productId,
        @Min(1) @Max(99) int quantity
) {
}
