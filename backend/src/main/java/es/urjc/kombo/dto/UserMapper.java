package es.urjc.kombo.dto;

import java.util.List;

import org.mapstruct.Mapper;

import es.urjc.kombo.model.User;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserDTO toDTO(User user);

    List<UserDTO> toDTOs(List<User> users);
}
