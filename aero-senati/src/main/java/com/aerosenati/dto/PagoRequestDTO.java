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
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagoRequestDTO {

    @NotNull(message = "El ID de la reserva es obligatorio")
    private Integer idReserva;

    @NotBlank(message = "El método de pago es obligatorio")
    private String metodoPago; // TARJETA_CREDITO, TARJETA_DEBITO, YAPE, PAGOEFECTIVO

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser positivo")
    private BigDecimal monto;

    @NotBlank(message = "El titular del pago es obligatorio")
    private String titularPagador;

    private String numeroTarjeta;

    private String codigoAprobacion;
}

