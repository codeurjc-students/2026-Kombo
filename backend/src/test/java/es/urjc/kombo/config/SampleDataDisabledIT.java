package es.urjc.kombo.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;

import es.urjc.kombo.TestcontainersConfiguration;
import es.urjc.kombo.repository.UserRepository;

// With kombo.sample-data.enabled=false the loader is not created and the database is not modified
@SpringBootTest(properties = "kombo.sample-data.enabled=false")
@Import(TestcontainersConfiguration.class)
class SampleDataDisabledIT {

    @Autowired
    private ApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Test
    void sampleDataIsNotLoaded() {
        assertThat(context.getBeansOfType(SampleDataLoader.class)).isEmpty();
        assertThat(userRepository.count()).isZero();
    }
}
