package com.aerosenati.controller;

import com.aerosenati.dto.ReservaRequestDTO;
import com.aerosenati.dto.ReservaResponseDTO;
import com.aerosenati.service.ReservaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reservas")
@Tag(name = "Reservas y Boletos", description = "Operaciones transaccionales de venta, consulta y cancelación de pasajes aéreos")
@CrossOrigin(origins = "*")
@SecurityRequirement(name = "Bearer Authentication")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENTE')")
    @Operation(summary = "Registrar reserva con pasajes (Transaccional)",
               description = "Valida capacidad de asientos, descuenta stock del vuelo automáticamente, genera PNR único y emite boletos. Requiere ROLE_AGENTE o ROLE_ADMIN.")
    public ResponseEntity<ReservaResponseDTO> crearReserva(@Valid @RequestBody ReservaRequestDTO dto) {
        ReservaResponseDTO reserva = reservaService.registrarReserva(dto);
        return new ResponseEntity<>(reserva, HttpStatus.CREATED);
    }

    @GetMapping("/{codigo}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENTE')")
    @Operation(summary = "Obtener reserva por código PNR",
               description = "Retorna la reserva completa incluyendo los detalles de boletos y asientos emitidos. Requiere ROLE_AGENTE o ROLE_ADMIN.")
    public ResponseEntity<ReservaResponseDTO> obtenerPorCodigo(@PathVariable String codigo) {
        ReservaResponseDTO reserva = reservaService.obtenerPorCodigo(codigo);
        return ResponseEntity.ok(reserva);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENTE')")
    @Operation(summary = "Listar todas las reservas",
               description = "Retorna el historial completo de reservas y ventas de pasajes.")
    public ResponseEntity<List<ReservaResponseDTO>> listarTodas() {
        List<ReservaResponseDTO> lista = reservaService.listarTodas();
        return ResponseEntity.ok(lista);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cancelar reserva y reponer asientos",
               description = "Anula la reserva y repone de inmediato los asientos al vuelo correspondiente. Requiere ROLE_ADMIN.")
    public ResponseEntity<Map<String, Object>> cancelarReserva(@PathVariable Integer id) {
        reservaService.cancelarReserva(id);
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Reserva ID " + id + " cancelada exitosamente. Asientos repuestos al vuelo.");
        response.put("status", HttpStatus.OK.value());
        return ResponseEntity.ok(response);
    }
}

