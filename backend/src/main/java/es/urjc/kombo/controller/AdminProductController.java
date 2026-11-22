package es.urjc.kombo.controller;

import java.net.URI;

import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import es.urjc.kombo.dto.AdminProductDTO;
import es.urjc.kombo.dto.ComboRequestDTO;
import es.urjc.kombo.dto.ImageFileDTO;
import es.urjc.kombo.dto.ProductRequestDTO;
import es.urjc.kombo.dto.ProductStatusDTO;
import es.urjc.kombo.service.ProductService;
import jakarta.validation.Valid;

// Management of the menu by the administrator: products and kombos (combos in the code), also the deactivated
// ones. The menu of the customers is GET /api/v1/products, which only has the active ones.
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    // Products and kombos, with the optional filters active and combo, for example
    // GET /api/v1/admin/products?active=true&combo=false (the products that can be added to a kombo)
    @GetMapping("/products")
    public PagedModel<AdminProductDTO> getProducts(@RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean combo, @PageableDefault(size = 10, sort = "id") Pageable pageable) {
        return new PagedModel<>(productService.findForManagement(active, combo, pageable));
    }

    @GetMapping("/products/{id}")
    public AdminProductDTO getProduct(@PathVariable long id) {
        return productService.findForManagement(id);
    }

    // Answers 201 with the new product and its URL in the Location header, and 400 if the data is not valid
    @PostMapping("/products")
    public ResponseEntity<AdminProductDTO> createProduct(@Valid @RequestBody ProductRequestDTO request) {
        return created(productService.createProduct(request));
    }

    // Answers 400 for a kombo, which is changed with PUT /api/v1/admin/combos/{id}
    @PutMapping("/products/{id}")
    public AdminProductDTO updateProduct(@PathVariable long id, @Valid @RequestBody ProductRequestDTO request) {
        return productService.updateProduct(id, request);
    }

    // Activates or deactivates a product or a kombo; 409 if an active kombo includes the product, or if the
    // kombo includes a deactivated product
    @PatchMapping("/products/{id}")
    public AdminProductDTO changeActive(@PathVariable long id, @Valid @RequestBody ProductStatusDTO status) {
        return productService.changeActive(id, status.active());
    }

    // Picture of a product or kombo, uploaded as multipart/form-data in the field "image". Answers 400 if the file
    // is not a JPEG, PNG, GIF or WebP picture and 413 if it is bigger than 10 MB.
    @PutMapping(path = "/products/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AdminProductDTO updateImage(@PathVariable long id, @RequestParam("image") MultipartFile image) {
        return productService.updateImage(id, image);
    }

    // The picture also of a deactivated product. no-cache: a new picture is shown at once with the same URL.
    @GetMapping("/products/{id}/image")
    public ResponseEntity<Resource> getImage(@PathVariable long id) {
        ImageFileDTO image = productService.findImageForManagement(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.noCache())
                .body(image.content());
    }

    // Answers 201 with the new kombo and its URL in the Location header, and 400 if the data is not valid (also a
    // product that does not exist, is not active or is a kombo, or less than 2 units)
    @PostMapping("/combos")
    public ResponseEntity<AdminProductDTO> createCombo(@Valid @RequestBody ComboRequestDTO request) {
        return created(productService.createCombo(request));
    }

    @PutMapping("/combos/{id}")
    public AdminProductDTO updateCombo(@PathVariable long id, @Valid @RequestBody ComboRequestDTO request) {
        return productService.updateCombo(id, request);
    }

    // Products and kombos are read at /api/v1/admin/products/{id}
    private static ResponseEntity<AdminProductDTO> created(AdminProductDTO product) {
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/v1/admin/products/{id}")
                .buildAndExpand(product.id()).toUri();
        return ResponseEntity.created(location).body(product);
    }
}
