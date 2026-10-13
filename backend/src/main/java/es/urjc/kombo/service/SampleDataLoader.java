package es.urjc.kombo.service;

import es.urjc.kombo.model.Product;
import es.urjc.kombo.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SampleDataLoader implements CommandLineRunner {

    private final ProductRepository productRepository;

    public SampleDataLoader(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return;
        }
        productRepository.saveAll(List.of(
                new Product("Classic Burger", new BigDecimal("8.50"),
                        "Beef burger with lettuce, tomato and cheese", "Burgers"),
                new Product("Chicken Burger", new BigDecimal("7.90"),
                        "Crispy chicken burger with mayonnaise", "Burgers"),
                new Product("French Fries", new BigDecimal("2.95"),
                        "Medium portion of fries", "Sides"),
                new Product("Cola", new BigDecimal("2.20"),
                        "500 ml soft drink", "Drinks")));
    }
}