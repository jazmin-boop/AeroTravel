package com.aerosenati.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "aerolineas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aerolinea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "codigo_iata", unique = true, nullable = false, length = 10)
    private String codigoIata;

    @Column(name = "pais_origen", length = 50)
    private String paisOrigen;
}
