package es.urjc.kombo.dto;

import org.springframework.core.io.Resource;

// Binary content of an image and its MIME type, returned by the image endpoints (not as JSON)
public record ImageFileDTO(
        String contentType,
        Resource content
) {
}
