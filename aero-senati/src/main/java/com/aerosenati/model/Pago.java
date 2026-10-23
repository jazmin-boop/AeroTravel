package com.aerosenati.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "id_reserva", nullable = false)
    private Integer idReserva;

    @Column(name = "metodo_pago", nullable = false, length = 50)
    private String metodoPago;

    @Column(length = 50)
    @Builder.Default
    private String pasarela = "LATAM_PAY_PERU";

    @Column(name = "codigo_transaccion", nullable = false, unique = true, length = 50)
    private String codigoTransaccion;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(length = 10)
    @Builder.Default
    private String moneda = "PEN";

    @Column(name = "titular_pagador", nullable = false, length = 100)
    private String titularPagador;

    @Column(name = "numero_enmascarado", nullable = false, length = 30)
    private String numeroEnmascarado;

    @Column(name = "fecha_pago")
    @Builder.Default
    private LocalDateTime fechaPago = LocalDateTime.now();

    @Column(length = 20)
    @Builder.Default
    private String estado = "APROBADO";
}

