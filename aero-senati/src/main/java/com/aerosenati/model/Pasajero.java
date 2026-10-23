package com.aerosenati.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pasajeros")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pasajero {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(name = "doc_identidad", unique = true, nullable = false, length = 20)
    private String docIdentidad;

    @Column(length = 50)
    private String nacionalidad;

    @Column(length = 20)
    private String telefono;

    @Column(nullable = false, length = 100)
    private String email;
}
