package es.urjc.kombo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import es.urjc.kombo.model.Image;

public interface ImageRepository extends JpaRepository<Image, Long> {
    
}
