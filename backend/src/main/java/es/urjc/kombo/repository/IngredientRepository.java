package es.urjc.kombo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import es.urjc.kombo.model.Ingredient;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    
}
