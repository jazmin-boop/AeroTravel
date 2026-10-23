package com.aerosenati.service.impl;

import com.aerosenati.dto.LoginRequestDTO;
import com.aerosenati.dto.LoginResponseDTO;
import com.aerosenati.model.Usuario;
import com.aerosenati.repository.UsuarioRepository;
import com.aerosenati.security.JwtTokenProvider;
import com.aerosenati.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public LoginResponseDTO login(LoginRequestDTO request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generarToken(authentication);

        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + request.getUsername()));

        return LoginResponseDTO.builder()
                .token(jwt)
                .tipo("Bearer")
                .username(usuario.getUsername())
                .rol(usuario.getRol())
                .mensaje("Autenticación exitosa")
                .build();
    }
}

