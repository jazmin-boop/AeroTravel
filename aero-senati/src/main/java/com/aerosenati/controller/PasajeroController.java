package com.aerosenati.controller;

import com.aerosenati.dto.PasajeroDTO;
import com.aerosenati.service.PasajeroService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pasajeros")
@Tag(name = "Pasajeros", description = "Gestión de clientes y pasajeros de la aerolínea")
@CrossOrigin(origins = "*")
@SecurityRequirement(name = "Bearer Authentication")
public class PasajeroController {

    @Autowired
    private PasajeroService pasajeroService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENTE')")
    @Operation(summary = "Registrar cliente / pasajero", description = "Crea un nuevo pasajero con documento de identidad único. Requiere ROLE_AGENTE o ROLE_ADMIN.")
    public ResponseEntity<PasajeroDTO> registrarPasajero(@Valid @RequestBody PasajeroDTO dto) {
        PasajeroDTO creado = pasajeroService.registrarPasajero(dto);
        return new ResponseEntity<>(creado, HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENTE')")
    @Operation(summary = "Listar pasajeros", description = "Obtiene la lista de todos los pasajeros registrados en el sistema.")
    public ResponseEntity<List<PasajeroDTO>> listarPasajeros() {
        List<PasajeroDTO> pasajeros = pasajeroService.listarPasajeros();
        return ResponseEntity.ok(pasajeros);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENTE')")
    @Operation(summary = "Obtener pasajero por ID", description = "Retorna los datos de un pasajero por su ID.")
    public ResponseEntity<PasajeroDTO> obtenerPorId(@PathVariable Integer id) {
        PasajeroDTO pasajero = pasajeroService.obtenerPorId(id);
        return ResponseEntity.ok(pasajero);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'AGENTE')")
    @Operation(summary = "Actualizar pasajero", description = "Modifica los datos del cliente/pasajero.")
    public ResponseEntity<PasajeroDTO> actualizarPasajero(@PathVariable Integer id, @Valid @RequestBody PasajeroDTO dto) {
        PasajeroDTO actualizado = pasajeroService.actualizarPasajero(id, dto);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar pasajero", description = "Elimina un pasajero del sistema. Requiere ROLE_ADMIN.")
    public ResponseEntity<Void> eliminarPasajero(@PathVariable Integer id) {
        pasajeroService.eliminarPasajero(id);
        return ResponseEntity.noContent().build();
    }
}

