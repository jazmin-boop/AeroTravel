package com.aerosenati.repository;

import com.aerosenati.model.Pasajero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PasajeroRepository extends JpaRepository<Pasajero, Integer> {
    Optional<Pasajero> findByDocIdentidad(String docIdentidad);
    Boolean existsByDocIdentidad(String docIdentidad);
}

