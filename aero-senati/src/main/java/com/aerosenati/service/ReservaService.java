package com.aerosenati.service;

import com.aerosenati.dto.ReservaRequestDTO;
import com.aerosenati.dto.ReservaResponseDTO;
import java.util.List;

public interface ReservaService {
    ReservaResponseDTO registrarReserva(ReservaRequestDTO dto);
    ReservaResponseDTO obtenerPorCodigo(String codigoReserva);
    List<ReservaResponseDTO> listarTodas();
    void cancelarReserva(Integer id);
}

