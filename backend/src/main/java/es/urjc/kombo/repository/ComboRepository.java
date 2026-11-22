package es.urjc.kombo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import es.urjc.kombo.model.Combo;
import es.urjc.kombo.model.Product;

public interface ComboRepository extends JpaRepository<Combo, Long> {

    // Active kombos that include the product (a product in one of them cannot be deactivated)
    @Query("""
            select c from Combo c join c.products item
            where key(item) = :product and c.active = true
            order by c.name
            """)
    List<Combo> findActiveCombosWith(@Param("product") Product product);
}
