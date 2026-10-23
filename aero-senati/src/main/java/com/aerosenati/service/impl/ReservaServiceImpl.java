package com.aerosenati.service.impl;

import com.aerosenati.dto.DetallePasajeDTO;
import com.aerosenati.dto.ReservaRequestDTO;
import com.aerosenati.dto.ReservaResponseDTO;
import com.aerosenati.exception.ConflictException;
import com.aerosenati.exception.ResourceNotFoundException;
import com.aerosenati.model.DetallePasaje;
import com.aerosenati.model.Pasajero;
import com.aerosenati.model.ReservaPasaje;
import com.aerosenati.model.Vuelo;
import com.aerosenati.repository.DetallePasajeRepository;
import com.aerosenati.repository.PasajeroRepository;
import com.aerosenati.repository.ReservaPasajeRepository;
import com.aerosenati.repository.VueloRepository;
import com.aerosenati.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReservaServiceImpl implements ReservaService {

    @Autowired
    private ReservaPasajeRepository reservaRepository;

    @Autowired
    private DetallePasajeRepository detalleRepository;

    @Autowired
    private PasajeroRepository pasajeroRepository;

    @Autowired
    private VueloRepository vueloRepository;

    @Override
    @Transactional
    public ReservaResponseDTO registrarReserva(ReservaRequestDTO dto) {
        // 1. Validar existencia del Pasajero
        Pasajero pasajero = pasajeroRepository.findById(dto.getIdPasajero())
                .orElseThrow(() -> new ResourceNotFoundException("Pasajero no encontrado con ID: " + dto.getIdPasajero()));

        // 2. Validar existencia del Vuelo
        Vuelo vuelo = vueloRepository.findById(dto.getIdVuelo())
                .orElseThrow(() -> new ResourceNotFoundException("Vuelo no encontrado con ID: " + dto.getIdVuelo()));

        // 3. Regla de Negocio: Control de Capacidad y Asientos
        int asientosSolicitados = dto.getDetalles().size();
        if (vuelo.getAsientosDisponibles() < asientosSolicitados) {
            throw new ConflictException(String.format(
                    "Capacidad insuficiente. Asientos disponibles: %d, Asientos solicitados: %d",
                    vuelo.getAsientosDisponibles(), asientosSolicitados
            ));
        }

        // 3.1 Regla de Negocio: Evitar colisión de asientos ya reservados por otros clientes
        List<String> asientosOcupados = detalleRepository.findAsientosOcupadosPorVuelo(vuelo.getId());
        for (DetallePasajeDTO det : dto.getDetalles()) {
            String seat = det.getNumeroAsiento() != null ? det.getNumeroAsiento().toUpperCase().trim() : "";
            if (asientosOcupados.contains(seat)) {
                throw new ConflictException("El asiento " + seat + " ya se encuentra reservado y no está disponible.");
            }
        }

        // 4. Regla de Negocio: Actualización Automática del stock de asientos
        vuelo.setAsientosDisponibles(vuelo.getAsientosDisponibles() - asientosSolicitados);
        vueloRepository.save(vuelo);

        // 5. Regla de Negocio: Autogeneración de Código PNR único (PNR-XXXXXX)
        String pnr;
        do {
            pnr = "PNR-" + UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        } while (reservaRepository.findByCodigoReserva(pnr).isPresent());

        // 6. Cálculo del Total de la Reserva
        BigDecimal total = dto.getDetalles().stream()
                .map(DetallePasajeDTO::getPrecioUnitario)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 7. Crear la entidad principal ReservaPasaje
        ReservaPasaje reserva = ReservaPasaje.builder()
                .codigoReserva(pnr)
                .fechaEmision(LocalDateTime.now())
                .total(total)
                .estadoPago(dto.getEstadoPago() != null ? dto.getEstadoPago() : "PAGADO")
                .pasajero(pasajero)
                .vuelo(vuelo)
                .build();

        // 8. Crear los boletos individuales (DetallePasaje)
        List<DetallePasaje> detalles = new ArrayList<>();
        for (DetallePasajeDTO detalleDTO : dto.getDetalles()) {
            DetallePasaje detalle = DetallePasaje.builder()
                    .reserva(reserva)
                    .numeroAsiento(detalleDTO.getNumeroAsiento())
                    .clase(detalleDTO.getClase() != null ? detalleDTO.getClase() : "ECONOMICA")
                    .precioUnitario(detalleDTO.getPrecioUnitario())
                    .build();
            detalles.add(detalle);
        }
        reserva.setDetalles(detalles);

        // Guardar reserva (con cascade guarda detalles)
        ReservaPasaje guardada = reservaRepository.save(reserva);

        return mapearAResponseDTO(guardada);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservaResponseDTO obtenerPorCodigo(String codigoReserva) {
        ReservaPasaje reserva = reservaRepository.findByCodigoReservaConDetalles(codigoReserva)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con código PNR: " + codigoReserva));
        return mapearAResponseDTO(reserva);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservaResponseDTO> listarTodas() {
        return reservaRepository.findAll().stream()
                .map(this::mapearAResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelarReserva(Integer id) {
        // 1. Buscar la reserva
        ReservaPasaje reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con ID: " + id));

        // 2. Verificar que no esté ya anulada
        if ("ANULADO".equalsIgnoreCase(reserva.getEstadoPago())) {
            throw new ConflictException("La reserva ya se encuentra anulada previamente.");
        }

        // 3. Obtener cantidad de asientos a reponer
        List<DetallePasaje> detalles = detalleRepository.findByReservaId(id);
        int asientosAReponer = detalles.size();

        // 4. Reponer stock de asientos al vuelo
        Vuelo vuelo = reserva.getVuelo();
        if (vuelo != null) {
            vuelo.setAsientosDisponibles(vuelo.getAsientosDisponibles() + asientosAReponer);
            vueloRepository.save(vuelo);
        }

        // 5. Marcar reserva como ANULADO
        reserva.setEstadoPago("ANULADO");
        reservaRepository.save(reserva);
    }

    private ReservaResponseDTO mapearAResponseDTO(ReservaPasaje r) {
        List<DetallePasajeDTO> detallesDTO = new ArrayList<>();
        if (r.getDetalles() != null) {
            detallesDTO = r.getDetalles().stream()
                    .map(d -> DetallePasajeDTO.builder()
                            .id(d.getId())
                            .numeroAsiento(d.getNumeroAsiento())
                            .clase(d.getClase())
                            .precioUnitario(d.getPrecioUnitario())
                            .build())
                    .collect(Collectors.toList());
        }

        Pasajero p = r.getPasajero();
        Vuelo v = r.getVuelo();

        return ReservaResponseDTO.builder()
                .id(r.getId())
                .codigoReserva(r.getCodigoReserva())
                .fechaEmision(r.getFechaEmision())
                .total(r.getTotal())
                .estadoPago(r.getEstadoPago())
                // Pasajero
                .idPasajero(p != null ? p.getId() : null)
                .nombreCompletoPasajero(p != null ? (p.getNombres() + " " + p.getApellidos()) : null)
                .docIdentidad(p != null ? p.getDocIdentidad() : null)
                .email(p != null ? p.getEmail() : null)
                // Vuelo
                .idVuelo(v != null ? v.getId() : null)
                .numeroVuelo(v != null ? v.getNumeroVuelo() : null)
                .aerolinea(v != null && v.getAerolinea() != null ? v.getAerolinea().getNombre() : null)
                .origen(v != null ? v.getOrigen() : null)
                .destino(v != null ? v.getDestino() : null)
                .fechaSalida(v != null ? v.getFechaSalida() : null)
                .fechaLlegada(v != null ? v.getFechaLlegada() : null)
                .detalles(detallesDTO)
                .build();
    }
}

