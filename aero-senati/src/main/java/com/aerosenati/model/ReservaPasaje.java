package com.aerosenati.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "reservas_pasajes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservaPasaje {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "codigo_reserva", nullable = false, unique = true, length = 10)
    private String codigoReserva;

    @Column(name = "fecha_emision", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    @Builder.Default
    private LocalDateTime fechaEmision = LocalDateTime.now();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "estado_pago", length = 20)
    @Builder.Default
    private String estadoPago = "PAGADO"; // PAGADO, RESERVADO, ANULADO

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_pasajero", nullable = false)
    private Pasajero pasajero;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_vuelo", nullable = false)
    private Vuelo vuelo;

    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DetallePasaje> detalles;
}
