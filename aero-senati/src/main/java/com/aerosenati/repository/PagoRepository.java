package com.aerosenati.repository;

import com.aerosenati.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Integer> {
    Optional<Pago> findByIdReserva(Integer idReserva);
    Optional<Pago> findByCodigoTransaccion(String codigoTransaccion);
    List<Pago> findAllByOrderByFechaPagoDesc();
}

