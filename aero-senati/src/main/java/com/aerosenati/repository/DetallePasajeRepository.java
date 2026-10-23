package com.aerosenati.repository;

import com.aerosenati.model.DetallePasaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DetallePasajeRepository extends JpaRepository<DetallePasaje, Integer> {
    List<DetallePasaje> findByReservaId(Integer idReserva);

    @Query("SELECT d.numeroAsiento FROM DetallePasaje d WHERE d.reserva.vuelo.id = :vueloId AND d.reserva.estadoPago <> 'ANULADO'")
    List<String> findAsientosOcupadosPorVuelo(@Param("vueloId") Integer vueloId);
}

