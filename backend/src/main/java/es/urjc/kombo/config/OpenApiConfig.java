package es.urjc.kombo.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import es.urjc.kombo.security.JwtService;

// Adds information for Swagger
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI komboOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Kombo REST API")
                .description("REST API for Kombo, a web application for fast food restaurant orders, cash register and inventory management. "
                        + "Log in with POST /api/v1/auth/login: the session JWT is sent back in the httpOnly cookie "
                        + JwtService.COOKIE_NAME + ", which the browser sends in the next requests.")
                .version("0.0.1"))
                .components(new Components().addSecuritySchemes("sessionCookie", new SecurityScheme()
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.COOKIE)
                        .name(JwtService.COOKIE_NAME)));
    }
}
