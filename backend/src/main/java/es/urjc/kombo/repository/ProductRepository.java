package es.urjc.kombo.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import es.urjc.kombo.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByActiveTrueAndCategoryIgnoreCase(String category, Pageable pageable);

    Optional<Product> findByIdAndActiveTrue(Long id);

    // Management of the administrator: active and inactive products and kombos. Each filter is optional (null):
    // active (true or false) and combo (true: only kombos; false: only products that are not kombos).
    @Query("""
            select p from Product p
            where (:active is null or p.active = :active)
              and (:combo is null or (:combo = true and type(p) = Combo) or (:combo = false and type(p) <> Combo))
            """)
    Page<Product> findForManagement(@Param("active") Boolean active, @Param("combo") Boolean combo,
            Pageable pageable);
}
