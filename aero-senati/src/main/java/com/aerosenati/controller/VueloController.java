package com.aerosenati.controller;

import com.aerosenati.dto.VueloDTO;
import com.aerosenati.service.VueloService;
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
@RequestMapping("/api/v1/vuelos")
@Tag(name = "Vuelos", description = "Gestión del catálogo de vuelos comerciales y programación de itinerarios")
@CrossOrigin(origins = "*")
public class VueloController {

    @Autowired
    private VueloService vueloService;

    @GetMapping
    @Operation(summary = "Listar vuelos", description = "Obtiene la lista de vuelos programados con filtros opcionales de origen y destino. Acceso público.")
    public ResponseEntity<List<VueloDTO>> listarVuelos(
            @RequestParam(required = false) String origen,
            @RequestParam(required = false) String destino) {
        List<VueloDTO> vuelos = vueloService.listarVuelos(origen, destino);
        return ResponseEntity.ok(vuelos);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener vuelo por ID", description = "Retorna la información detallada de un vuelo según su ID.")
    public ResponseEntity<VueloDTO> obtenerPorId(@PathVariable Integer id) {
        VueloDTO vuelo = vueloService.obtenerPorId(id);
        return ResponseEntity.ok(vuelo);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Crear/Programar nuevo vuelo", description = "Registra un nuevo vuelo en el sistema. Requiere rol ROLE_ADMIN.")
    public ResponseEntity<VueloDTO> crearVuelo(@Valid @RequestBody VueloDTO dto) {
        VueloDTO creado = vueloService.crearVuelo(dto);
        return new ResponseEntity<>(creado, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Actualizar/Editar vuelo", description = "Modifica los itinerarios, precios y estado del vuelo. Requiere ROLE_ADMIN.")
    public ResponseEntity<VueloDTO> actualizarVuelo(@PathVariable Integer id, @Valid @RequestBody VueloDTO dto) {
        VueloDTO actualizado = vueloService.actualizarVuelo(id, dto);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Eliminar vuelo", description = "Elimina un vuelo del sistema. Requiere ROLE_ADMIN.")
    public ResponseEntity<Void> eliminarVuelo(@PathVariable Integer id) {
        vueloService.eliminarVuelo(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/asientos-ocupados")
    @Operation(summary = "Consultar asientos ocupados del vuelo", description = "Retorna los números de asiento ya reservados para sincronizar la cabina en tiempo real.")
    public ResponseEntity<List<String>> obtenerAsientosOcupados(@PathVariable Integer id) {
        List<String> ocupados = vueloService.obtenerAsientosOcupados(id);
        return ResponseEntity.ok(ocupados);
    }
}

