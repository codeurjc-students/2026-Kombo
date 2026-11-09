package es.urjc.kombo.config;

import java.io.IOException;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

// Serves the React client (static files in classpath:/static, copied there by the Docker build).
// The client routes (/login, /profile...) only exist in the browser: when one of them is loaded directly
// or reloaded, there is no file with that name, so index.html is returned and React Router shows the page.
// Requests to /api and to missing files (with an extension) keep their 404.
@Configuration
public class SpaConfig implements WebMvcConfigurer {

    private static final String INDEX = "static/index.html";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        if (resourcePath.startsWith("api/") || resourcePath.contains(".")) {
                            return null;
                        }
                        Resource index = new ClassPathResource(INDEX);
                        return index.exists() ? index : null;
                    }
                });
    }
}
