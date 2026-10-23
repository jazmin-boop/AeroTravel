package com.aerosenati.service;

import com.aerosenati.dto.LoginRequestDTO;
import com.aerosenati.dto.LoginResponseDTO;

public interface AuthService {
    LoginResponseDTO login(LoginRequestDTO request);
}

