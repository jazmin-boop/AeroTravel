package com.aerosenati.service.impl;

import com.aerosenati.dto.PasajeroDTO;
import com.aerosenati.exception.ConflictException;
import com.aerosenati.exception.ResourceNotFoundException;
import com.aerosenati.model.Pasajero;
import com.aerosenati.repository.PasajeroRepository;
import com.aerosenati.service.PasajeroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PasajeroServiceImpl implements PasajeroService {

    @Autowired
    private PasajeroRepository pasajeroRepository;

    @Override
    @Transactional
    public PasajeroDTO registrarPasajero(PasajeroDTO dto) {
        if (pasajeroRepository.existsByDocIdentidad(dto.getDocIdentidad())) {
            throw new ConflictException("Ya existe un pasajero registrado con el documento: " + dto.getDocIdentidad());
        }

        Pasajero pasajero = Pasajero.builder()
                .nombres(dto.getNombres())
                .apellidos(dto.getApellidos())
                .docIdentidad(dto.getDocIdentidad())
                .nacionalidad(dto.getNacionalidad())
                .telefono(dto.getTelefono())
                .email(dto.getEmail())
                .build();

        Pasajero guardado = pasajeroRepository.save(pasajero);
        return mapearADTO(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PasajeroDTO> listarPasajeros() {
        return pasajeroRepository.findAll().stream()
                .map(this::mapearADTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PasajeroDTO obtenerPorId(Integer id) {
        Pasajero pasajero = pasajeroRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pasajero no encontrado con ID: " + id));
        return mapearADTO(pasajero);
    }

    @Override
    @Transactional(readOnly = true)
    public PasajeroDTO obtenerPorDocIdentidad(String docIdentidad) {
        Pasajero pasajero = pasajeroRepository.findByDocIdentidad(docIdentidad)
                .orElseThrow(() -> new ResourceNotFoundException("Pasajero no encontrado con Documento: " + docIdentidad));
        return mapearADTO(pasajero);
    }

    @Override
    @Transactional
    public PasajeroDTO actualizarPasajero(Integer id, PasajeroDTO dto) {
        Pasajero pasajero = pasajeroRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pasajero no encontrado con ID: " + id));

        // Si cambia el documento, validar que no colisione con otro
        if (!pasajero.getDocIdentidad().equalsIgnoreCase(dto.getDocIdentidad())) {
            if (pasajeroRepository.existsByDocIdentidad(dto.getDocIdentidad())) {
                throw new ConflictException("Ya existe otro pasajero con el documento: " + dto.getDocIdentidad());
            }
        }

        pasajero.setNombres(dto.getNombres());
        pasajero.setApellidos(dto.getApellidos());
        pasajero.setDocIdentidad(dto.getDocIdentidad());
        pasajero.setNacionalidad(dto.getNacionalidad());
        pasajero.setTelefono(dto.getTelefono());
        pasajero.setEmail(dto.getEmail());

        Pasajero actualizado = pasajeroRepository.save(pasajero);
        return mapearADTO(actualizado);
    }

    @Override
    @Transactional
    public void eliminarPasajero(Integer id) {
        Pasajero pasajero = pasajeroRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pasajero no encontrado con ID: " + id));
        pasajeroRepository.delete(pasajero);
    }

    private PasajeroDTO mapearADTO(Pasajero p) {
        return PasajeroDTO.builder()
                .id(p.getId())
                .nombres(p.getNombres())
                .apellidos(p.getApellidos())
                .docIdentidad(p.getDocIdentidad())
                .nacionalidad(p.getNacionalidad())
                .telefono(p.getTelefono())
                .email(p.getEmail())
                .build();
    }
}

