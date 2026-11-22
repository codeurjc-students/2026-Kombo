package es.urjc.kombo.dto;

import java.math.BigDecimal;
import java.util.List;

// A product or kombo for the management of the administrator: the detail of the menu plus whether it is active and
// the id of its picture (null without one; it changes with every new picture, so the client can add it to the URL)
public record AdminProductDTO(
        Long id,
        String name,
        BigDecimal price,
        String description,
        String category,
        boolean combo,
        boolean active,
        Long imageId,
        List<ProductIngredientDTO> ingredients,
        List<ComboItemDTO> products
) {
}
