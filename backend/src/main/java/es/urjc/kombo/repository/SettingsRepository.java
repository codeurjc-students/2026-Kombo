package es.urjc.kombo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import es.urjc.kombo.model.Settings;

public interface SettingsRepository extends JpaRepository<Settings, Long> {

    // There is only one row of settings
    Optional<Settings> findFirstByOrderByIdAsc();
}
