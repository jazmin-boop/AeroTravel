package com.aerosenati.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetallePasajeDTO {
    private Integer id;

    @NotBlank(message = "El número de asiento es obligatorio (ej. 12A)")
    private String numeroAsiento;

    @Builder.Default
    private String clase = "ECONOMICA"; // ECONOMICA, EXECUTIVA, FIRST_CLASS

    @NotNull(message = "El precio unitario es obligatorio")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio unitario debe ser mayor a 0")
    private BigDecimal precioUnitario;
}

