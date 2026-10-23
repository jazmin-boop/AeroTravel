-- ============================================================
-- AERO-SENATI: Datos iniciales para Spring Boot
-- ============================================================

INSERT IGNORE INTO usuarios (id, username, password, rol, estado) VALUES
(1, 'admin', '$2a$10$5chA02lOmxuFOQrotTjWwOM8Zb/CzNDiIDrMaE5ppvbzXfQYJpK62', 'ROLE_ADMIN', TRUE),
(2, 'agente1', '$2a$10$7A7Q4fffHQwwM5/9hq5die2t3d5F/0bYLfoPfoiMusPaeiFNQ39wi', 'ROLE_AGENTE', TRUE);

INSERT IGNORE INTO aerolineas (id, nombre, codigo_iata, pais_origen) VALUES
(1, 'LATAM Airlines', 'LA', 'Perú'),
(2, 'Avianca', 'AV', 'Colombia'),
(3, 'Sky Airline', 'H2', 'Chile'),
(4, 'JetSMART', 'JA', 'Chile');

INSERT IGNORE INTO pasajeros (id, nombres, apellidos, doc_identidad, nacionalidad, telefono, email) VALUES
(1, 'Carlos Alberto', 'Ramírez Torres', '72345678', 'Peruana', '987654321', 'carlos.ramirez@gmail.com'),
(2, 'María Elena', 'Gutiérrez López', '45678912', 'Peruana', '912345678', 'maria.gutierrez@gmail.com'),
(3, 'Jazmin', 'Chamorro Arone', '001557367', 'Peruana', '999888777', 'jazmin.chamorro@senati.pe'),
(4, 'Alejandro', 'Vargas Mendoza', '41238956', 'Peruana', '945671234', 'a.vargas@outlook.com'),
(5, 'Valeria', 'Paredes Silva', '70984512', 'Peruana', '978123456', 'valeria.paredes@yahoo.com');

INSERT IGNORE INTO vuelos (id, numero_vuelo, origen, destino, fecha_salida, fecha_llegada, precio_base, capacidad_asientos, asientos_disponibles, id_aerolinea, estado, categoria, tipo_escala, ciudad_escala, equipaje_info, moneda) VALUES
(1, 'LA-2045', 'Lima (LIM)', 'Cusco (CUZ)', '2026-11-15 06:30:00', '2026-11-15 07:50:00', 189.90, 150, 142, 1, 'PROGRAMADO', 'ECONOMICO', 'DIRECTO', NULL, 'Bolso de mano incluido (5 kg)', 'PEN'),
(2, 'LA-2088', 'Lima (LIM)', 'Cusco (CUZ)', '2026-11-15 10:30:00', '2026-11-15 11:50:00', 219.00, 150, 148, 1, 'PROGRAMADO', 'EJECUTIVO', 'DIRECTO', NULL, 'Equipaje en bodega (23 kg) + Cabina (10 kg) + Asiento preferencial', 'PEN'),
(3, 'H2-5120', 'Lima (LIM)', 'Cusco (CUZ)', '2026-11-15 15:45:00', '2026-11-15 17:05:00', 169.50, 180, 175, 3, 'PROGRAMADO', 'ECONOMICO', 'CON_ESCALA', 'Trujillo (TRU)', 'Bolso de mano incluido (5 kg)', 'PEN'),
(4, 'LA-3010', 'Lima (LIM)', 'Arequipa (AQP)', '2026-11-16 08:00:00', '2026-11-16 09:30:00', 159.50, 120, 115, 1, 'PROGRAMADO', 'ECONOMICO', 'DIRECTO', NULL, 'Bolso de mano incluido (5 kg)', 'PEN'),
(5, 'JA-3420', 'Lima (LIM)', 'Arequipa (AQP)', '2026-11-16 13:15:00', '2026-11-16 14:45:00', 139.00, 186, 180, 4, 'PROGRAMADO', 'ECONOMICO', 'DIRECTO', NULL, 'Bolso de mano incluido (5 kg)', 'PEN'),
(6, 'LA-2150', 'Lima (LIM)', 'Iquitos (IQT)', '2026-11-17 07:15:00', '2026-11-17 09:05:00', 249.00, 150, 145, 1, 'PROGRAMADO', 'EJECUTIVO', 'DIRECTO', NULL, 'Equipaje en bodega (23 kg) + Cabina (10 kg) + Asiento preferencial', 'PEN'),
(7, 'LA-2204', 'Lima (LIM)', 'Tarapoto (TPP)', '2026-11-18 09:40:00', '2026-11-18 11:00:00', 199.90, 150, 150, 1, 'PROGRAMADO', 'ECONOMICO', 'CON_ESCALA', 'Chiclayo (CIX)', 'Bolso de mano incluido (5 kg)', 'PEN'),
(8, 'H2-5301', 'Lima (LIM)', 'Trujillo (TRU)', '2026-11-18 14:20:00', '2026-11-18 15:30:00', 145.00, 180, 178, 3, 'PROGRAMADO', 'ECONOMICO', 'DIRECTO', NULL, 'Bolso de mano incluido (5 kg)', 'PEN'),
(9, 'LA-2280', 'Lima (LIM)', 'Piura (PIU)', '2026-11-19 11:00:00', '2026-11-19 12:40:00', 179.00, 150, 147, 1, 'PROGRAMADO', 'EJECUTIVO', 'DIRECTO', NULL, 'Equipaje en bodega (23 kg) + Cabina (10 kg) + Asiento preferencial', 'PEN'),
(10, 'AV-204', 'Lima (LIM)', 'Bogotá (BOG)', '2026-11-20 22:00:00', '2026-11-21 03:15:00', 450.00, 200, 194, 2, 'PROGRAMADO', 'EJECUTIVO', 'DIRECTO', NULL, 'Equipaje en bodega (23 kg) + Cabina (10 kg) + Asiento preferencial', 'USD'),
(11, 'H2-5501', 'Lima (LIM)', 'Santiago (SCL)', '2026-11-22 14:00:00', '2026-11-22 18:30:00', 299.00, 180, 172, 3, 'PROGRAMADO', 'PRIMERA_CLASE', 'DIRECTO', NULL, '2x Equipaje en bodega (23 kg c/u) + Cabina (10 kg) + Asiento cama Premium', 'USD'),
(12, 'LA-2430', 'Lima (LIM)', 'Buenos Aires (EZE)', '2026-11-23 00:50:00', '2026-11-23 07:20:00', 589.00, 220, 210, 1, 'PROGRAMADO', 'PRIMERA_CLASE', 'CON_ESCALA', 'Santiago (SCL)', '2x Equipaje en bodega (23 kg c/u) + Cabina (10 kg) + Asiento cama Premium', 'USD');

