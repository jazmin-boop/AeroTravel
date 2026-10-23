package com.aerosenati.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "Bearer Authentication";

        return new OpenAPI()
                .info(new Info()
                        .title("AERO-SENATI — API REST de Venta de Pasajes Aéreos")
                        .version("1.0.0")
                        .description("Evaluación Final Integral: Servicios Web (PDSD643) - Semestre VI.\n" +
                                     "Backend robusto en Spring Boot con autenticación JWT, arquitectura multicapa, " +
                                     "gestión transaccional de reservas y control de inventario de asientos.")
                        .contact(new Contact()
                                .name("Jazmin Chamorro Arone (ID: 001557367)")
                                .email("001557367@senati.pe"))
                        .license(new License().name("Apache 2.0").url("http://springdoc.org")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}

