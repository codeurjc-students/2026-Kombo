package es.urjc.kombo.controller;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.dto.ProductDTO;
import es.urjc.kombo.dto.ProductDetailDTO;
import es.urjc.kombo.service.ProductService;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // GET /api/v1/products?category=Burgers&page=0&size=10&sort=name
    @GetMapping
    public PagedModel<ProductDTO> getProducts(@RequestParam(required = false) String category,
            @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return new PagedModel<>(productService.findActive(category, pageable));
    }

    @GetMapping("/{id}")
    public ProductDetailDTO getProduct(@PathVariable long id) {
        return productService.findById(id);
    }

    // Returns the picture of the product as binary content, with its type in the Content-Type header
    @GetMapping("/{id}/image")
    public ResponseEntity<Resource> getProductImage(@PathVariable long id) {
        ImageFileDTO image = productService.findImage(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .body(image.content());
    }
}
