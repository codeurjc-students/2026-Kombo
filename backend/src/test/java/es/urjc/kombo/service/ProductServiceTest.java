package es.urjc.kombo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import es.urjc.kombo.model.Product;
import es.urjc.kombo.repository.ProductRepository;
import org.hibernate.annotations.Changelog.Timestamp;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith (MockitoExtension.class)
class ProductServiceTest {

    //creates a false repository
    @Mock 
    private ProductRepository productRepository;

    @InjectMocks 
    private ProductService productService;

    @Test 
    void finalAllReturnsAllProductsFromRepository(){
        List<Product> products = List.of(new Product("Test Burger", new BigDecimal("5.00"), "Test description", "Burgers"),
                                new  Product("Test Drink", new BigDecimal("2.70"), "Test description", "Burgers"));
        when(productRepository.findAll()).thenReturn(products);

        List<Product> result = productService.findAll();

        assertThat(result).extracting(Product::getName).containsExactly("Test Burger", "Test Drink");

 
    }
}