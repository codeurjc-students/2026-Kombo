package es.urjc.kombo.dto;

import java.math.BigDecimal;

public record OrderLineDTO(
        Long id,
        ProductDTO product,
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
}
