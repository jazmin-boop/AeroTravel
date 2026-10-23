package com.aerosenati.controller;

import com.aerosenati.dto.PagoRequestDTO;
import com.aerosenati.model.Pago;
import com.aerosenati.model.PasarelaTarjeta;
import com.aerosenati.repository.PagoRepository;
import com.aerosenati.repository.PasarelaTarjetaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pasarela")
@Tag(name = "Pasarela de Pago", description = "Servicios y datos semilla de la Pasarela de Pago Comercial (LATAM Pay)")
@CrossOrigin(origins = "*")
public class PasarelaController {

    @Autowired
    private PasarelaTarjetaRepository tarjetaRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private com.aerosenati.repository.ReservaPasajeRepository reservaRepository;

    @GetMapping("/tarjetas")
    @Operation(summary = "Listar tarjetas de prueba autorizadas", description = "Obtiene las tarjetas semilla registradas en la base de datos MySQL para la simulación de compras.")
    public ResponseEntity<List<PasarelaTarjeta>> listarTarjetas() {
        List<PasarelaTarjeta> tarjetas = tarjetaRepository.findByEstado("ACTIVA");
        return ResponseEntity.ok(tarjetas);
    }

    @GetMapping("/pagos")
    @Operation(summary = "Listar transacciones de pago", description = "Retorna el historial de pagos registrados en la pasarela.")
    public ResponseEntity<List<Pago>> listarPagos() {
        List<Pago> pagos = pagoRepository.findAllByOrderByFechaPagoDesc();
        return ResponseEntity.ok(pagos);
    }

    @PostMapping("/procesar")
    @Transactional
    @Operation(summary = "Procesar y registrar pago en la pasarela", description = "Registra una transacción atómica de pago vinculada a la reserva.")
    public ResponseEntity<Pago> procesarPago(@Valid @RequestBody PagoRequestDTO dto) {
        // Regla: Una vez pagado ya no debe volver a pagar
        boolean yaTienePagoAprobado = pagoRepository.findAll().stream()
                .anyMatch(p -> p.getIdReserva().equals(dto.getIdReserva()) && "APROBADO".equalsIgnoreCase(p.getEstado()));
        if (yaTienePagoAprobado) {
            throw new com.aerosenati.exception.ConflictException("La reserva ya ha sido pagada previamente. No se permite realizar cobros duplicados.");
        }

        String codigoTxn = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        String enmascarado;
        if ("YAPE".equalsIgnoreCase(dto.getMetodoPago()) || "PLIN".equalsIgnoreCase(dto.getMetodoPago())) {
            enmascarado = "YAPE 999-***-777 (Cod: " + (dto.getCodigoAprobacion() != null ? dto.getCodigoAprobacion() : "849201") + ")";
        } else if ("PAGOEFECTIVO".equalsIgnoreCase(dto.getMetodoPago())) {
            enmascarado = "CIP: 4892-1045";
        } else if ("TRANSFERENCIA".equalsIgnoreCase(dto.getMetodoPago())) {
            enmascarado = "BCP CCI: 002-194-001234567890-12 (Op: " + (dto.getCodigoAprobacion() != null ? dto.getCodigoAprobacion() : "OP-78219") + ")";
        } else {
            String num = dto.getNumeroTarjeta() != null ? dto.getNumeroTarjeta().replace(" ", "") : "";
            String ultimos4 = num.length() >= 4 ? num.substring(num.length() - 4) : "0000";
            enmascarado = "•••• •••• •••• " + ultimos4;
        }

        Pago pago = Pago.builder()
                .idReserva(dto.getIdReserva())
                .metodoPago(dto.getMetodoPago())
                .pasarela("LATAM_PAY_PERU")
                .codigoTransaccion(codigoTxn)
                .monto(dto.getMonto())
                .moneda("PEN")
                .titularPagador(dto.getTitularPagador())
                .numeroEnmascarado(enmascarado)
                .fechaPago(LocalDateTime.now())
                .estado("APROBADO")
                .build();

        Pago guardado = pagoRepository.save(pago);

        // Actualizar el estado de la reserva a PAGADO en el sistema
        reservaRepository.findById(dto.getIdReserva()).ifPresent(reserva -> {
            reserva.setEstadoPago("PAGADO");
            reservaRepository.save(reserva);
        });

        return new ResponseEntity<>(guardado, HttpStatus.CREATED);
    }
}

