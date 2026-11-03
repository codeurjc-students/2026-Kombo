package es.urjc.kombo.dto;

// Ingredient used by a product and the quantity used (in the ingredient unit)
public record ProductIngredientDTO(
        Long id,
        String name,
        String unit,
        int quantity
) {
}
