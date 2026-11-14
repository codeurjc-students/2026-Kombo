package es.urjc.kombo.service;

// Thrown when a user signs up with an email that another user already has; the REST API answers 409 Conflict
public class EmailAlreadyUsedException extends RuntimeException {

    public EmailAlreadyUsedException(String email) {
        super("The email " + email + " is already registered");
    }
}
