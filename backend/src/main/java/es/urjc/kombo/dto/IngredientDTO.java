package es.urjc.kombo.dto;

public record IngredientDTO(
        Long id,
        String name,
        String unit,
        int stock,
        int alertLimit,
        boolean lowStock
) {
}
