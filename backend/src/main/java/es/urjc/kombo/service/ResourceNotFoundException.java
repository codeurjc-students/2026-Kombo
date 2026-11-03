package es.urjc.kombo.service;

// Thrown when a requested resource does not exist; the REST API answers 404 Not Found
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
