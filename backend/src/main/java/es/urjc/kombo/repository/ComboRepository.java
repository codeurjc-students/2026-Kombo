package es.urjc.kombo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import es.urjc.kombo.model.Combo;

public interface ComboRepository extends JpaRepository<Combo, Long> {
    
}
