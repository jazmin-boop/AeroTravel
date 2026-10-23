-- ============================================================
-- AERO-SENATI: Script DDL y DML para MySQL Workbench
-- Base de datos: aero_senati_db
-- ============================================================

CREATE DATABASE IF NOT EXISTS aero_senati_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aero_senati_db;

-- Limpieza ordenada respetando llaves foráneas
DROP TABLE IF EXISTS detalle_pasajes;
DROP TABLE IF EXISTS reservas_pasajes;
DROP TABLE IF EXISTS vuelos;
DROP TABLE IF EXISTS pasajeros;
DROP TABLE IF EXISTS aerolineas;
DROP TABLE IF EXISTS usuarios;

-- 1. TABLA: usuarios (Autenticación y Roles)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL, -- 'ROLE_ADMIN', 'ROLE_AGENTE'
    estado BOOLEAN DEFAULT TRUE
);

-- 2. TABLA: aerolineas
CREATE TABLE aerolineas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo_iata VARCHAR(10) UNIQUE NOT NULL, -- Ej: 'LA', 'AV', 'H2', 'JA'
    pais_origen VARCHAR(50)
);

-- 3. TABLA: pasajeros (Clientes de la aerolínea)
CREATE TABLE pasajeros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    doc_identidad VARCHAR(20) UNIQUE NOT NULL, -- DNI o Pasaporte
    nacionalidad VARCHAR(50),
    telefono VARCHAR(20),
    email VARCHAR(100) NOT NULL
);

-- 4. TABLA: vuelos
CREATE TABLE vuelos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_vuelo VARCHAR(20) NOT NULL UNIQUE, -- Ej: 'LA-2045'
    origen VARCHAR(100) NOT NULL,
    destino VARCHAR(100) NOT NULL,
    fecha_salida DATETIME NOT NULL,
    fecha_llegada DATETIME NOT NULL,
    precio_base DECIMAL(10,2) NOT NULL,
    capacidad_asientos INT NOT NULL,
    asientos_disponibles INT NOT NULL,
    id_aerolinea INT,
    estado VARCHAR(20) DEFAULT 'PROGRAMADO', -- 'PROGRAMADO', 'EN_VUELO', 'CANCELADO'
    categoria VARCHAR(30) DEFAULT 'ECONOMICO', -- 'ECONOMICO', 'EJECUTIVO', 'PRIMERA_CLASE'
    tipo_escala VARCHAR(30) DEFAULT 'DIRECTO', -- 'DIRECTO', 'CON_ESCALA'
    ciudad_escala VARCHAR(100) NULL,
    equipaje_info VARCHAR(255) DEFAULT 'Bolso de mano incluido (5 kg)',
    moneda VARCHAR(10) DEFAULT 'PEN', -- 'PEN', 'USD'
    FOREIGN KEY (id_aerolinea) REFERENCES aerolineas(id)
);

-- 5. TABLA: reservas_pasajes (Transacción Principal)
CREATE TABLE reservas_pasajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_reserva VARCHAR(10) NOT NULL UNIQUE, -- Ej: 'PNR-9821'
    fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado_pago VARCHAR(20) DEFAULT 'PAGADO', -- 'PAGADO', 'RESERVADO', 'ANULADO'
    id_pasajero INT NOT NULL,
    id_vuelo INT NOT NULL,
    FOREIGN KEY (id_pasajero) REFERENCES pasajeros(id),
    FOREIGN KEY (id_vuelo) REFERENCES vuelos(id)
);

-- 6. TABLA: detalle_pasajes (Boletos individuales)
CREATE TABLE detalle_pasajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_reserva INT NOT NULL,
    numero_asiento VARCHAR(10) NOT NULL, -- Ej: '12A', '14C'
    clase VARCHAR(30) DEFAULT 'ECONOMICA', -- 'ECONOMICA', 'EXECUTIVA', 'FIRST_CLASS'
    precio_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_reserva) REFERENCES reservas_pasajes(id) ON DELETE CASCADE
);

