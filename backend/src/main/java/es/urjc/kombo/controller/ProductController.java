package es.urjc.kombo.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import es.urjc.kombo.model.Product;
import es.urjc.kombo.service.ProductService;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;



@RestController 
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService){
        this.productService = productService;
    }

    @GetMapping("")
    public List<Product> getProducts() {
        return productService.findAll();
    }
    
    
    
}
