package es.urjc.kombo.dto;

import jakarta.validation.constraints.NotNull;

// Body of PATCH /api/v1/admin/products/{id}: activates or deactivates a product or a kombo. Products are never
// deleted, because the orders keep a reference to them; a deactivated one is not shown in the menu.
public record ProductStatusDTO(
        @NotNull Boolean active
) {
}
