package es.urjc.kombo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Body of PUT /api/v1/users/me/password. The new password follows the rules of the sign up.
public record PasswordChangeDTO(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8, max = 72) String newPassword
) {
}
