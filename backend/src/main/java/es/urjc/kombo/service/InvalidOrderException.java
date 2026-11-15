package es.urjc.kombo.service;

// An order that cannot be placed with the data sent, for example a product that is not on the menu (400)
public class InvalidOrderException extends RuntimeException {

    public InvalidOrderException(String message) {
        super(message);
    }
}