-- 7. TABLA: pasarela_tarjetas (Tarjetas y cuentas semilla autorizadas)
CREATE TABLE pasarela_tarjetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca VARCHAR(30) NOT NULL,            -- 'VISA', 'MASTERCARD', 'AMEX'
    banco_emisor VARCHAR(50) NOT NULL,     -- 'Banco de Crédito BCP', 'BBVA Perú', 'Interbank', 'Scotiabank'
    tipo_tarjeta VARCHAR(30) NOT NULL,     -- 'CREDITO', 'DEBITO'
    numero_tarjeta VARCHAR(25) NOT NULL,   -- '4557 8901 2345 6789'
    titular VARCHAR(100) NOT NULL,         -- 'JAZMIN CHAMORRO ARONE'
    fecha_expiracion VARCHAR(10) NOT NULL, -- '12/28'
    cvv VARCHAR(5) NOT NULL,               -- '739'
    saldo_disponible DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
    estado VARCHAR(20) DEFAULT 'ACTIVA'    -- 'ACTIVA', 'BLOQUEADA'
);

-- 8. TABLA: pagos (Transacciones registradas por la pasarela de pago)
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_reserva INT NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,      -- 'TARJETA_CREDITO', 'TARJETA_DEBITO', 'YAPE', 'PLIN', 'PAGOEFECTIVO'
    pasarela VARCHAR(50) DEFAULT 'LATAM_PAY_PERU',
    codigo_transaccion VARCHAR(50) NOT NULL UNIQUE, -- 'TXN-984210', 'YAPE-849201', 'CIP-4892-1045'
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(10) DEFAULT 'PEN',
    titular_pagador VARCHAR(100) NOT NULL,
    numero_enmascarado VARCHAR(30) NOT NULL, -- '4557 •••• •••• 6789' o '999-***-777'
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'APROBADO',  -- 'APROBADO', 'PENDIENTE', 'RECHAZADO'
    FOREIGN KEY (id_reserva) REFERENCES reservas_pasajes(id) ON DELETE CASCADE
);

-- ============================================================
-- DATOS SEMILLA REALES (Seed Data de Producción)
-- ============================================================

-- Usuarios del Sistema con BCrypt:
-- admin / admin123
-- agente1 / agente123
INSERT INTO usuarios (id, username, password, rol, estado) VALUES
(1, 'admin', '$2a$10$5chA02lOmxuFOQrotTjWwOM8Zb/CzNDiIDrMaE5ppvbzXfQYJpK62', 'ROLE_ADMIN', TRUE),
(2, 'agente1', '$2a$10$7A7Q4fffHQwwM5/9hq5die2t3d5F/0bYLfoPfoiMusPaeiFNQ39wi', 'ROLE_AGENTE', TRUE);

-- Aerolíneas Comerciales
INSERT INTO aerolineas (id, nombre, codigo_iata, pais_origen) VALUES
(1, 'LATAM Airlines', 'LA', 'Perú'),
(2, 'Avianca', 'AV', 'Colombia'),
(3, 'Sky Airline', 'H2', 'Chile'),
(4, 'JetSMART', 'JA', 'Chile');

-- Pasajeros Frecuentes
INSERT INTO pasajeros (id, nombres, apellidos, doc_identidad, nacionalidad, telefono, email) VALUES
(1, 'Carlos Alberto', 'Ramírez Torres', '72345678', 'Peruana', '987654321', 'carlos.ramirez@gmail.com'),
(2, 'María Elena', 'Gutiérrez López', '45678912', 'Peruana', '912345678', 'maria.gutierrez@gmail.com'),
(3, 'Jazmin', 'Chamorro Arone', '001557367', 'Peruana', '999888777', 'jazmin.chamorro@senati.pe'),
(4, 'Alejandro', 'Vargas Mendoza', '41238956', 'Peruana', '945671234', 'a.vargas@outlook.com'),
(5, 'Valeria', 'Paredes Silva', '70984512', 'Peruana', '978123456', 'valeria.paredes@yahoo.com');

