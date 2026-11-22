package es.urjc.kombo.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import es.urjc.kombo.dto.IngredientDTO;
import es.urjc.kombo.dto.IngredientMapper;
import es.urjc.kombo.repository.IngredientRepository;

// Ingredients of the restaurant. For now they are only read, to choose the ingredients of a product; the inventory
// (stock and alert limits) is managed in Phase 4.
@Service
@Transactional(readOnly = true)
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final IngredientMapper ingredientMapper;

    public IngredientService(IngredientRepository ingredientRepository, IngredientMapper ingredientMapper) {
        this.ingredientRepository = ingredientRepository;
        this.ingredientMapper = ingredientMapper;
    }

    public Page<IngredientDTO> findAll(Pageable pageable) {
        return ingredientRepository.findAll(pageable).map(ingredientMapper::toDTO);
    }
}
