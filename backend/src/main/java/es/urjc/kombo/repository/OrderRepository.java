package es.urjc.kombo.repository;



import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;  
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import es.urjc.kombo.model.Order;
import es.urjc.kombo.model.User;
import es.urjc.kombo.model.Order.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, Long>  {
    Page<Order> findByUserOrderByCreatedAtDesc(User user, Pageable pageable );
    Optional<Order> findFirstByUserOrderByCreatedAtDesc(User user);

    List<Order> findByStatusOrderByCreatedAtAsc(OrderStatus status);



}
