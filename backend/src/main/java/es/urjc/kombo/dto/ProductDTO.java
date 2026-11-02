package es.urjc.kombo.dto;

import java.math.BigDecimal;

public record ProductDTO(
        Long id,
        String name,
        BigDecimal price,
        String description,
        String category
) {
}