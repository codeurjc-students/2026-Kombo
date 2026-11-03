package es.urjc.kombo.dto;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import es.urjc.kombo.model.Order;

@Mapper(componentModel = "spring", uses = OrderLineMapper.class)
public interface OrderMapper {

    @Mapping(target = "userId", source = "user.id")
    OrderDTO toDTO(Order order);

    List<OrderDTO> toDTOs(List<Order> orders);
}
