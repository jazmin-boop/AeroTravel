package com.aerosenati.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Frontend Estático & Swagger UI & H2/Docs
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/favicon.ico",
                                "/css/**",
                                "/js/**",
                                "/img/**",
                                "/images/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Endpoints Públicos
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/vuelos/**").permitAll()
                        .requestMatchers("/api/v1/pasarela/**").permitAll()

                        // Endpoints con Roles Específicos
                        // Vuelos: Crear, Editar o Eliminar vuelo -> ROLE_ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/v1/vuelos").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/vuelos/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/vuelos/**").hasRole("ADMIN")

                        // Pasajeros: Registrar, Consultar o Editar -> ROLE_AGENTE o ROLE_ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/v1/pasajeros/**").hasAnyRole("ADMIN", "AGENTE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/pasajeros/**").hasAnyRole("ADMIN", "AGENTE")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/pasajeros/**").hasAnyRole("ADMIN", "AGENTE")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/pasajeros/**").hasRole("ADMIN")

                        // Reservas: Registrar o Consultar -> ROLE_AGENTE o ROLE_ADMIN
                        .requestMatchers(HttpMethod.POST, "/api/v1/reservas/**").hasAnyRole("ADMIN", "AGENTE")
                        .requestMatchers(HttpMethod.GET, "/api/v1/reservas/**").hasAnyRole("ADMIN", "AGENTE")

                        // Reservas: Cancelar reserva y reponer asientos -> ROLE_ADMIN
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/reservas/**").hasRole("ADMIN")

                        // Cualquier otra petición requiere autenticación
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

