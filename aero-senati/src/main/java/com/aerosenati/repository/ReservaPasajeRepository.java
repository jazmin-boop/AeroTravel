package com.aerosenati.repository;

import com.aerosenati.model.ReservaPasaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservaPasajeRepository extends JpaRepository<ReservaPasaje, Integer> {
    Optional<ReservaPasaje> findByCodigoReserva(String codigoReserva);

    @Query("SELECT r FROM ReservaPasaje r LEFT JOIN FETCH r.detalles WHERE r.codigoReserva = :codigo")
    Optional<ReservaPasaje> findByCodigoReservaConDetalles(@Param("codigo") String codigo);

    List<ReservaPasaje> findByEstadoPago(String estadoPago);
}

