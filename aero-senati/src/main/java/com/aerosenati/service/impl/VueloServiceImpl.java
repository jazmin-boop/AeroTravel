package com.aerosenati.service.impl;

import com.aerosenati.dto.VueloDTO;
import com.aerosenati.exception.ConflictException;
import com.aerosenati.exception.ResourceNotFoundException;
import com.aerosenati.model.Aerolinea;
import com.aerosenati.model.Vuelo;
import com.aerosenati.repository.AerolineaRepository;
import com.aerosenati.repository.VueloRepository;
import com.aerosenati.service.VueloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VueloServiceImpl implements VueloService {

    @Autowired
    private VueloRepository vueloRepository;

    @Autowired
    private AerolineaRepository aerolineaRepository;

    @Autowired
    private com.aerosenati.repository.DetallePasajeRepository detallePasajeRepository;

    @Override
    @Transactional
    public VueloDTO crearVuelo(VueloDTO dto) {
        if (vueloRepository.existsByNumeroVuelo(dto.getNumeroVuelo())) {
            throw new ConflictException("Ya existe un vuelo con el número: " + dto.getNumeroVuelo());
        }

        Aerolinea aerolinea = null;
        if (dto.getIdAerolinea() != null) {
            aerolinea = aerolineaRepository.findById(dto.getIdAerolinea())
                    .orElseThrow(() -> new ResourceNotFoundException("Aerolínea no encontrada con ID: " + dto.getIdAerolinea()));
        }

        Vuelo vuelo = Vuelo.builder()
                .numeroVuelo(dto.getNumeroVuelo())
                .origen(dto.getOrigen())
                .destino(dto.getDestino())
                .fechaSalida(dto.getFechaSalida())
                .fechaLlegada(dto.getFechaLlegada())
                .precioBase(dto.getPrecioBase())
                .capacidadAsientos(dto.getCapacidadAsientos())
                .asientosDisponibles(dto.getCapacidadAsientos()) // Por defecto todos disponibles al inicio
                .aerolinea(aerolinea)
                .estado(dto.getEstado() != null ? dto.getEstado() : "PROGRAMADO")
                .categoria(dto.getCategoria() != null ? dto.getCategoria() : "ECONOMICO")
                .tipoEscala(dto.getTipoEscala() != null ? dto.getTipoEscala() : "DIRECTO")
                .ciudadEscala(dto.getCiudadEscala())
                .equipajeInfo(dto.getEquipajeInfo() != null ? dto.getEquipajeInfo() : "Bolso de mano incluido (5 kg)")
                .moneda(dto.getMoneda() != null ? dto.getMoneda() : "PEN")
                .build();

        Vuelo guardado = vueloRepository.save(vuelo);
        return mapearADTO(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VueloDTO> listarVuelos(String origen, String destino) {
        List<Vuelo> vuelos;
        if ((origen != null && !origen.trim().isEmpty()) || (destino != null && !destino.trim().isEmpty())) {
            vuelos = vueloRepository.buscarPorOrigenYDestino(
                    (origen != null && !origen.trim().isEmpty()) ? origen.trim() : null,
                    (destino != null && !destino.trim().isEmpty()) ? destino.trim() : null
            );
        } else {
            vuelos = vueloRepository.findAll();
        }

        return vuelos.stream().map(this::mapearADTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VueloDTO obtenerPorId(Integer id) {
        Vuelo vuelo = vueloRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vuelo no encontrado con ID: " + id));
        return mapearADTO(vuelo);
    }

    @Override
    @Transactional
    public VueloDTO actualizarVuelo(Integer id, VueloDTO dto) {
        Vuelo vuelo = vueloRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vuelo no encontrado con ID: " + id));

        if (!vuelo.getNumeroVuelo().equalsIgnoreCase(dto.getNumeroVuelo())) {
            if (vueloRepository.existsByNumeroVuelo(dto.getNumeroVuelo())) {
                throw new ConflictException("Ya existe otro vuelo con el número: " + dto.getNumeroVuelo());
            }
        }

        if (dto.getIdAerolinea() != null) {
            Aerolinea aerolinea = aerolineaRepository.findById(dto.getIdAerolinea())
                    .orElseThrow(() -> new ResourceNotFoundException("Aerolínea no encontrada con ID: " + dto.getIdAerolinea()));
            vuelo.setAerolinea(aerolinea);
        }

        vuelo.setNumeroVuelo(dto.getNumeroVuelo());
        vuelo.setOrigen(dto.getOrigen());
        vuelo.setDestino(dto.getDestino());
        vuelo.setFechaSalida(dto.getFechaSalida());
        vuelo.setFechaLlegada(dto.getFechaLlegada());
        vuelo.setPrecioBase(dto.getPrecioBase());
        vuelo.setCapacidadAsientos(dto.getCapacidadAsientos());
        if (dto.getAsientosDisponibles() != null) {
            vuelo.setAsientosDisponibles(dto.getAsientosDisponibles());
        }
        if (dto.getEstado() != null) {
            vuelo.setEstado(dto.getEstado());
        }
        if (dto.getCategoria() != null) {
            vuelo.setCategoria(dto.getCategoria());
        }
        if (dto.getTipoEscala() != null) {
            vuelo.setTipoEscala(dto.getTipoEscala());
        }
        vuelo.setCiudadEscala(dto.getCiudadEscala());
        if (dto.getEquipajeInfo() != null) {
            vuelo.setEquipajeInfo(dto.getEquipajeInfo());
        }
        if (dto.getMoneda() != null) {
            vuelo.setMoneda(dto.getMoneda());
        }

        Vuelo actualizado = vueloRepository.save(vuelo);
        return mapearADTO(actualizado);
    }

    @Override
    @Transactional
    public void eliminarVuelo(Integer id) {
        Vuelo vuelo = vueloRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vuelo no encontrado con ID: " + id));
        vueloRepository.delete(vuelo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> obtenerAsientosOcupados(Integer id) {
        if (!vueloRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vuelo no encontrado con ID: " + id);
        }
        return detallePasajeRepository.findAsientosOcupadosPorVuelo(id);
    }

    private VueloDTO mapearADTO(Vuelo vuelo) {
        return VueloDTO.builder()
                .id(vuelo.getId())
                .numeroVuelo(vuelo.getNumeroVuelo())
                .origen(vuelo.getOrigen())
                .destino(vuelo.getDestino())
                .fechaSalida(vuelo.getFechaSalida())
                .fechaLlegada(vuelo.getFechaLlegada())
                .precioBase(vuelo.getPrecioBase())
                .capacidadAsientos(vuelo.getCapacidadAsientos())
                .asientosDisponibles(vuelo.getAsientosDisponibles())
                .idAerolinea(vuelo.getAerolinea() != null ? vuelo.getAerolinea().getId() : null)
                .nombreAerolinea(vuelo.getAerolinea() != null ? vuelo.getAerolinea().getNombre() : null)
                .estado(vuelo.getEstado())
                .categoria(vuelo.getCategoria() != null ? vuelo.getCategoria() : "ECONOMICO")
                .tipoEscala(vuelo.getTipoEscala() != null ? vuelo.getTipoEscala() : "DIRECTO")
                .ciudadEscala(vuelo.getCiudadEscala())
                .equipajeInfo(vuelo.getEquipajeInfo() != null ? vuelo.getEquipajeInfo() : "Bolso de mano incluido (5 kg)")
                .moneda(vuelo.getMoneda() != null ? vuelo.getMoneda() : "PEN")
                .build();
    }
}

