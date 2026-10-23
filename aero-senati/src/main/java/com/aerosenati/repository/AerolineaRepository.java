package com.aerosenati.repository;

import com.aerosenati.model.Aerolinea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AerolineaRepository extends JpaRepository<Aerolinea, Integer> {
    Optional<Aerolinea> findByCodigoIata(String codigoIata);
}

