package es.urjc.kombo.repository;


import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import es.urjc.kombo.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long>{
    Page<Product> findByActiveTrue(Pageable pageable); 
}