INSERT IGNORE INTO reservas_pasajes (id, codigo_reserva, fecha_emision, total, estado_pago, id_pasajero, id_vuelo) VALUES
(1, 'PNR-7EF118', '2026-10-20 10:15:00', 379.80, 'PAGADO', 1, 1),
(2, 'PNR-8842A1', '2026-10-20 12:40:00', 159.50, 'PAGADO', 2, 4);

INSERT IGNORE INTO detalle_pasajes (id, id_reserva, numero_asiento, clase, precio_unitario) VALUES
(1, 1, '12A', 'ECONOMICA', 189.90),
(2, 1, '12B', 'ECONOMICA', 189.90),
(3, 2, '14C', 'ECONOMICA', 159.50);

INSERT IGNORE INTO pasarela_tarjetas (id, marca, banco_emisor, tipo_tarjeta, numero_tarjeta, titular, fecha_expiracion, cvv, saldo_disponible, estado) VALUES
(1, 'VISA', 'Banco de Crédito BCP', 'DEBITO', '4557 8901 2345 6789', 'JAZMIN CHAMORRO ARONE', '12/28', '739', 5400.00, 'ACTIVA'),
(2, 'MASTERCARD', 'BBVA Perú', 'CREDITO', '5412 7534 8901 2345', 'JAZMIN CHAMORRO ARONE', '10/29', '418', 8500.00, 'ACTIVA'),
(3, 'VISA', 'Interbank', 'DEBITO', '4111 2222 3333 4444', 'CARLOS ALBERTO RAMIREZ', '08/27', '123', 3200.00, 'ACTIVA'),
(4, 'AMEX', 'Scotiabank', 'CREDITO', '3778 1234 5678 9012', 'MARIA ELENA GUTIERREZ', '05/28', '987', 12000.00, 'ACTIVA');

INSERT IGNORE INTO pagos (id, id_reserva, metodo_pago, pasarela, codigo_transaccion, monto, moneda, titular_pagador, numero_enmascarado, fecha_pago, estado) VALUES
(1, 1, 'TARJETA_DEBITO', 'LATAM_PAY_PERU', 'TXN-VISA-98214', 379.80, 'PEN', 'Carlos Alberto Ramírez Torres', '4111 •••• •••• 4444', '2026-10-20 10:15:30', 'APROBADO'),
(2, 2, 'YAPE', 'LATAM_PAY_PERU', 'YAPE-849201', 159.50, 'PEN', 'María Elena Gutiérrez López', '912-***-678', '2026-10-20 12:40:15', 'APROBADO');
