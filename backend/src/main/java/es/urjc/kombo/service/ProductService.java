package es.urjc.kombo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import es.urjc.kombo.model.Product;
import es.urjc.kombo.repository.ProductRepository;

@Service 
public class ProductService {
    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository){
        this.productRepository = productRepository;
    }

    public List<Product> findAll(){
        return productRepository.findAll();
    }
    
}
