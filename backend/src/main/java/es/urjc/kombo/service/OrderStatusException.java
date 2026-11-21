package es.urjc.kombo.service;

// Thrown when an order cannot change as requested because of its current state (for example, delivering a
// cancelled order or an order not paid yet); the REST API answers 409 Conflict
public class OrderStatusException extends RuntimeException {

    public OrderStatusException(String message) {
        super(message);
    }
}
