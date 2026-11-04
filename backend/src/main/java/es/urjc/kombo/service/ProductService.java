package es.urjc.kombo.service;

import java.sql.Blob;
import java.sql.SQLException;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.dto.ProductDTO;
import es.urjc.kombo.dto.ProductDetailDTO;
import es.urjc.kombo.dto.ProductMapper;
import es.urjc.kombo.model.Image;
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
        return productMapper.toDetailDTO(findActiveProduct(id));
    }

    // The image is read inside the transaction because its binary content (Blob) is only available while it is open
    @Transactional(readOnly = true)
    public ImageFileDTO findImage(long id) {
        Image image = findActiveProduct(id).getImage();
        if (image == null) {
            throw new ResourceNotFoundException("Product " + id + " has no image");
        }
        return new ImageFileDTO(image.getContentType(), new ByteArrayResource(readBytes(image.getImage())));
    }

    private Product findActiveProduct(long id) {
        return productRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product " + id + " not found"));
    }

    private static byte[] readBytes(Blob blob) {
        try {
            return blob.getBytes(1, (int) blob.length());
        } catch (SQLException exception) {
            throw new IllegalStateException("The image could not be read from the database", exception);
        }
    }
}
