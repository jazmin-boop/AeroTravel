# Sistema de Gestión y Venta de Pasajes Aéreos

## Introducción

AERO-TRAVEL es una aplicación web desarrollada para gestionar las operaciones de una aerolínea, permitiendo administrar vuelos, registrar pasajeros, realizar reservas y gestionar pagos de pasajes aéreos. El sistema utiliza una API REST, autenticación mediante JWT y control de acceso según los roles de usuario.

## Funcionalidades principales

- **Gestión de vuelos:** registro, consulta, actualización y eliminación de vuelos, con filtros por origen y destino.
- **Gestión de pasajeros:** registro, consulta, actualización y eliminación de información de pasajeros.
- **Reservas y emisión de pasajes:** creación y consulta de reservas, generación de códigos de reserva (PNR) y control de disponibilidad de asientos.
- **Anulación de reservas:** cancelación de reservas y actualización de los asientos disponibles.
- **Gestión de pagos:** procesamiento de pagos y consulta de tarjetas disponibles en la pasarela implementada.
- **Autenticación y seguridad:** inicio de sesión mediante JWT y control de permisos según el rol del usuario.
- **Documentación de la API:** endpoints documentados con Swagger/OpenAPI para facilitar su consulta y prueba.

## Tecnologías utilizadas

- **Backend:** Java 21, Spring Boot 3 y Spring Security 6.
- **Persistencia:** Spring Data JPA y MySQL.
- **Seguridad:** JSON Web Tokens (JWT).
- **Frontend:** HTML5, CSS3 y JavaScript.
- **Documentación:** Swagger/OpenAPI 3.
- **Gestión de dependencias:** Maven.

