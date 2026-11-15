package es.urjc.kombo.dto;

import java.util.List;

import es.urjc.kombo.model.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Order sent by the checkout: the cart, how it is delivered, how it is paid and the contact data.
// The delivery address is only required for home deliveries (checked in OrderService).
public record OrderRequestDTO(
        @NotEmpty @Size(max = 50) List<@Valid @NotNull OrderLineRequestDTO> lines,
        @NotNull Order.DeliveryType deliveryType,
        @Size(max = 255) String deliveryAddress,
        @NotNull Order.PaymentMethod paymentMethod,
        @NotBlank @Size(max = 100) String customerName,
        @NotBlank @Email @Size(max = 255) String customerEmail,
        @NotBlank @Pattern(regexp = "\\+?[0-9 ]{9,15}") String customerPhone
) {
}
