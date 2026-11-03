package es.urjc.kombo.dto;

import org.mapstruct.Mapper;

import es.urjc.kombo.model.OrderLine;

@Mapper(componentModel = "spring", uses = ProductMapper.class)
public interface OrderLineMapper {

    OrderLineDTO toDTO(OrderLine orderLine);
}
