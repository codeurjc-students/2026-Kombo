package es.urjc.kombo.dto;

import java.util.List;

import org.mapstruct.Mapper;

import es.urjc.kombo.model.Ingredient;

@Mapper(componentModel = "spring")
public interface IngredientMapper {

    IngredientDTO toDTO(Ingredient ingredient);

    List<IngredientDTO> toDTOs(List<Ingredient> ingredients);
}
