# AERO-SENATI — Sistema de Venta de Pasajes Aéreos

**Institución:** SENATI — Dirección Zonal Lima - Independencia  
**Escuela:** Escuela de Tecnologías de la Información  
**Carrera:** Desarrollo de Software  
**Curso / Módulo:** Servicios Web (PDSD643) — Semestre VI  
**Estudiante:** Jazmin Chamorro Arone  
**ID / Código:** 001557367  
**Fecha:** 20 / 10 / 2026  

---

## 1. Descripción del Proyecto

Sistema Web Integral (Full-Stack) para la gestión comercial y operacional de la aerolínea comercial **"AERO-SENATI"**.
Desarrollado bajo una arquitectura desacoplada y orientada a servicios RESTful con **Spring Boot 3**, persistencia relacional con **Spring Data JPA & MySQL**, seguridad robusta mediante **Spring Security 6 con JSON Web Tokens (JWT)**, documentación interactiva con **Swagger / OpenAPI 3**, y una interfaz de usuario interactiva moderna (Single Page Application) en **HTML5, CSS3 y JavaScript**.

---

## 2. Arquitectura del Sistema

El backend sigue rigurosamente el patrón de **Arquitectura Multicapa**:

```
com.aerosenati
├── AeroSenatiApplication.java     # Clase principal (extends SpringBootServletInitializer)
├── config/
│   └── OpenApiConfig.java         # Configuración Swagger / OpenAPI 3 + JWT Bearer
├── controller/
│   ├── AuthController.java        # POST /api/v1/auth/login
│   ├── VueloController.java       # GET, POST /api/v1/vuelos
│   ├── PasajeroController.java    # POST, GET /api/v1/pasajeros
│   └── ReservaController.java     # POST, GET, DELETE /api/v1/reservas
├── dto/
│   ├── LoginRequestDTO.java
│   ├── LoginResponseDTO.java
│   ├── VueloDTO.java
│   ├── PasajeroDTO.java
│   ├── DetallePasajeDTO.java
│   ├── ReservaRequestDTO.java
│   ├── ReservaResponseDTO.java
│   └── ErrorResponseDTO.java      # Respuestas uniformes de excepción
├── exception/
│   ├── ResourceNotFoundException.java (404)
│   ├── ConflictException.java         (409)
│   └── GlobalExceptionHandler.java    (@ControllerAdvice con manejo 400, 401, 404, 409, 500)
├── model/
│   ├── Usuario.java               # Entidad tabla 'usuarios'
│   ├── Aerolinea.java             # Entidad tabla 'aerolineas'
│   ├── Pasajero.java              # Entidad tabla 'pasajeros'
│   ├── Vuelo.java                 # Entidad tabla 'vuelos'
│   ├── ReservaPasaje.java         # Entidad tabla 'reservas_pasajes'
│   └── DetallePasaje.java         # Entidad tabla 'detalle_pasajes'
├── repository/
│   ├── UsuarioRepository.java
│   ├── AerolineaRepository.java
│   ├── PasajeroRepository.java
│   ├── VueloRepository.java       # Queries derivadas y JPQL @Query
│   ├── ReservaPasajeRepository.java
│   └── DetallePasajeRepository.java
├── security/
│   ├── JwtTokenProvider.java      # Firma y validación JJWT (HS256)
│   ├── JwtAuthenticationFilter.java
│   ├── UserDetailsServiceImpl.java
│   └── SecurityConfig.java        # SecurityFilterChain, CORS, roles y rutas
└── service/
    ├── AuthService.java / AuthServiceImpl.java
    ├── VueloService.java / VueloServiceImpl.java
    ├── PasajeroService.java / PasajeroServiceImpl.java
    └── ReservaService.java / ReservaServiceImpl.java (@Transactional, PNR, stock de asientos)
```

---

## 3. Reglas de Negocio Implementadas

1. **Control Transaccional de Capacidad y Asientos (`@Transactional`):**  
   Al procesar una reserva en `POST /api/v1/reservas`, el sistema verifica que `asientos_disponibles` del vuelo sea mayor o igual a la cantidad de boletos solicitados. Si no hay suficiente capacidad, lanza `ConflictException` (HTTP 409).
2. **Actualización y Reposición Automática de Inventario:**  
   - En una venta exitosa, el inventario del vuelo se descuenta automáticamente dentro de la misma transacción.
   - En una anulación mediante `DELETE /api/v1/reservas/{id}`, el sistema cambia el estado a `ANULADO` y repone de inmediato la cantidad de asientos al vuelo correspondiente.
