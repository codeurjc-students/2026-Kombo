package es.urjc.kombo.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Body of POST and PUT /api/v1/admin/products: a product of the menu (not a kombo) and its ingredients.
// The category is one of the menu categories except Combos, which is only for the kombos.
public record ProductRequestDTO(
        @NotBlank @Size(max = 100) String name,
        @NotNull @DecimalMin("0.01") @Digits(integer = 5, fraction = 2) BigDecimal price,
        @Size(max = 255) String description,
        @NotNull @Pattern(regexp = "Burgers|Sides|Drinks|Desserts",
                message = "must be Burgers, Sides, Drinks or Desserts") String category,
        @NotNull List<@Valid @NotNull IngredientQuantityDTO> ingredients
) {
}
