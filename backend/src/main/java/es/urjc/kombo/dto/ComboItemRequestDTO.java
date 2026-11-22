package es.urjc.kombo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

// A product included in a kombo and how many units, in ComboRequestDTO
public record ComboItemRequestDTO(
        @NotNull Long productId,
        @Positive @Max(20) int quantity
) {
}
