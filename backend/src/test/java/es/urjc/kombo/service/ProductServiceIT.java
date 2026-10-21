package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.model.Product;
import es.urjc.kombo.repository.ProductRepository;

@SpringBootTest 
@Import (TestcontainersConfiguration.class)
public class ProductServiceIT {
    @Autowired 
    private ProductService productService;

    @Autowired 
    private ProductRepository productRepository;

    @BeforeEach 
    void setUp(){
        productRepository.deleteAll();
        productRepository.saveAll(List.of(new Product("Test Burger", new BigDecimal("5.00"), "Test description", "Burgers"),
                new Product("Test Drink", new BigDecimal("1.50"), "Test description", "Drinks")));
    }

    @Test 
    void findAllReturnsProductsStoredInDatabase(){
        List<Product> result = productService.findAll();

        assertThat(result).extracting(Product::getName).containsExactlyInAnyOrder("Test Burger", "Test Drink");
    }
    
}
