package es.urjc.kombo.dto;

import java.util.List;

import org.mapstruct.Mapper;


import es.urjc.kombo.model.Product;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    ProductDTO toBasicDTO(Product product);

    List<ProductDTO> toBasicDTOs(List<Product> products);
}