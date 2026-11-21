package es.urjc.kombo.service;

// Thrown when the current password given to change it is not right; the REST API answers 400 Bad Request
public class WrongPasswordException extends RuntimeException {

    public WrongPasswordException() {
        super("currentPassword: is not correct");
    }
}
