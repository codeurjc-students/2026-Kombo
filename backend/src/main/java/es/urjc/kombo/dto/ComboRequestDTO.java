package es.urjc.kombo.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Body of POST and PUT /api/v1/admin/combos: a kombo, its price (written by the administrator) and its products.
// The category is always Combos. The products must be active products that are not kombos (checked in
// ProductService), with at least 2 units in total.
public record ComboRequestDTO(
        @NotBlank @Size(max = 100) String name,
        @NotNull @DecimalMin("0.01") @Digits(integer = 5, fraction = 2) BigDecimal price,
        @Size(max = 255) String description,
        @NotEmpty List<@Valid @NotNull ComboItemRequestDTO> products
) {
}
