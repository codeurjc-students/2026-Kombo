package es.urjc.kombo.repository;



import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;  
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.User;
import es.urjc.kombo.model.Order.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long>  {
    Page<Order> findByUserOrderByCreatedAtDesc(User user, Pageable pageable );
    Optional<Order> findFirstByUserOrderByCreatedAtDesc(User user);

    List<Order> findByStatusOrderByCreatedAtAsc(OrderStatus status);

    // When a customer deletes their account their orders are kept for the sales, without the customer data
    @Modifying
    @Query("update Order o set o.user = null, o.customerName = null, o.customerEmail = null, o.customerPhone = null"
            + " where o.user = :user")
    int anonymizeOrdersOf(@Param("user") User user);



}