-- Vuelos Comerciales Reales con Itinerarios Nacionales e Internacionales
INSERT INTO vuelos (id, numero_vuelo, origen, destino, fecha_salida, fecha_llegada, precio_base, capacidad_asientos, asientos_disponibles, id_aerolinea, estado) VALUES
-- Rutas desde Lima
(1, 'LA-2045', 'Lima (LIM)', 'Cusco (CUZ)', '2026-11-15 06:30:00', '2026-11-15 07:50:00', 189.90, 150, 142, 1, 'PROGRAMADO'),
(2, 'LA-2088', 'Lima (LIM)', 'Cusco (CUZ)', '2026-11-15 10:30:00', '2026-11-15 11:50:00', 219.00, 150, 148, 1, 'PROGRAMADO'),
(3, 'H2-5120', 'Lima (LIM)', 'Cusco (CUZ)', '2026-11-15 15:45:00', '2026-11-15 17:05:00', 169.50, 180, 175, 3, 'PROGRAMADO'),
(4, 'LA-3010', 'Lima (LIM)', 'Arequipa (AQP)', '2026-11-16 08:00:00', '2026-11-16 09:30:00', 159.50, 120, 115, 1, 'PROGRAMADO'),
(5, 'JA-3420', 'Lima (LIM)', 'Arequipa (AQP)', '2026-11-16 13:15:00', '2026-11-16 14:45:00', 139.00, 186, 180, 4, 'PROGRAMADO'),
(6, 'LA-2150', 'Lima (LIM)', 'Iquitos (IQT)', '2026-11-17 07:15:00', '2026-11-17 09:05:00', 249.00, 150, 145, 1, 'PROGRAMADO'),
(7, 'LA-2204', 'Lima (LIM)', 'Tarapoto (TPP)', '2026-11-18 09:40:00', '2026-11-18 11:00:00', 199.90, 150, 150, 1, 'PROGRAMADO'),
(8, 'H2-5301', 'Lima (LIM)', 'Trujillo (TRU)', '2026-11-18 14:20:00', '2026-11-18 15:30:00', 145.00, 180, 178, 3, 'PROGRAMADO'),
(9, 'LA-2280', 'Lima (LIM)', 'Piura (PIU)', '2026-11-19 11:00:00', '2026-11-19 12:40:00', 179.00, 150, 147, 1, 'PROGRAMADO'),
-- Rutas Internacionales
(10, 'AV-204', 'Lima (LIM)', 'Bogotá (BOG)', '2026-11-20 22:00:00', '2026-11-21 03:15:00', 450.00, 200, 194, 2, 'PROGRAMADO'),
(11, 'H2-5501', 'Lima (LIM)', 'Santiago (SCL)', '2026-11-22 14:00:00', '2026-11-22 18:30:00', 299.00, 180, 172, 3, 'PROGRAMADO'),
(12, 'LA-2430', 'Lima (LIM)', 'Buenos Aires (EZE)', '2026-11-23 00:50:00', '2026-11-23 07:20:00', 589.00, 220, 210, 1, 'PROGRAMADO');

-- Reservas de Ejemplo Iniciales
INSERT INTO reservas_pasajes (id, codigo_reserva, fecha_emision, total, estado_pago, id_pasajero, id_vuelo) VALUES
(1, 'PNR-7EF118', '2026-10-20 10:15:00', 379.80, 'PAGADO', 1, 1),
(2, 'PNR-8842A1', '2026-10-20 12:40:00', 159.50, 'PAGADO', 2, 4);

-- Detalle de Boletos
INSERT INTO detalle_pasajes (id, id_reserva, numero_asiento, clase, precio_unitario) VALUES
(1, 1, '12A', 'ECONOMICA', 189.90),
(2, 1, '12B', 'ECONOMICA', 189.90),
(3, 2, '14C', 'ECONOMICA', 159.50);

-- DATOS SEMILLA: Transacciones históricas de pago asociadas a las reservas 1 y 2
INSERT INTO pagos (id, id_reserva, metodo_pago, pasarela, codigo_transaccion, monto, moneda, titular_pagador, numero_enmascarado, fecha_pago, estado) VALUES
(1, 1, 'TARJETA_DEBITO', 'LATAM_PAY_PERU', 'TXN-VISA-98214', 379.80, 'PEN', 'Carlos Alberto Ramírez Torres', '4111 •••• •••• 4444', '2026-10-20 10:15:30', 'APROBADO'),
(2, 2, 'YAPE', 'LATAM_PAY_PERU', 'YAPE-849201', 159.50, 'PEN', 'María Elena Gutiérrez López', '912-***-678', '2026-10-20 12:40:15', 'APROBADO');
