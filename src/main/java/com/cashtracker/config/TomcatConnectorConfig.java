package com.cashtracker.config;

import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Some Windows environments (VPN/EDR software intercepting AF_UNIX loopback sockets) make
 * Tomcat's default NIO connector fail to open its wakeup Selector. NIO2 uses
 * AsynchronousServerSocketChannel (IOCP-backed on Windows) instead, sidestepping that codepath.
 */
@Configuration
public class TomcatConnectorConfig {

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> nio2ConnectorCustomizer() {
        return factory -> factory.setProtocol("org.apache.coyote.http11.Http11Nio2Protocol");
    }
}
