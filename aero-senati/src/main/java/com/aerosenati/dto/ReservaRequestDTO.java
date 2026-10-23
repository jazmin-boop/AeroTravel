package com.aerosenati.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservaRequestDTO {
    @NotNull(message = "El ID del pasajero es obligatorio")
    private Integer idPasajero;

    @NotNull(message = "El ID del vuelo es obligatorio")
    private Integer idVuelo;

    @Builder.Default
    private String estadoPago = "PAGADO"; // PAGADO, RESERVADO

    @NotEmpty(message = "Debe incluir al menos un asiento/pasaje")
    @Valid
    private List<DetallePasajeDTO> detalles;
}

