package es.urjc.kombo.dto;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import es.urjc.kombo.model.User;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "imageId", source = "image.id")
    UserDTO toDTO(User user);

    List<UserDTO> toDTOs(List<User> users);
}
