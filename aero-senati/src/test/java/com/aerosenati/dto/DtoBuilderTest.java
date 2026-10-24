package com.aerosenati.dto;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DtoBuilderTest {

    @Test
    void errorResponseBuilderCreatesResponseAndDefaultTimestamp() {
        ErrorResponseDTO response = ErrorResponseDTO.builder()
                .status(404)
                .error("Not Found")
                .mensaje("Pasajero no encontrado")
                .detalles(List.of("id: 1"))
                .build();

        assertThat(response.getStatus()).isEqualTo(404);
        assertThat(response.getError()).isEqualTo("Not Found");
        assertThat(response.getMensaje()).isEqualTo("Pasajero no encontrado");
        assertThat(response.getDetalles()).containsExactly("id: 1");
        assertThat(response.getTimestamp()).isInstanceOf(LocalDateTime.class);
    }

    @Test
    void pasajeroBuilderCreatesDto() {
        PasajeroDTO pasajero = PasajeroDTO.builder()
                .id(7)
                .nombres("Ana")
                .apellidos("Pérez")
                .docIdentidad("DNI-123")
                .nacionalidad("Peruana")
                .telefono("999999999")
                .email("ana@example.com")
                .build();

        assertThat(pasajero.getId()).isEqualTo(7);
        assertThat(pasajero.getNombres()).isEqualTo("Ana");
        assertThat(pasajero.getApellidos()).isEqualTo("Pérez");
        assertThat(pasajero.getDocIdentidad()).isEqualTo("DNI-123");
        assertThat(pasajero.getNacionalidad()).isEqualTo("Peruana");
        assertThat(pasajero.getTelefono()).isEqualTo("999999999");
        assertThat(pasajero.getEmail()).isEqualTo("ana@example.com");
    }
}
