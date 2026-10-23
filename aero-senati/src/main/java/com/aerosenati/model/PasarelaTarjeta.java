package com.aerosenati.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "pasarela_tarjetas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasarelaTarjeta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 30)
    private String marca;

    @Column(name = "banco_emisor", nullable = false, length = 50)
    private String bancoEmisor;

    @Column(name = "tipo_tarjeta", nullable = false, length = 30)
    private String tipoTarjeta;

    @Column(name = "numero_tarjeta", nullable = false, length = 25)
    private String numeroTarjeta;

    @Column(nullable = false, length = 100)
    private String titular;

    @Column(name = "fecha_expiracion", nullable = false, length = 10)
    private String fechaExpiracion;

    @Column(nullable = false, length = 5)
    private String cvv;

    @Column(name = "saldo_disponible", nullable = false, precision = 10, scale = 2)
    private BigDecimal saldoDisponible;

    @Column(length = 20)
    @Builder.Default
    private String estado = "ACTIVA";
}

