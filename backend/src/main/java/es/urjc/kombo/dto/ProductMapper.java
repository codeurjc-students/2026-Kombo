package es.urjc.kombo.dto;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import es.urjc.kombo.model.Combo;
import es.urjc.kombo.model.Ingredient;
import es.urjc.kombo.model.Product;

@Mapper(componentModel = "spring", imports = Combo.class)
public interface ProductMapper {

    ProductDTO toBasicDTO(Product product);

    List<ProductDTO> toBasicDTOs(List<Product> products);

    @Mapping(target = "combo", expression = "java(product instanceof Combo)")
    @Mapping(target = "ingredients", source = "ingredientUsage")
    @Mapping(target = "products", expression = "java(toComboItemDTOs(product))")
    ProductDetailDTO toDetailDTO(Product product);

    // Converts the ingredients map (ingredient -> quantity) into a list sorted by name
    default List<ProductIngredientDTO> toIngredientDTOs(Map<Ingredient, Integer> ingredients) {
        return ingredients.entrySet().stream()
                .map(entry -> new ProductIngredientDTO(entry.getKey().getId(), entry.getKey().getName(),
                        entry.getKey().getUnit(), entry.getValue()))
                .sorted(Comparator.comparing(ProductIngredientDTO::name))
                .toList();
    }

    // Products of a combo with their quantities; empty for a normal product
    default List<ComboItemDTO> toComboItemDTOs(Product product) {
        if (!(product instanceof Combo combo)) {
            return List.of();
        }
        return combo.getProducts().entrySet().stream()
                .map(entry -> new ComboItemDTO(toBasicDTO(entry.getKey()), entry.getValue()))
                .sorted(Comparator.comparing(item -> item.product().name()))
                .toList();
    }
}
