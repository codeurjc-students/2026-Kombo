package es.urjc.kombo.service;

// Thrown when an uploaded picture is bigger than its limit (1 MB for profile pictures and 10 MB for products and
// kombos); the REST API answers 413 Payload Too Large, as Spring does for files bigger than the multipart limit
public class ImageTooLargeException extends RuntimeException {

    public ImageTooLargeException(String message) {
        super(message);
    }
}
