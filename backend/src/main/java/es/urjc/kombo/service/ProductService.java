package es.urjc.kombo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.dto.ProductDTO;
import es.urjc.kombo.dto.ProductDetailDTO;
import es.urjc.kombo.dto.ProductMapper;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductService(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    // Active products of the menu, optionally filtered by category, one page at a time
    @Transactional(readOnly = true)
    public Page<ProductDTO> findActive(String category, Pageable pageable) {
        Page<Product> products = (category == null || category.isBlank())
                ? productRepository.findByActiveTrue(pageable)
                : productRepository.findByActiveTrueAndCategoryIgnoreCase(category, pageable);
        return products.map(productMapper::toBasicDTO);
    }

    // The mapping runs inside the transaction because the ingredients and the products of a combo are loaded lazily
    @Transactional(readOnly = true)
    public ProductDetailDTO findById(long id) {
        return productRepository.findByIdAndActiveTrue(id)
                .map(productMapper::toDetailDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Product " + id + " not found"));
    }
}
