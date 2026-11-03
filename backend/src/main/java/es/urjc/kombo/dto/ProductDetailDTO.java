package es.urjc.kombo.dto;

import java.math.BigDecimal;
import java.util.List;

// Detail of a product or combo: ingredients used and, for a combo, its products
public record ProductDetailDTO(
        Long id,
        String name,
        BigDecimal price,
        String description,
        String category,
        boolean combo,
        List<ProductIngredientDTO> ingredients,
        List<ComboItemDTO> products
) {
}