3. **Generación Dinámica de Código PNR:**  
   Se autogenera un código único alfanumérico (ej: `PNR-A4F891`) asegurando su no duplicidad en la base de datos.
4. **Manejo Global de Excepciones (`@ControllerAdvice`):**  
   Respuestas de error uniformes con código HTTP, tipo de error, mensaje descriptivo, lista de detalles de validación (@Valid) y timestamp.

---

## 4. Endpoints de la API RESTful

| Método HTTP | Endpoint / URI | Descripción | Rol Requerido |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/login` | Autenticación y retorno de Token JWT Bearer | **Público** |
| **GET** | `/api/v1/vuelos` | Catálogo de vuelos (con filtros `origen` y `destino`) | **Público** |
| **POST** | `/api/v1/vuelos` | Programar nuevo vuelo | `ROLE_ADMIN` |
| **POST** | `/api/v1/pasajeros` | Registrar cliente / pasajero | `ROLE_AGENTE` / `ROLE_ADMIN` |
| **GET** | `/api/v1/pasajeros` | Listar pasajeros registrados | `ROLE_AGENTE` / `ROLE_ADMIN` |
| **POST** | `/api/v1/reservas` | Venta transaccional de pasajes | `ROLE_AGENTE` / `ROLE_ADMIN` |
| **GET** | `/api/v1/reservas/{codigo}` | Consultar reserva completa por código PNR | `ROLE_AGENTE` / `ROLE_ADMIN` |
| **GET** | `/api/v1/reservas` | Historial completo de reservas emitidas | `ROLE_AGENTE` / `ROLE_ADMIN` |
| **DELETE** | `/api/v1/reservas/{id}` | Anular reserva y reponer asientos al vuelo | `ROLE_ADMIN` |

---

## 5. Instrucciones de Ejecución Paso a Paso

### Paso 1: Configurar la Base de Datos en MySQL Workbench
1. Abra **MySQL Workbench** y conéctese a su servidor local (`localhost:3306`).
2. Abra el archivo `database.sql` incluido en la raíz de este proyecto.
3. Ejecute el script completo (ícono del rayo ⚡).  
   *Esto creará la base de datos `aero_senati_db`, las 6 tablas con sus llaves foráneas y los datos iniciales de prueba (usuarios, aerolíneas, vuelos y pasajeros).*

### Paso 2: Verificar Credenciales en `application.properties`
Revise el archivo `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/aero_senati_db?useSSL=false&serverTimezone=America/Lima&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root   <-- Ingrese su contraseña de MySQL local si es diferente
```

### Paso 3: Ejecutar el Proyecto
Puede ejecutar el proyecto de cualquiera de las siguientes 3 formas:

- **Opción A (Recomendada con un clic):**  
  Doble clic en el archivo `run_app.bat` situado en la raíz del proyecto.
- **Opción B (Desde Terminal / Consola):**  
  ```bash
  .\mvnw.cmd spring-boot:run
  ```
- **Opción C (Desde Apache NetBeans IDE o IntelliJ IDEA):**  
  Abra la carpeta `aero-senati` en NetBeans o IntelliJ, espere a que resuelva las dependencias Maven y presione **Run / Ejecutar** sobre la clase `AeroSenatiApplication.java`.

### Paso 4: Probar la Aplicación Web (Frontend)
Una vez iniciado el servidor, abra su navegador web en:
👉 **`http://localhost:8080/`**

- Puede iniciar sesión rápidamente usando los botones de prueba:
  - **Administrador:** `admin` / `admin123`
  - **Agente:** `agente1` / `agente123`
- Explore los módulos: Catálogo de Vuelos, Emisión Transaccional de Pasajes, Gestión de Pasajeros y Dashboard de Reservas con anulación y reposición de stock.

### Paso 5: Probar la Documentación Interactiva Swagger UI
👉 **`http://localhost:8080/swagger-ui.html`**
- Permite probar cada endpoint individualmente.
- Use el botón **Authorize** ingresando el token JWT emitido por `/api/v1/auth/login`.

### Paso 6: Ejecutar Pruebas Automatizadas en Postman
1. Abra **Postman**.
2. Haga clic en **Import** y seleccione el archivo `vuelos_api.postman_collection.json`.
3. Ejecute las peticiones organizadas por carpetas (Auth, Vuelos, Pasajeros, Reservas).
4. Todas las pruebas (Tests) verificarán automáticamente los códigos HTTP 200, 201, 400 y 409.

