USE aero_senati_db;

-- 7. TABLA: pasarela_tarjetas (Tarjetas y cuentas semilla autorizadas)
CREATE TABLE IF NOT EXISTS pasarela_tarjetas (
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
CREATE TABLE IF NOT EXISTS pagos (
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

-- DATOS SEMILLA: Tarjetas de prueba autorizadas en MySQL
INSERT IGNORE INTO pasarela_tarjetas (id, marca, banco_emisor, tipo_tarjeta, numero_tarjeta, titular, fecha_expiracion, cvv, saldo_disponible, estado) VALUES
(1, 'VISA', 'Banco de Crédito BCP', 'DEBITO', '4557 8901 2345 6789', 'JAZMIN CHAMORRO ARONE', '12/28', '739', 5400.00, 'ACTIVA'),
(2, 'MASTERCARD', 'BBVA Perú', 'CREDITO', '5412 7534 8901 2345', 'JAZMIN CHAMORRO ARONE', '10/29', '418', 8500.00, 'ACTIVA'),
(3, 'VISA', 'Interbank', 'DEBITO', '4111 2222 3333 4444', 'CARLOS ALBERTO RAMIREZ', '08/27', '123', 3200.00, 'ACTIVA'),
(4, 'AMEX', 'Scotiabank', 'CREDITO', '3778 1234 5678 9012', 'MARIA ELENA GUTIERREZ', '05/28', '987', 12000.00, 'ACTIVA');

-- DATOS SEMILLA: Transacciones históricas de pago asociadas a las reservas 1 y 2
INSERT IGNORE INTO pagos (id, id_reserva, metodo_pago, pasarela, codigo_transaccion, monto, moneda, titular_pagador, numero_enmascarado, fecha_pago, estado) VALUES
(1, 1, 'TARJETA_DEBITO', 'LATAM_PAY_PERU', 'TXN-VISA-98214', 379.80, 'PEN', 'Carlos Alberto Ramírez Torres', '4111 •••• •••• 4444', '2026-10-20 10:15:30', 'APROBADO'),
(2, 2, 'YAPE', 'LATAM_PAY_PERU', 'YAPE-849201', 159.50, 'PEN', 'María Elena Gutiérrez López', '912-***-678', '2026-10-20 12:40:15', 'APROBADO');

