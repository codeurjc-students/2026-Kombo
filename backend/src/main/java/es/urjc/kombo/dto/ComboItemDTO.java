package es.urjc.kombo.dto;

// Product included in a combo and how many units the combo includes
public record ComboItemDTO(
        ProductDTO product,
        int quantity
) {
}
