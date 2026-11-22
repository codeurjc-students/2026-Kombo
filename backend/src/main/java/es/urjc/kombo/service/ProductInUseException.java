package es.urjc.kombo.service;

import java.util.List;

import es.urjc.kombo.dto.ProductReferenceDTO;

// Thrown when a product cannot be deactivated because active kombos include it, or a kombo cannot be activated
// because it includes deactivated products; the REST API answers 409 Conflict with the ids and names of those
// kombos or products
public class ProductInUseException extends RuntimeException {

    private final transient List<ProductReferenceDTO> products;

    public ProductInUseException(String message, List<ProductReferenceDTO> products) {
        super(message + ": " + String.join(", ", products.stream().map(ProductReferenceDTO::name).toList()));
        this.products = List.copyOf(products);
    }

    public List<ProductReferenceDTO> getProducts() {
        return products;
    }
}
