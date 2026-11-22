package es.urjc.kombo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

// An ingredient used by a product and the quantity used (in the unit of the ingredient), in ProductRequestDTO
public record IngredientQuantityDTO(
        @NotNull Long ingredientId,
        @Positive @Max(10000) int quantity
) {
}
