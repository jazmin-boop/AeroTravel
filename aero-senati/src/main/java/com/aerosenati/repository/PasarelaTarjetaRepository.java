package com.aerosenati.repository;

import com.aerosenati.model.PasarelaTarjeta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasarelaTarjetaRepository extends JpaRepository<PasarelaTarjeta, Integer> {
    List<PasarelaTarjeta> findByEstado(String estado);
}

