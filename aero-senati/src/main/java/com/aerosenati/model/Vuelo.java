package com.aerosenati.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vuelos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vuelo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "numero_vuelo", nullable = false, unique = true, length = 20)
    private String numeroVuelo;

    @Column(nullable = false, length = 100)
    private String origen;

    @Column(nullable = false, length = 100)
    private String destino;

    @Column(name = "fecha_salida", nullable = false)
    private LocalDateTime fechaSalida;

    @Column(name = "fecha_llegada", nullable = false)
    private LocalDateTime fechaLlegada;

    @Column(name = "precio_base", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioBase;

    @Column(name = "capacidad_asientos", nullable = false)
    private Integer capacidadAsientos;

    @Column(name = "asientos_disponibles", nullable = false)
    private Integer asientosDisponibles;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_aerolinea")
    private Aerolinea aerolinea;

    @Column(length = 20)
    @Builder.Default
    private String estado = "PROGRAMADO"; // PROGRAMADO, EN_VUELO, CANCELADO

    @Column(length = 30)
    @Builder.Default
    private String categoria = "ECONOMICO"; // ECONOMICO, EJECUTIVO, PRIMERA_CLASE

    @Column(name = "tipo_escala", length = 30)
    @Builder.Default
    private String tipoEscala = "DIRECTO"; // DIRECTO, CON_ESCALA

    @Column(name = "ciudad_escala", length = 100)
    private String ciudadEscala; // e.g. "Trujillo (TRU)"

    @Column(name = "equipaje_info", length = 255)
    @Builder.Default
    private String equipajeInfo = "Bolso de mano incluido (5 kg)";

    @Column(length = 10)
    @Builder.Default
    private String moneda = "PEN"; // PEN, USD
}
