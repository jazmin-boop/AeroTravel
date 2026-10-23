package com.aerosenati.repository;

import com.aerosenati.model.Vuelo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VueloRepository extends JpaRepository<Vuelo, Integer> {
    Optional<Vuelo> findByNumeroVuelo(String numeroVuelo);
    Boolean existsByNumeroVuelo(String numeroVuelo);
    List<Vuelo> findByEstado(String estado);

    @Query("SELECT v FROM Vuelo v WHERE " +
           "(:origen IS NULL OR LOWER(v.origen) LIKE LOWER(CONCAT('%', :origen, '%'))) AND " +
           "(:destino IS NULL OR LOWER(v.destino) LIKE LOWER(CONCAT('%', :destino, '%')))")
    List<Vuelo> buscarPorOrigenYDestino(@Param("origen") String origen, @Param("destino") String destino);

    List<Vuelo> findByEstadoAndAsientosDisponiblesGreaterThan(String estado, Integer minAsientos);
}

