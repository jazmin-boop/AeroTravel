package com.aerosenati.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservaResponseDTO {
    private Integer id;
    private String codigoReserva;
    private LocalDateTime fechaEmision;
    private BigDecimal total;
    private String estadoPago;

    // Pasajero
    private Integer idPasajero;
    private String nombreCompletoPasajero;
    private String docIdentidad;
    private String email;

    // Vuelo
    private Integer idVuelo;
    private String numeroVuelo;
    private String aerolinea;
    private String origen;
    private String destino;
    private LocalDateTime fechaSalida;
    private LocalDateTime fechaLlegada;

    // Detalle
    private List<DetallePasajeDTO> detalles;
}

