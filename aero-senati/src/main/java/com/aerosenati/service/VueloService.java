package com.aerosenati.service;

import com.aerosenati.dto.VueloDTO;
import java.util.List;

public interface VueloService {
    VueloDTO crearVuelo(VueloDTO dto);
    List<VueloDTO> listarVuelos(String origen, String destino);
    VueloDTO obtenerPorId(Integer id);
    VueloDTO actualizarVuelo(Integer id, VueloDTO dto);
    void eliminarVuelo(Integer id);
    List<String> obtenerAsientosOcupados(Integer id);
}

