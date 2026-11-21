package es.urjc.kombo.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Body of PUT /api/v1/users/me/addresses and PUT /api/v1/users/{id}/addresses: the whole list of saved addresses.
// Adding or deleting an address is sending the list with or without it. 255 is the size of the column.
public record AddressesUpdateDTO(
        @NotNull List<@NotBlank @Size(max = 255) String> addresses
) {
}
