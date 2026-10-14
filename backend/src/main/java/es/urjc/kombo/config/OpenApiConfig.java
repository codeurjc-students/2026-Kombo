package es.urjc.kombo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Adds information for Swagger
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI komboOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Kombo REST API")
                .description("REST API for Kombo, a web application for fast food restaurant orders, cash register and inventory management.")
                .version("0.0.1"));
    }
}