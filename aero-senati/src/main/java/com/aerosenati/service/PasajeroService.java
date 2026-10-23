package com.aerosenati.service;

import com.aerosenati.dto.PasajeroDTO;
import java.util.List;

public interface PasajeroService {
    PasajeroDTO registrarPasajero(PasajeroDTO dto);
    List<PasajeroDTO> listarPasajeros();
    PasajeroDTO obtenerPorId(Integer id);
    PasajeroDTO obtenerPorDocIdentidad(String docIdentidad);
    PasajeroDTO actualizarPasajero(Integer id, PasajeroDTO dto);
    void eliminarPasajero(Integer id);
}

