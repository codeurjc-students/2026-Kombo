package es.urjc.kombo.dto;

// Id and name of a product or kombo, in the 409 answers of the management (for example the active kombos that
// include a product), so the client can link to them
public record ProductReferenceDTO(
        Long id,
        String name
) {
}
