package es.urjc.kombo.dto;

import java.util.List;

import es.urjc.kombo.model.User;

// User data without the password. imageId is the id of the profile picture (GET .../image), or null without one:
// it changes with every new picture, so the client can add it to the URL and the browser shows the new one.
public record UserDTO(
        Long id,
        String name,
        String surname,
        String email,
        String phone,
        User.Role role,
        List<String> addresses,
        Long imageId
) {
}
