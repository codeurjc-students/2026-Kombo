package es.urjc.kombo.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import es.urjc.kombo.dto.IngredientDTO;
import es.urjc.kombo.service.IngredientService;

// Ingredients, to choose the ingredients of a product (administrator). The inventory comes in Phase 4.
@RestController
@RequestMapping("/api/v1/admin/ingredients")
@PreAuthorize("hasRole('ADMIN')")
public class AdminIngredientController {

    private final IngredientService ingredientService;

    public AdminIngredientController(IngredientService ingredientService) {
        this.ingredientService = ingredientService;
    }

    // Sorted by name; the client asks for one page big enough for every ingredient (?size=100)
    @GetMapping
    public PagedModel<IngredientDTO> getIngredients(@PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return new PagedModel<>(ingredientService.findAll(pageable));
    }
}
