package es.urjc.kombo.dto;

// Image data without the binary content, which is served by its own endpoint
public record ImageDTO(
        Long id,
        String text
) {
}
