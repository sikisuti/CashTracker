package com.cashtracker.config;

import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * The Angular app owns its own routes (/home, /transactions, ...), but in the packaged jar those
 * paths reach Spring as ordinary requests for static resources that do not exist on disk -- so a
 * direct navigation or an F5 would render a 404 instead of the SPA. Serving index.html for any
 * unmatched non-API path hands routing back to the Angular router.
 *
 * Registered as a resource resolver rather than a catch-all @Controller so that it only ever fires
 * after the real static files (JS/CSS bundles) and the @RestController mappings have had their
 * chance. Runs last among WebMvcConfigurers so its "/**" registration replaces the auto-configured
 * one; that means we must re-declare the default static locations ourselves, which is what
 * WebProperties supplies.
 */
@Configuration
@Order(Ordered.LOWEST_PRECEDENCE)
public class SpaFallbackConfig implements WebMvcConfigurer {

    private final String[] staticLocations;

    public SpaFallbackConfig(WebProperties webProperties) {
        this.staticLocations = webProperties.getResources().getStaticLocations();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations(staticLocations)
                .resourceChain(true)
                .addResolver(new SpaFallbackResolver());
    }

    private static final class SpaFallbackResolver extends PathResourceResolver {

        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource requested = super.getResource(resourcePath, location);
            if (requested != null) {
                return requested;
            }
            // /api/** must keep returning a real 404 to HTTP clients, and a missing bundle or asset
            // (anything with a file extension) is a build problem worth surfacing as a 404 too --
            // silently answering either with index.html only hides the failure.
            if (resourcePath.startsWith("api/") || resourcePath.contains(".")) {
                return null;
            }
            return super.getResource("index.html", location);
        }
    }
}
