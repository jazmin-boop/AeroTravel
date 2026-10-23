package com.aerosenati.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "detalle_pasajes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DetallePasaje {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_reserva", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ReservaPasaje reserva;

    @Column(name = "numero_asiento", nullable = false, length = 10)
    private String numeroAsiento;

    @Column(length = 30)
    @Builder.Default
    private String clase = "ECONOMICA"; // ECONOMICA, EXECUTIVA, FIRST_CLASS

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;
}
