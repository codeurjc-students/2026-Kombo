package es.urjc.kombo.service;

// Thrown when an uploaded file is empty, too big or not a picture; the REST API answers 400 Bad Request
public class InvalidImageException extends RuntimeException {

    public InvalidImageException(String message) {
        super(message);
    }
}
