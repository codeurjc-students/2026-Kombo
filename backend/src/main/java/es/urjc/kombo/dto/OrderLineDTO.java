package es.urjc.kombo.dto;

import java.math.BigDecimal;

public record OrderLineDTO(
        Long id,
        ProductDTO product,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
}
