package com.aerosenati.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VueloDTO {
    private Integer id;

    @NotBlank(message = "El número de vuelo es obligatorio")
    private String numeroVuelo;

    @NotBlank(message = "El origen es obligatorio")
    private String origen;

    @NotBlank(message = "El destino es obligatorio")
    private String destino;

    @NotNull(message = "La fecha de salida es obligatoria")
    private LocalDateTime fechaSalida;

    @NotNull(message = "La fecha de llegada es obligatoria")
    private LocalDateTime fechaLlegada;

    @NotNull(message = "El precio base es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El precio base no puede ser negativo")
    private BigDecimal precioBase;

    @NotNull(message = "La capacidad de asientos es obligatoria")
    @Min(value = 1, message = "La capacidad de asientos debe ser de al menos 1")
    private Integer capacidadAsientos;

    private Integer asientosDisponibles;

    private Integer idAerolinea;

    private String nombreAerolinea;

    private String estado;

    private String categoria;

    private String tipoEscala;

    private String ciudadEscala;

    private String equipajeInfo;

    private String moneda;
}

