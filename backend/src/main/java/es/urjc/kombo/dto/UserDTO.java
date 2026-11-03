package es.urjc.kombo.dto;

import java.util.List;

import es.urjc.kombo.model.User;

// User data without the password
public record UserDTO(
        Long id,
        String name,
        String surname,
        String email,
        String phone,
        User.Role role,
        List<String> addresses
) {
}
