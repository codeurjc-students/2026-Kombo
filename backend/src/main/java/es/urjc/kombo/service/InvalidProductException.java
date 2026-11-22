package es.urjc.kombo.service;

// Thrown when a product or a kombo has data that the validation of the request cannot check (for example an
// ingredient that does not exist or a kombo with an inactive product); the REST API answers 400 Bad Request
public class InvalidProductException extends RuntimeException {

    public InvalidProductException(String message) {
        super(message);
    }
}
