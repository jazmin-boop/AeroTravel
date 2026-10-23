/**
 * AERO-SENATI TRAVEL & LATAM AIRLINES OPERATIONAL CONTROLLER
 * Sistema Integral de Venta de Pasajes por Roles (ROLE_ADMIN, ROLE_AGENTE)
 * Evaluación Final Integral: Servicios Web (PDSD643) - SENATI 2026
 * SIN EMOJIS · DATOS REALES DE BASE DE DATOS MYSQL · JWT SECURED
 */

const API_BASE = '/api/v1';

class TravelApp {
    constructor() {
        this.token = localStorage.getItem('token') || null;
        this.username = localStorage.getItem('username') || null;
        this.rol = localStorage.getItem('rol') || null;

        this.vuelos = [];
        this.vuelosFiltrados = [];
        this.pasajeros = [];
        this.reservas = [];

        this.vueloSeleccionado = null;
        this.asientosSeleccionados = new Set();
        this.claseSeleccionada = 'ECONOMICA';
        this.metodoPagoSeleccionado = 'tarjeta';
        this.montoTotalPago = 0;
        this.moduloActual = 'vuelos';
        this.reservaPendienteParaPagar = null;

        // Variables de moneda, filtros y sincronización
        this.moneda = 'PEN';
        this.tipoCambio = 3.75;
        this.filtroEstadoVuelo = 'TODOS';
        this.filtroCategoriaVuelo = 'TODOS';
        this.ordenPrecio = 'default';
        this.filtroPrecioMax = 1000;
        this.filtroHorarioMax = 23;
        this.filtroEstadoReserva = 'TODOS';
        this.filtroPasajeroTexto = '';
        this.reservaACancelar = null;
        this.asientosOcupadosVueloActual = new Set();
        this.timerHoldInterval = null;
        this.timerHoldSeconds = 180; // 3 minutos para retención y proceso de pago

        // Paginación para los 3 CRUDs (Filtros 10, 20, 50, etc.)
        this.paginaActualVuelos = 1;
        this.tamanoPaginaVuelos = 10;
        this.paginaActualPasajeros = 1;
        this.tamanoPaginaPasajeros = 10;
        this.pasajerosFiltrados = [];
        this.paginaActualReservas = 1;
        this.tamanoPaginaReservas = 10;

        this.init();
    }

    init() {
        this.actualizarEstadoAuth();
        this.cargarVuelos();

        if (this.token) {
            this.cargarPasajeros();
            this.cargarHistorialReservas();
        }

        // Permitir salir de cualquier modal con tecla Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarModalEditarVuelo();
                this.cerrarModalCrearVuelo();
                this.cerrarModalCheckout();
                this.cerrarPasarelaPago();
                this.cerrarModalLogin();
                this.cerrarModalMapaCabina();
                this.cerrarModalCancelarReserva();
                this.cerrarModalCrearPasajeroDesdeEmision();
            }
        });

        // Cerrar modal al hacer clic en el fondo oscuro
        document.querySelectorAll('.modal-backdrop-clean').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    backdrop.style.display = 'none';
                }
            });
        });
    }

    // ============================================================
    // FORMATEO Y CONVERSIÓN DE MONEDA (SOLES / DÓLARES)
    // ============================================================
    formatearPrecio(montoPEN) {
        if (!montoPEN && montoPEN !== 0) return 'S/ 0.00';
        if (this.moneda === 'USD') {
            const usd = montoPEN / this.tipoCambio;
            return `$ ${usd.toFixed(2)} USD`;
        }
        return `S/ ${montoPEN.toFixed(2)}`;
    }

    cambiarMoneda(nuevaMoneda) {
        this.moneda = nuevaMoneda;
        document.getElementById('btnCurrPEN')?.classList.toggle('active', nuevaMoneda === 'PEN');
        document.getElementById('btnCurrUSD')?.classList.toggle('active', nuevaMoneda === 'USD');

        this.toast(`Moneda actualizada a ${nuevaMoneda === 'USD' ? 'Dólares Americanos ($)' : 'Soles Peruanos (S/)'} (TC: ${this.tipoCambio})`, 'info');
        this.renderizarDashboardVuelos(this.vuelosFiltrados);
        this.recalcularTotalesEmision();

        const gatewayTotal = document.getElementById('gatewayDisplayTotal');
        if (gatewayTotal && this.montoTotalPago) {
            gatewayTotal.innerText = this.formatearPrecio(this.montoTotalPago);
        }
    }

    // ============================================================
    // GESTIÓN DE VISTAS Y ESTADO DE AUTENTICACIÓN (ROLES)
    // ============================================================
    actualizarEstadoAuth() {
        const btnLogin = document.getElementById('btnAbrirLogin');
        const userMenu = document.getElementById('userMenuDropdown');
        const vistaPub = document.getElementById('vistaPublica');
        const vistaOps = document.getElementById('vistaSistemaGestion');
        const navPub = document.getElementById('navLinksPublicos');
        const navOps = document.getElementById('navLinksOperacionales');

        const opsRole = document.getElementById('opsRoleDisplay');
        const opsGreet = document.getElementById('opsUserGreeting');
        const btnCrearVuelo = document.getElementById('btnAbrirModalCrearVuelo');

        if (this.token) {
            // USUARIO AUTENTICADO: Ingresa directamente al Sistema de Gestión (Consigna)
            if (btnLogin) btnLogin.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (vistaPub) vistaPub.style.display = 'none';
            if (vistaOps) vistaOps.style.display = 'block';
            if (navPub) navPub.style.display = 'none';
            if (navOps) navOps.style.display = 'flex';

            document.getElementById('userNameLabel').innerText = this.username;
            document.getElementById('userRoleBadge').innerText = this.rol;

            if (opsRole) {
                opsRole.innerText = this.rol === 'ROLE_ADMIN' ? 'Control de Operaciones' : 'Emisión Comercial';
                opsRole.className = `ops-role-pill ${this.rol === 'ROLE_ADMIN' ? 'admin' : ''}`;
            }

            if (opsGreet) {
                opsGreet.innerText = `LATAM Airlines · Sesión: ${this.username} (${this.rol === 'ROLE_ADMIN' ? 'Gestión Integral de Operaciones' : 'Atención y Emisión de Boletos'})`;
            }

            // Permisos de Rol: Solo ROLE_ADMIN puede programar nuevos vuelos
            if (btnCrearVuelo) {
                btnCrearVuelo.style.display = this.rol === 'ROLE_ADMIN' ? 'flex' : 'none';
            }

            this.cambiarModuloOps(this.moduloActual || 'vuelos');

        } else {
            // MODO PÚBLICO / VISITANTE: Muestra la Landing LATAM
            if (btnLogin) btnLogin.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            if (vistaPub) vistaPub.style.display = 'block';
            if (vistaOps) vistaOps.style.display = 'none';
            if (navPub) navPub.style.display = 'flex';
            if (navOps) navOps.style.display = 'none';
        }
    }

    verPortalPublico() {
        const vistaPub = document.getElementById('vistaPublica');
        const vistaOps = document.getElementById('vistaSistemaGestion');
        if (vistaPub) vistaPub.style.display = 'block';
        if (vistaOps) vistaOps.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.toast('Visualizando portal público. Haz clic en tu usuario o inicia sesión para volver.', 'info');
    }

    volverAlSistemaOps() {
        if (!this.token) {
            this.abrirModalLogin();
            return;
        }
        const vistaPub = document.getElementById('vistaPublica');
        const vistaOps = document.getElementById('vistaSistemaGestion');
        if (vistaPub) vistaPub.style.display = 'none';
        if (vistaOps) vistaOps.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    irAInicio() {
        if (this.token) {
            this.volverAlSistemaOps();
        } else {
            this.verPortalPublico();
        }
    }

    // ============================================================
    // NAVEGACIÓN MODULAR DE LA CONSIGNA (VUELOS, CLIENTES, EMISIÓN, RESERVAS)
    // ============================================================
    cambiarModuloOps(modulo) {
        this.moduloActual = modulo;

        // Asegurar que estamos en la vista de operaciones
        const vistaPub = document.getElementById('vistaPublica');
        const vistaOps = document.getElementById('vistaSistemaGestion');
        if (vistaPub) vistaPub.style.display = 'none';
        if (vistaOps) vistaOps.style.display = 'block';

        // Actualizar pestañas activas en la barra sub-header
        document.querySelectorAll('.ops-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('#navLinksOperacionales .nav-link').forEach(l => l.classList.remove('active'));

        // Ocultar todas las secciones de módulos
        document.querySelectorAll('.ops-module-view').forEach(sec => sec.classList.remove('active'));

        if (modulo === 'vuelos') {
            document.getElementById('secModVuelos')?.classList.add('active');
            document.getElementById('tabBtnVuelos')?.classList.add('active');
            document.getElementById('navLinkModVuelos')?.classList.add('active');
            this.cargarVuelos();

        } else if (modulo === 'clientes') {
            document.getElementById('secModClientes')?.classList.add('active');
            document.getElementById('tabBtnClientes')?.classList.add('active');
            document.getElementById('navLinkModClientes')?.classList.add('active');
            this.cargarPasajeros();

        } else if (modulo === 'emision') {
            document.getElementById('secModEmision')?.classList.add('active');
            document.getElementById('tabBtnEmision')?.classList.add('active');
            document.getElementById('navLinkModEmision')?.classList.add('active');
            this.llenarDropdownsEmision();

        } else if (modulo === 'reservas') {
            document.getElementById('secModReservas')?.classList.add('active');
            document.getElementById('tabBtnReservas')?.classList.add('active');
            document.getElementById('navLinkModReservas')?.classList.add('active');
            this.cargarHistorialReservas();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ============================================================
    // LOGIN Y AUTENTICACIÓN CON JWT
    // ============================================================
    abrirModalLogin() {
        const modal = document.getElementById('modalLoginBox');
        if (modal) modal.style.display = 'flex';
        // Precargar credenciales de admin por defecto para evitar campos vacíos
        const u = document.getElementById('loginUser');
        const p = document.getElementById('loginPass');
        if (u && !u.value) u.value = 'admin';
        if (p && !p.value) p.value = 'admin123';
    }

    cerrarModalLogin() {
        document.getElementById('modalLoginBox').style.display = 'none';
    }

    setCredenciales(u, p) {
        const uInput = document.getElementById('loginUser');
        const pInput = document.getElementById('loginPass');
        if (uInput) uInput.value = u;
        if (pInput) pInput.value = p;
        this.ejecutarLogin();
    }

    loginRapido(u, p) {
        this.setCredenciales(u, p);
    }

    async ejecutarLogin(e) {
        if (e && e.preventDefault) e.preventDefault();
        const username = document.getElementById('loginUser')?.value?.trim();
        const password = document.getElementById('loginPass')?.value;

        if (!username || !password) {
            this.toast('Por favor ingresa usuario y contraseña.', 'warning');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                this.toast(data.mensaje || 'Credenciales incorrectas.', 'error');
                return;
            }

            this.token = data.token;
            this.username = data.username;
            this.rol = data.rol;

            localStorage.setItem('token', this.token);
            localStorage.setItem('username', this.username);
            localStorage.setItem('rol', this.rol);

            this.cerrarModalLogin();
            this.actualizarEstadoAuth();
            this.cargarPasajeros();
            this.cargarHistorialReservas();

            this.toast(`Bienvenido ${this.username}. Ingresando al Sistema con rol ${this.rol}.`, 'success');

        } catch (err) {
            this.toast('Error de conexión con el servidor de autenticación.', 'error');
            console.error(err);
        }
    }

    cerrarSesion() {
        this.token = null;
        this.username = null;
        this.rol = null;
        localStorage.clear();
        this.actualizarEstadoAuth();
        this.toast('Sesión cerrada correctamente.', 'info');
    }

    // ============================================================
    // MÓDULO 1: VUELOS (CONSUMO API, FILTROS Y CATEGORÍAS)
    // ============================================================
    async cargarVuelos(origen = '', destino = '') {
        try {
            let url = `${API_BASE}/vuelos`;
            const params = new URLSearchParams();
            if (origen) params.append('origen', origen);
            if (destino) params.append('destino', destino);
            if ([...params].length > 0) url += `?${params.toString()}`;

            const res = await fetch(url);
            const data = await res.json();
            this.vuelos = data;
            this.vuelosFiltrados = [...data];

            this.poblarFiltrosRutaSidebar();
            this.aplicarTodosLosFiltrosVuelos();

        } catch (err) {
            console.error('Error cargando vuelos:', err);
        }
    }

    poblarFiltrosRutaSidebar() {
        const selOrig = document.getElementById('filterSidebarOrigen');
        const selDest = document.getElementById('filterSidebarDestino');
        if (!selOrig || !selDest || !this.vuelos || this.vuelos.length === 0) return;

        const valOrigActual = selOrig.value;
        const valDestActual = selDest.value;

        // Si ya contiene el catálogo completo de provincias del Perú (más de 10 opciones), preservarlo íntegro
        if (selOrig.options.length > 10 && selDest.options.length > 10) {
            const existingOrigVals = Array.from(selOrig.options).map(o => o.value.toLowerCase());
            const existingDestVals = Array.from(selDest.options).map(o => o.value.toLowerCase());

            let extraOrigGrp = selOrig.querySelector('optgroup[data-extra="true"]');
            let extraDestGrp = selDest.querySelector('optgroup[data-extra="true"]');

            this.vuelos.forEach(v => {
                if (v.origen) {
                    const ciudadOrig = v.origen.split('(')[0].trim();
                    if (!existingOrigVals.some(ev => ev && (ciudadOrig.toLowerCase().includes(ev) || ev.includes(ciudadOrig.toLowerCase())))) {
                        if (!extraOrigGrp) {
                            extraOrigGrp = document.createElement('optgroup');
                            extraOrigGrp.label = 'Otras Rutas Operadas';
                            extraOrigGrp.setAttribute('data-extra', 'true');
                            selOrig.appendChild(extraOrigGrp);
                        }
                        const opt = document.createElement('option');
                        opt.value = ciudadOrig;
                        opt.textContent = v.origen;
                        extraOrigGrp.appendChild(opt);
                        existingOrigVals.push(ciudadOrig.toLowerCase());
                    }
                }
                if (v.destino) {
                    const ciudadDest = v.destino.split('(')[0].trim();
                    if (!existingDestVals.some(ev => ev && (ciudadDest.toLowerCase().includes(ev) || ev.includes(ciudadDest.toLowerCase())))) {
                        if (!extraDestGrp) {
                            extraDestGrp = document.createElement('optgroup');
                            extraDestGrp.label = 'Otras Rutas Operadas';
                            extraDestGrp.setAttribute('data-extra', 'true');
                            selDest.appendChild(extraDestGrp);
                        }
                        const opt = document.createElement('option');
                        opt.value = ciudadDest;
                        opt.textContent = v.destino;
                        extraDestGrp.appendChild(opt);
                        existingDestVals.push(ciudadDest.toLowerCase());
                    }
                }
            });

            if (valOrigActual) selOrig.value = valOrigActual;
            if (valDestActual) selDest.value = valDestActual;
            return;
        }

        const origenesSet = new Set();
        const destinosSet = new Set();

        this.vuelos.forEach(v => {
            if (v.origen) origenesSet.add(v.origen.trim());
            if (v.destino) destinosSet.add(v.destino.trim());
        });

        const origenes = Array.from(origenesSet).sort();
        const destinos = Array.from(destinosSet).sort();

        selOrig.innerHTML = '<option value="">Cualquier origen</option>' +
            origenes.map(o => `<option value="${o}">${o}</option>`).join('');

        selDest.innerHTML = '<option value="">Cualquier destino</option>' +
            destinos.map(d => `<option value="${d}">${d}</option>`).join('');

        if (valOrigActual && origenes.includes(valOrigActual)) selOrig.value = valOrigActual;
        if (valDestActual && destinos.includes(valDestActual)) selDest.value = valDestActual;
    }

    ejecutarBusquedaDesdeHero() {
        const origen = document.getElementById('dropdownOrigen').value;
        const destino = document.getElementById('dropdownDestino').value;
        const fecha = document.getElementById('inputFechaSalida').value;
        this.claseSeleccionada = document.getElementById('selectTravelersClass').value;

        const origQuery = origen.includes('Lima') ? 'Lima' : '';
        let destQuery = '';
        if (destino) {
            const ciudades = ['Cusco', 'Arequipa', 'Iquitos', 'Trujillo', 'Tarapoto', 'Piura', 'Bogotá', 'Santiago', 'Buenos Aires'];
            for (const c of ciudades) {
                if (destino.includes(c)) { destQuery = c; break; }
            }
        }

        const origenNombre = origen.split(' - ')[0];
        const destinoNombre = destino ? destino.split(' - ')[0] : 'Todos los destinos';
        document.getElementById('dashRouteTitle').innerText = `${origenNombre} -> ${destinoNombre}`;

        if (this.token) {
            this.cambiarModuloOps('vuelos');
        } else {
            this.verPortalPublico();
            this.abrirModalLogin();
        }

        this.cargarVuelos(origQuery, destQuery);
    }

    intercambiarAeropuertos() {
        const orig = document.getElementById('dropdownOrigen');
        const dest = document.getElementById('dropdownDestino');
        const valOrig = orig.value;
        const valDest = dest.value;
        if (valDest) {
            orig.value = valDest;
            dest.value = valOrig;
        }
    }

    alCambiarOrigen() {}

    filtrarPorDestinoCard(destText) {
        document.getElementById('dropdownDestino').value = destText;
        this.ejecutarBusquedaDesdeHero();
    }

    aplicarFiltrosSidebar() {
        this.aplicarTodosLosFiltrosVuelos();
    }

    alAjustarRangoHorario(input) {
        const val = parseInt(input.value);
        this.filtroHorarioMax = val;
        document.getElementById('lblDepartureFilter').innerText = `Hasta las ${val.toString().padStart(2, '0')}:00 hrs`;
        this.aplicarTodosLosFiltrosVuelos();
    }

    alAjustarFiltroPrecio(input) {
        const val = parseFloat(input.value);
        this.filtroPrecioMax = val;
        document.getElementById('lblPriceFilterDisplay').innerText = `Hasta ${this.formatearPrecio(val)}`;
        this.aplicarTodosLosFiltrosVuelos();
    }

    alCambiarOrdenPrecio(orden) {
        this.ordenPrecio = orden;
        this.aplicarTodosLosFiltrosVuelos();
    }

    filtrarPorEstadoVuelo(estado, btn) {
        this.filtroEstadoVuelo = estado;
        document.querySelectorAll('#secModVuelos .status-chip-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.aplicarTodosLosFiltrosVuelos();
    }

    aplicarTodosLosFiltrosVuelos() {
        let lista = [...this.vuelos];

        // 1. Filtro por Estado
        if (this.filtroEstadoVuelo && this.filtroEstadoVuelo !== 'TODOS') {
            lista = lista.filter(v => (v.estado || 'PROGRAMADO').toUpperCase() === this.filtroEstadoVuelo);
        }

        // 2. Filtro por Ruta (Sidebar Dinámico con todas las rutas cargadas)
        const orig = document.getElementById('filterSidebarOrigen')?.value;
        const dest = document.getElementById('filterSidebarDestino')?.value;
        if (orig) lista = lista.filter(v => v.origen.toLowerCase().includes(orig.toLowerCase()) || orig.toLowerCase().includes(v.origen.toLowerCase()));
        if (dest) lista = lista.filter(v => v.destino.toLowerCase().includes(dest.toLowerCase()) || dest.toLowerCase().includes(v.destino.toLowerCase()));

        // 3. Filtro por Horario de Salida
        if (this.filtroHorarioMax) {
            lista = lista.filter(v => new Date(v.fechaSalida).getHours() <= this.filtroHorarioMax);
        }

        // 4. Filtro por Precio Máximo
        if (this.filtroPrecioMax) {
            lista = lista.filter(v => v.precioBase <= this.filtroPrecioMax);
        }

        // 5. Filtro por Categoría Real (ECONOMICO, EJECUTIVO, PRIMERA_CLASE)
        if (this.filtroCategoriaVuelo && this.filtroCategoriaVuelo !== 'TODOS') {
            lista = lista.filter(v => (v.categoria || 'ECONOMICO').toUpperCase() === this.filtroCategoriaVuelo.toUpperCase());
        }

        // 6. Ordenamiento manual por precio
        if (this.ordenPrecio === 'asc') {
            lista.sort((a, b) => a.precioBase - b.precioBase);
        } else if (this.ordenPrecio === 'desc') {
            lista.sort((a, b) => b.precioBase - a.precioBase);
        }

        this.vuelosFiltrados = lista;
        this.renderizarDashboardVuelos(this.vuelosFiltrados);
    }

    // FILTRO REAL POR CATEGORÍA DE VUELOS (SIN PRECIOS)
    filtrarPorCategoriaVuelo(categoria, btnElement) {
        this.filtroCategoriaVuelo = categoria;
        this.paginaActualVuelos = 1;

        document.querySelectorAll('.cat-pill-filter-grid .cat-pill-card').forEach(b => b.classList.remove('active'));
        if (btnElement) {
            btnElement.classList.add('active');
        } else {
            const btnId = categoria === 'TODOS' ? 'btnCatTodos' : (categoria === 'ECONOMICO' ? 'btnCatEconomico' : (categoria === 'EJECUTIVO' ? 'btnCatEjecutivo' : 'btnCatPrimeraClase'));
            document.getElementById(btnId)?.classList.add('active');
        }

        this.aplicarTodosLosFiltrosVuelos();
    }

    limpiarFiltrosCategoria() {
        this.filtrarPorCategoriaVuelo('TODOS', document.getElementById('btnCatTodos'));
    }

    cambiarPaginaVuelos(pag) {
        this.paginaActualVuelos = pag;
        this.renderizarDashboardVuelos(this.vuelosFiltrados);
    }

    cambiarTamanoPaginaVuelos(tam) {
        this.tamanoPaginaVuelos = tam;
        this.paginaActualVuelos = 1;
        this.renderizarDashboardVuelos(this.vuelosFiltrados);
    }

    renderizarDashboardVuelos(vuelos) {
        const container = document.getElementById('dashboardFlightCardsContainer');
        const countLabel = document.getElementById('lblResultsCount');

        if (!container) return;

        const totalVuelos = vuelos.length;
        if (countLabel) countLabel.innerText = `${totalVuelos} vuelos disponibles en catálogo`;

        if (totalVuelos === 0) {
            container.innerHTML = `
                <div class="flight-ticket-card-ui text-center py-4" style="background:white; border-radius:12px; padding:2.5rem; border:1.5px solid var(--latam-border);">
                    <h4 style="color:var(--latam-indigo);">No se encontraron vuelos para este criterio</h4>
                    <p class="text-muted-sm">Prueba seleccionando otra categoría o restableciendo el catálogo general.</p>
                    <button class="btn-clean-outline btn-sm mt-3" onclick="app.restablecerTodosLosFiltros()">Restablecer Catálogo</button>
                </div>
            `;
            this.renderPaginacion('paginationVuelos', 0, 1, this.tamanoPaginaVuelos, 'cambiarPaginaVuelos', 'cambiarTamanoPaginaVuelos');
            return;
        }

        // Paginación de vuelos (10, 20, 50, etc.)
        const totalPaginas = Math.ceil(totalVuelos / this.tamanoPaginaVuelos) || 1;
        if (this.paginaActualVuelos > totalPaginas) this.paginaActualVuelos = totalPaginas;
        const inicio = (this.paginaActualVuelos - 1) * this.tamanoPaginaVuelos;
        const fin = inicio + this.tamanoPaginaVuelos;
        const vuelosPagina = vuelos.slice(inicio, fin);

        container.innerHTML = vuelosPagina.map(v => {
            const horaSalida = this.formatearHora12(v.fechaSalida);
            const horaLlegada = this.formatearHora12(v.fechaLlegada);
            const fechaStr = this.formatearFechaTexto(v.fechaSalida);
            const duracion = this.calcularDuracion(v.fechaSalida, v.fechaLlegada);
            const millas = Math.round(v.precioBase * 1.5);
            const precioFormatted = this.formatearPrecio(v.precioBase);

            const estadoLabel = v.estado || 'PROGRAMADO';
            const estadoBadgeColor = estadoLabel === 'PROGRAMADO' ? '#10B981' : (estadoLabel === 'EN_VUELO' ? '#001996' : (estadoLabel === 'COMPLETADO' ? '#6B697D' : '#EF4444'));

            // Categoría
            const cat = (v.categoria || 'ECONOMICO').toUpperCase();
            const catBadgeClass = cat === 'EJECUTIVO' ? 'cat-badge-ejecutivo' : (cat === 'PRIMERA_CLASE' ? 'cat-badge-primera' : 'cat-badge-economico');
            const catNombre = cat === 'EJECUTIVO' ? 'Ejecutivo' : (cat === 'PRIMERA_CLASE' ? 'Primera Clase' : 'Económico');

            // Escala
            const esConEscala = (v.tipoEscala === 'CON_ESCALA' || (v.ciudadEscala && v.ciudadEscala.trim() !== ''));
            const escalaBadgeClass = esConEscala ? 'escala-badge-layover' : 'escala-badge-directo';
            const escalaTexto = esConEscala ? `1 Escala en ${v.ciudadEscala || 'Ciudad intermedia'}` : 'Directo · Sin escalas';

            // Equipaje
            const equipajeTexto = v.equipajeInfo || (cat === 'EJECUTIVO' ? 'Maleta bodega (23 kg) + Cabina (10 kg)' : (cat === 'PRIMERA_CLASE' ? '2x Bodega (23 kg c/u) + Cabina' : 'Bolso de mano (5 kg)'));

            // Acciones para Administradores (Editar / Eliminar) adaptables
            const adminActionBtns = (this.rol === 'ROLE_ADMIN') ? `
                <button type="button" class="btn-clean-outline btn-flight-action" onclick="app.abrirModalEditarVuelo(${v.id})" title="Editar detalles de vuelo">
                    Editar Vuelo
                </button>
                <button type="button" class="btn-clean-outline btn-flight-action" onclick="app.eliminarVueloAdmin(${v.id}, '${v.numeroVuelo}')" style="color:#EF4444; border-color:#EF4444;" title="Eliminar vuelo del catálogo">
                    Eliminar
                </button>
            ` : '';

            return `
                <div class="latam-card-elevated mb-3">
                    <div class="latam-card-meta-bar">
                        <div class="latam-airline-pill">
                            <svg class="latam-mini-ribbon" viewBox="0 0 24 24" fill="none"><path d="M4 6C10 6 15 11 18 18C16 18 10 13 4 13Z" fill="#E8114B"/><path d="M8 3C14 3 18 7 21 14C19 14 14 10 8 10Z" fill="#FF0046"/></svg>
                            <strong>${v.nombreAerolinea || 'LATAM Airlines'}</strong>
                            <span class="latam-flight-number">· ${v.numeroVuelo}</span>
                            <span class="latam-aircraft-type">Airbus A320</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                            <span class="role-badge" style="background:${estadoBadgeColor}; color:white; font-size:0.7rem;">${estadoLabel}</span>
                        </div>
                    </div>

                    <!-- Timeline Limpio y Espacioso (No Deforme · 3 Columnas) -->
                    <div class="flight-ticket-inner">
                        <div class="time-airport-box">
                            <span class="ta-time">${horaSalida}</span>
                            <span class="ta-airport">${v.origen}</span>
                            <span class="ta-date">${fechaStr}</span>
                        </div>

                        <div class="flight-timeline-center">
                            <span class="ft-duration">${duracion}</span>
                            <div class="ft-route-line-wrap">
                                <span class="ft-dot"></span>
                                <svg class="ft-plane-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
                                <span class="ft-dot hollow"></span>
                            </div>
                            <span class="${escalaBadgeClass}">${escalaTexto}</span>
                        </div>

                        <div class="time-airport-box" style="text-align: right;">
                            <span class="ta-time">${horaLlegada}</span>
                            <span class="ta-airport">${v.destino}</span>
                            <span class="ta-date" style="color:#10B981; font-weight:700;">${v.asientosDisponibles} asientos disponibles</span>
                        </div>
                    </div>

                    <!-- Barra Inferior de Beneficios, Precio y Acciones Adaptables -->
                    <div class="latam-card-amenities-bar">
                        <div class="flight-card-badges-left">
                            <span class="latam-amenity-item" title="${v.equipajeInfo || equipajeTexto}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="7" width="12" height="13" rx="2"></rect><path d="M9 7V5a3 3 0 0 1 6 0v2"></path></svg>
                                ${equipajeTexto}
                            </span>
                            <span class="latam-amenity-item" style="color:#64748B;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                ${millas} Millas
                            </span>
                        </div>

                        <div class="flight-card-actions-right">
                            <div class="ft-card-price-display">
                                <span class="ft-price-from">Desde</span>
                                <span class="ft-price-val">${precioFormatted}</span>
                                <span class="ft-price-curr">${this.moneda} · Tasas inc.</span>
                            </div>

                            <div class="flight-admin-action-btns">
                                <button type="button" class="btn-clean-outline btn-flight-action" onclick="app.abrirCheckoutModalParaVuelo(${v.id})" style="border-color:var(--latam-indigo); color:var(--latam-indigo); font-weight:700;">
                                    Ver Asientos
                                </button>
                                ${adminActionBtns}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.renderPaginacion('paginationVuelos', totalVuelos, this.paginaActualVuelos, this.tamanoPaginaVuelos, 'cambiarPaginaVuelos', 'cambiarTamanoPaginaVuelos');
    }

    restablecerTodosLosFiltros() {
        this.filtroEstadoVuelo = 'TODOS';
        this.filtroCategoriaVuelo = 'TODOS';
        this.paginaActualVuelos = 1;
        this.filtroPrecioMax = 1000;
        this.ordenPrecio = 'default';
        document.querySelectorAll('#secModVuelos .status-chip-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
        document.querySelectorAll('.cat-pill-filter-grid .cat-pill-card').forEach((b, idx) => b.classList.toggle('active', idx === 0));
        const slider = document.getElementById('sliderPrecioMaximo');
        if (slider) slider.value = 1000;
        const lbl = document.getElementById('lblPriceFilterDisplay');
        if (lbl) lbl.innerText = `Hasta ${this.formatearPrecio(1000)}`;
        this.cargarVuelos();
    }

    // GESTIÓN ADMIN: PROGRAMAR NUEVO VUELO
    abrirModalCrearVuelo() {
        if (this.rol !== 'ROLE_ADMIN') {
            this.toast('Solo usuarios con rol ROLE_ADMIN pueden programar nuevos vuelos.', 'warning');
            return;
        }
        this.alCambiarMonedaForm('crear');
        this.alCambiarCategoriaForm('crear');
        this.alCambiarTipoEscala('crear');
        document.getElementById('modalCrearVuelo').style.display = 'flex';
    }

    cerrarModalCrearVuelo() {
        document.getElementById('modalCrearVuelo').style.display = 'none';
    }

    alCambiarMonedaForm(tipo) {
        const sel = document.getElementById(tipo === 'crear' ? 'nvMoneda' : 'editVueloMoneda');
        const lbl = document.getElementById(tipo === 'crear' ? 'lblNvPrecioBase' : 'lblEditPrecioBase');
        if (sel && lbl) {
            lbl.innerText = sel.value === 'USD' ? 'Precio Base ($ USD) *' : 'Precio Base (S/ PEN) *';
        }
    }

    alCambiarCategoriaForm(tipo) {
        const cat = document.getElementById(tipo === 'crear' ? 'nvCategoria' : 'editVueloCategoria')?.value;
        const inputEq = document.getElementById(tipo === 'crear' ? 'nvEquipajeInfo' : 'editVueloEquipajeInfo');
        if (!inputEq) return;

        if (cat === 'ECONOMICO') {
            inputEq.value = 'Bolso de mano / Equipaje 5 kg incluido';
        } else if (cat === 'EJECUTIVO') {
            inputEq.value = 'Maleta en bodega (23 kg) + Equipaje de mano (10 kg)';
        } else if (cat === 'PRIMERA_CLASE') {
            inputEq.value = '2x Maletas en bodega (23 kg c/u) + Cabina (10 kg) + Asiento Cama Premium';
        }
    }

    alCambiarTipoEscala(tipo) {
        const val = document.getElementById(tipo === 'crear' ? 'nvTipoEscala' : 'editVueloTipoEscala')?.value;
        const box = document.getElementById(tipo === 'crear' ? 'nvContenedorCiudadEscala' : 'editContenedorCiudadEscala');
        if (box) {
            box.style.display = (val === 'CON_ESCALA') ? 'block' : 'none';
        }
    }

    async ejecutarCrearVuelo(e) {
        e.preventDefault();
        if (this.rol !== 'ROLE_ADMIN') return;

        const numeroVuelo = document.getElementById('nvNumeroVuelo').value.trim();
        const origen = document.getElementById('nvOrigen').value.trim();
        const destino = document.getElementById('nvDestino').value.trim();
        const fechaSalida = document.getElementById('nvFechaSalida').value;
        const fechaLlegada = document.getElementById('nvFechaLlegada').value;
        const moneda = document.getElementById('nvMoneda').value;
        const precioBase = parseFloat(document.getElementById('nvPrecioBase').value);
        const capacidadAsientos = parseInt(document.getElementById('nvCapacidad').value);
        const categoria = document.getElementById('nvCategoria').value;
        const tipoEscala = document.getElementById('nvTipoEscala').value;
        const ciudadEscala = (tipoEscala === 'CON_ESCALA') ? document.getElementById('nvCiudadEscala').value : null;
        const equipajeInfo = document.getElementById('nvEquipajeInfo').value.trim();

        const payload = {
            numeroVuelo,
            origen,
            destino,
            fechaSalida: fechaSalida + ':00',
            fechaLlegada: fechaLlegada + ':00',
            precioBase,
            capacidadAsientos,
            asientosDisponibles: capacidadAsientos,
            idAerolinea: 1,
            estado: 'PROGRAMADO',
            categoria,
            tipoEscala,
            ciudadEscala,
            equipajeInfo,
            moneda
        };

        try {
            const res = await this.authFetch(`${API_BASE}/vuelos`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                this.toast(data.mensaje || 'Error al programar el vuelo.', 'error');
                return;
            }

            this.toast(`Vuelo ${data.numeroVuelo} (${categoria}) programado exitosamente.`, 'success');
            this.cerrarModalCrearVuelo();
            this.cargarVuelos();

        } catch (err) {
            this.toast('Error de red al registrar vuelo.', 'error');
            console.error(err);
        }
    }

    abrirModalEditarVuelo(id) {
        if (this.rol !== 'ROLE_ADMIN') return;
        const v = this.vuelos.find(vue => vue.id === id);
        if (!v) return;

        document.getElementById('editVueloId').value = v.id;
        document.getElementById('editVueloNumero').value = v.numeroVuelo;
        document.getElementById('editVueloOrigen').value = v.origen;
        document.getElementById('editVueloDestino').value = v.destino;
        document.getElementById('editVueloFechaSalida').value = v.fechaSalida ? v.fechaSalida.substring(0, 16) : '';
        document.getElementById('editVueloFechaLlegada').value = v.fechaLlegada ? v.fechaLlegada.substring(0, 16) : '';
        document.getElementById('editVueloMoneda').value = v.moneda || 'PEN';
        document.getElementById('editVueloPrecioBase').value = v.precioBase;
        document.getElementById('editVueloCapacidad').value = v.capacidadAsientos;
        document.getElementById('editVueloCategoria').value = v.categoria || 'ECONOMICO';
        document.getElementById('editVueloTipoEscala').value = v.tipoEscala || 'DIRECTO';
        
        const contEscala = document.getElementById('editContenedorCiudadEscala');
        if (contEscala) {
            contEscala.style.display = (v.tipoEscala === 'CON_ESCALA') ? 'block' : 'none';
        }
        if (v.ciudadEscala) {
            document.getElementById('editVueloCiudadEscala').value = v.ciudadEscala;
        }
        document.getElementById('editVueloEquipajeInfo').value = v.equipajeInfo || 'Bolso de mano incluido (5 kg)';
        document.getElementById('editVueloEstado').value = v.estado || 'PROGRAMADO';
        this.alCambiarMonedaForm('editar');

        document.getElementById('modalEditarVuelo').style.display = 'flex';
    }

    cerrarModalEditarVuelo() {
        document.getElementById('modalEditarVuelo').style.display = 'none';
    }

    async ejecutarGuardarEdicionVuelo(e) {
        e.preventDefault();
        if (this.rol !== 'ROLE_ADMIN') return;

        const id = document.getElementById('editVueloId').value;
        const tipoEscala = document.getElementById('editVueloTipoEscala').value;
        const ciudadEscala = (tipoEscala === 'CON_ESCALA') ? document.getElementById('editVueloCiudadEscala').value : null;

        const payload = {
            numeroVuelo: document.getElementById('editVueloNumero').value.trim(),
            origen: document.getElementById('editVueloOrigen').value.trim(),
            destino: document.getElementById('editVueloDestino').value.trim(),
            fechaSalida: document.getElementById('editVueloFechaSalida').value + ':00',
            fechaLlegada: document.getElementById('editVueloFechaLlegada').value + ':00',
            moneda: document.getElementById('editVueloMoneda').value,
            precioBase: parseFloat(document.getElementById('editVueloPrecioBase').value),
            capacidadAsientos: parseInt(document.getElementById('editVueloCapacidad').value),
            categoria: document.getElementById('editVueloCategoria').value,
            tipoEscala,
            ciudadEscala,
            equipajeInfo: document.getElementById('editVueloEquipajeInfo').value.trim(),
            idAerolinea: 1,
            estado: document.getElementById('editVueloEstado').value
        };

        try {
            const res = await this.authFetch(`${API_BASE}/vuelos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                this.toast(data.mensaje || 'Error al actualizar vuelo.', 'error');
                return;
            }
            this.toast(`Vuelo ${data.numeroVuelo} actualizado exitosamente.`, 'success');
            this.cerrarModalEditarVuelo();
            this.cargarVuelos();
        } catch (err) {
            this.toast('Error de red al actualizar vuelo.', 'error');
            console.error(err);
        }
    }

    async eliminarVueloAdmin(id, numero) {
        if (this.rol !== 'ROLE_ADMIN') {
            this.toast('Solo el Administrador puede eliminar vuelos.', 'warning');
            return;
        }
        if (!confirm(`¿Confirmas la eliminación del vuelo ${numero}?\nSolo procederá si no tiene reservas activas.`)) return;

        try {
            const res = await this.authFetch(`${API_BASE}/vuelos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.toast(`Vuelo ${numero} eliminado exitosamente.`, 'success');
                this.cargarVuelos();
            } else {
                this.toast('No se puede eliminar el vuelo porque cuenta con reservas registradas.', 'error');
            }
        } catch (err) {
            this.toast('Error al eliminar vuelo.', 'error');
        }
    }

    // ============================================================
    // MÓDULO 2: CLIENTES / PASAJEROS (REGISTRO Y LISTA EN MYSQL)
    // ============================================================
    async cargarPasajeros() {
        if (!this.token) return;

        try {
            const res = await this.authFetch(`${API_BASE}/pasajeros`);
            if (res.ok) {
                this.pasajeros = await res.json();
                this.renderizarTablaPasajeros(this.pasajeros);
                this.llenarDropdownsEmision();

                const lbl = document.getElementById('lblTotalPasajerosCount');
                if (lbl) lbl.innerText = this.pasajeros.length;
            }
        } catch (err) {
            console.error('Error cargando pasajeros:', err);
        }
    }

    cambiarPaginaPasajeros(pag) {
        this.paginaActualPasajeros = pag;
        this.renderizarTablaPasajeros(this.pasajerosFiltrados || this.pasajeros);
    }

    cambiarTamanoPaginaPasajeros(tam) {
        this.tamanoPaginaPasajeros = tam;
        this.paginaActualPasajeros = 1;
        this.renderizarTablaPasajeros(this.pasajerosFiltrados || this.pasajeros);
    }

    renderizarTablaPasajeros(pasajeros) {
        const tbody = document.getElementById('tbodyListaPasajeros');
        if (!tbody) return;

        this.pasajerosFiltrados = pasajeros || [];
        const totalPasajeros = this.pasajerosFiltrados.length;

        if (totalPasajeros === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No se encontraron pasajeros para este criterio.</td></tr>';
            this.renderPaginacion('paginationPasajeros', 0, 1, this.tamanoPaginaPasajeros, 'cambiarPaginaPasajeros', 'cambiarTamanoPaginaPasajeros');
            return;
        }

        const totalPaginas = Math.ceil(totalPasajeros / this.tamanoPaginaPasajeros) || 1;
        if (this.paginaActualPasajeros > totalPaginas) this.paginaActualPasajeros = totalPaginas;
        const inicio = (this.paginaActualPasajeros - 1) * this.tamanoPaginaPasajeros;
        const fin = inicio + this.tamanoPaginaPasajeros;
        const pasajerosPagina = this.pasajerosFiltrados.slice(inicio, fin);

        tbody.innerHTML = pasajerosPagina.map(p => {
            const adminDel = (this.rol === 'ROLE_ADMIN') ? `
                <button type="button" class="btn-clean-outline btn-sm" onclick="app.eliminarPasajeroAdmin(${p.id}, '${p.nombres}')" style="color:#EF4444; border-color:#EF4444; padding:0.25rem 0.5rem; font-size:0.75rem;">
                    Eliminar
                </button>
            ` : '';

            return `
                <tr>
                    <td><strong>#${p.id}</strong></td>
                    <td><strong>${p.nombres} ${p.apellidos}</strong></td>
                    <td><span class="role-badge" style="background:#F1EFFB; color:var(--latam-indigo);">${p.docIdentidad}</span></td>
                    <td>${p.nacionalidad || 'Peruana'}</td>
                    <td>${p.telefono || '-'}</td>
                    <td>${p.email}</td>
                    <td>
                        <div style="display:flex; gap:0.4rem; align-items:center;">
                            <button type="button" class="btn-clean-outline btn-sm" onclick="app.abrirModalEditarPasajero(${p.id})" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
                                Editar
                            </button>
                            ${adminDel}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        this.renderPaginacion('paginationPasajeros', totalPasajeros, this.paginaActualPasajeros, this.tamanoPaginaPasajeros, 'cambiarPaginaPasajeros', 'cambiarTamanoPaginaPasajeros');
    }

    alFiltrarPasajeros(texto) {
        this.filtroPasajeroTexto = (texto || '').toLowerCase().trim();
        this.paginaActualPasajeros = 1;
        if (!this.filtroPasajeroTexto) {
            this.renderizarTablaPasajeros(this.pasajeros);
            return;
        }
        const filtrados = this.pasajeros.filter(p =>
            (p.nombres + ' ' + p.apellidos).toLowerCase().includes(this.filtroPasajeroTexto) ||
            p.docIdentidad.toLowerCase().includes(this.filtroPasajeroTexto) ||
            p.email.toLowerCase().includes(this.filtroPasajeroTexto)
        );
        this.renderizarTablaPasajeros(filtrados);
    }

    abrirModalEditarPasajero(id) {
        const p = this.pasajeros.find(pas => pas.id === id);
        if (!p) return;
        document.getElementById('editPasId').value = p.id;
        document.getElementById('editPasNombres').value = p.nombres;
        document.getElementById('editPasApellidos').value = p.apellidos;
        document.getElementById('editPasDni').value = p.docIdentidad;
        document.getElementById('editPasNacionalidad').value = p.nacionalidad || 'Peruana';
        document.getElementById('editPasTelefono').value = p.telefono || '';
        document.getElementById('editPasEmail').value = p.email;
        document.getElementById('modalEditarPasajero').style.display = 'flex';
    }

    cerrarModalEditarPasajero() {
        document.getElementById('modalEditarPasajero').style.display = 'none';
    }

    async ejecutarGuardarEdicionPasajero(e) {
        e.preventDefault();
        const id = document.getElementById('editPasId').value;
        const payload = {
            nombres: document.getElementById('editPasNombres').value.trim(),
            apellidos: document.getElementById('editPasApellidos').value.trim(),
            docIdentidad: document.getElementById('editPasDni').value.trim(),
            nacionalidad: document.getElementById('editPasNacionalidad').value.trim(),
            telefono: document.getElementById('editPasTelefono').value.trim(),
            email: document.getElementById('editPasEmail').value.trim()
        };

        try {
            const res = await this.authFetch(`${API_BASE}/pasajeros/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                this.toast(data.mensaje || 'Error al actualizar pasajero.', 'error');
                return;
            }
            this.toast(`Pasajero ${data.nombres} ${data.apellidos} actualizado exitosamente.`, 'success');
            this.cerrarModalEditarPasajero();
            this.cargarPasajeros();
        } catch (err) {
            this.toast('Error de red al actualizar pasajero.', 'error');
            console.error(err);
        }
    }

    async eliminarPasajeroAdmin(id, nombre) {
        if (this.rol !== 'ROLE_ADMIN') {
            this.toast('Solo el Administrador puede eliminar pasajeros.', 'warning');
            return;
        }
        if (!confirm(`¿Confirmas la eliminación del pasajero ${nombre}?`)) return;

        try {
            const res = await this.authFetch(`${API_BASE}/pasajeros/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.toast(`Pasajero ${nombre} eliminado del sistema.`, 'success');
                this.cargarPasajeros();
            } else {
                this.toast('No se puede eliminar el pasajero porque cuenta con reservas asociadas.', 'error');
            }
        } catch (err) {
            this.toast('Error al eliminar pasajero.', 'error');
        }
    }

    async ejecutarRegistrarPasajero(e) {
        e.preventDefault();
        const nombres = document.getElementById('regPasNombres').value.trim();
        const apellidos = document.getElementById('regPasApellidos').value.trim();
        const docIdentidad = document.getElementById('regPasDni').value.trim();
        const nacionalidad = document.getElementById('regPasNacionalidad').value.trim();
        const telefono = document.getElementById('regPasTelefono').value.trim();
        const email = document.getElementById('regPasEmail').value.trim();

        const payload = {
            nombres,
            apellidos,
            docIdentidad,
            nacionalidad: nacionalidad || 'Peruana',
            telefono,
            email
        };

        try {
            const res = await this.authFetch(`${API_BASE}/pasajeros`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                this.toast(data.mensaje || 'Error al registrar pasajero.', 'error');
                return;
            }

            this.toast(`Pasajero ${data.nombres} ${data.apellidos} registrado exitosamente.`, 'success');
            document.getElementById('formRegistrarPasajero').reset();
            this.cargarPasajeros();

        } catch (err) {
            this.toast('Error al comunicarse con el servidor de pasajeros.', 'error');
            console.error(err);
        }
    }

    seleccionarPasajeroParaEmision(id) {
        this.cambiarModuloOps('emision');
        const sel = document.getElementById('emiSelectPasajero');
        if (sel) {
            sel.value = id;
            this.alCambiarPasajeroEmision();
        }
    }

    seleccionarVueloParaEmision(id) {
        this.cambiarModuloOps('emision');
        const sel = document.getElementById('emiSelectVuelo');
        if (sel) {
            sel.value = id;
            this.alCambiarVueloEmision();
        }
    }

    abrirModalCrearPasajeroDesdeEmision() {
        const m = document.getElementById('modalCrearPasajeroRapido');
        if (m) {
            m.style.display = 'flex';
            const f = document.getElementById('formCrearPasajeroRapido');
            if (f) f.reset();
            const nac = document.getElementById('rapPasNacionalidad');
            if (nac) nac.value = 'Peruana';
            setTimeout(() => {
                const fn = document.getElementById('rapPasNombres');
                if (fn) fn.focus();
            }, 60);
        }
    }

    cerrarModalCrearPasajeroDesdeEmision() {
        const m = document.getElementById('modalCrearPasajeroRapido');
        if (m) m.style.display = 'none';
    }

    async ejecutarCrearPasajeroDesdeEmision(event) {
        if (event) event.preventDefault();
        const nombres = document.getElementById('rapPasNombres')?.value?.trim();
        const apellidos = document.getElementById('rapPasApellidos')?.value?.trim();
        const docIdentidad = document.getElementById('rapPasDni')?.value?.trim();
        const nacionalidad = document.getElementById('rapPasNacionalidad')?.value?.trim() || 'Peruana';
        const telefono = document.getElementById('rapPasTelefono')?.value?.trim() || '987654321';
        const email = document.getElementById('rapPasEmail')?.value?.trim();

        if (!nombres || !apellidos || !docIdentidad || !email) {
            this.toast('Por favor completa todos los campos requeridos (*).', 'warning');
            return;
        }

        try {
            const payload = {
                nombres,
                apellidos,
                docIdentidad,
                nacionalidad,
                telefono,
                email
            };

            const res = await this.authFetch(`${API_BASE}/pasajeros`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                this.toast(data.mensaje || 'Error al registrar nuevo cliente.', 'error');
                return;
            }

            this.toast(`Cliente ${data.nombres} ${data.apellidos} registrado exitosamente.`, 'success');
            this.cerrarModalCrearPasajeroDesdeEmision();

            // Recargar lista completa de pasajeros y poblar selectores
            await this.cargarPasajeros();

            // Seleccionar automáticamente el cliente recién creado en Emisión
            const selPas = document.getElementById('emiSelectPasajero');
            if (selPas && data.id) {
                selPas.value = data.id;
                this.alCambiarPasajeroEmision();
            }
        } catch (err) {
            this.toast('Error de conexión al registrar cliente.', 'error');
            console.error(err);
        }
    }

    // ============================================================
    // MÓDULO 3: EMISIÓN DINÁMICA DE PASAJES (CONSIGNA OFICIAL)
    // ============================================================
    llenarDropdownsEmision() {
        const selPas = document.getElementById('emiSelectPasajero');
        const selVue = document.getElementById('emiSelectVuelo');

        if (selPas) {
            const actual = selPas.value;
            selPas.innerHTML = '<option value="">-- Seleccionar Pasajero Registrado --</option>' +
                this.pasajeros.map(p => `
                    <option value="${p.id}">${p.nombres} ${p.apellidos} (DNI: ${p.docIdentidad})</option>
                `).join('');
            if (actual) selPas.value = actual;
        }

        if (selVue) {
            const actualVue = selVue.value;
            selVue.innerHTML = '<option value="">-- Seleccionar Vuelo Comercial --</option>' +
                this.vuelos.map(v => `
                    <option value="${v.id}">${v.numeroVuelo} · ${v.origen} &rarr; ${v.destino} · ${this.formatearPrecio(v.precioBase)} (${v.asientosDisponibles} disp)</option>
                `).join('');
            if (actualVue) selVue.value = actualVue;
        }

        const inputAsientos = document.getElementById('inputAsientosTexto');
        if (inputAsientos && !this.asientosSeleccionados.size) {
            inputAsientos.value = '';
        }

        this.recalcularTotalesEmision();
    }

    alCambiarPasajeroEmision() {
        this.recalcularTotalesEmision();
    }

    async alCambiarVueloEmision() {
        const selVue = document.getElementById('emiSelectVuelo');
        const vueloId = parseInt(selVue?.value);
        if (!vueloId) {
            this.vueloSeleccionado = null;
            this.detenerTemporizadorHold();
            this.recalcularTotalesEmision();
            return;
        }
        this.vueloSeleccionado = this.vuelos.find(v => v.id === vueloId) || null;
        await this.cargarAsientosOcupados(vueloId);
        this.iniciarTemporizadorHold();
        this.recalcularTotalesEmision();
    }

    alCambiarClaseEmision() {
        this.claseSeleccionada = document.getElementById('emiSelectClase').value;
        this.recalcularTotalesEmision();
    }

    async cargarAsientosOcupados(vueloId) {
        try {
            const res = await fetch(`${API_BASE}/vuelos/${vueloId}/asientos-ocupados`);
            if (res.ok) {
                const ocupados = await res.json();
                this.asientosOcupadosVueloActual = new Set(ocupados.map(s => s.toUpperCase().trim()));
            }
        } catch (err) {
            console.warn('Error al verificar asientos ocupados:', err);
        }
    }

    iniciarTemporizadorHold() {
        this.detenerTemporizadorHold();
        this.timerHoldSeconds = 180; // 3 minutos para retención y proceso de pago
        const banner = document.getElementById('emisionHoldTimerBanner');
        const clock = document.getElementById('holdTimerClockDisplay');
        const gatewayClock = document.getElementById('gatewayHoldTimerClock');
        if (banner) banner.style.display = 'flex';

        const actualizarDisplays = () => {
            const mins = Math.floor(this.timerHoldSeconds / 60);
            const secs = this.timerHoldSeconds % 60;
            const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            if (clock) clock.innerText = formatted;
            if (gatewayClock) gatewayClock.innerText = formatted;
        };

        actualizarDisplays();

        this.timerHoldInterval = setInterval(() => {
            this.timerHoldSeconds--;
            actualizarDisplays();

            if (this.timerHoldSeconds <= 0) {
                this.detenerTemporizadorHold();
                this.toast('El tiempo de bloqueo de 3 minutos para el pago ha expirado. Los asientos han sido liberados.', 'warning');
                const inputAsientos = document.getElementById('inputAsientosTexto');
                if (inputAsientos) inputAsientos.value = '';
                this.asientosSeleccionados.clear();
                this.recalcularTotalesEmision();

                // Cerrar pasarela y checkout si están abiertos al vencer el tiempo de bloqueo
                this.cerrarPasarelaPago();
                this.cerrarModalCheckout();
                this.reservaPendienteParaPagar = null;
            }
        }, 1000);
    }

    detenerTemporizadorHold() {
        if (this.timerHoldInterval) {
            clearInterval(this.timerHoldInterval);
            this.timerHoldInterval = null;
        }
        const banner = document.getElementById('emisionHoldTimerBanner');
        if (banner) banner.style.display = 'none';
        const gatewayClock = document.getElementById('gatewayHoldTimerClock');
        if (gatewayClock) gatewayClock.innerText = '03:00';
        const clock = document.getElementById('holdTimerClockDisplay');
        if (clock) clock.innerText = '03:00';
    }

    alCambiarAsientosEmision() {
        const txt = document.getElementById('inputAsientosTexto').value;
        const array = txt.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);

        // Verificar colisión con asientos ya ocupados en la BD
        const ocupadosEncontrados = array.filter(s => this.asientosOcupadosVueloActual.has(s));
        if (ocupadosEncontrados.length > 0) {
            this.toast(`El asiento ${ocupadosEncontrados.join(', ')} ya está reservado por otro cliente.`, 'error');
        }

        this.asientosSeleccionados = new Set(array);
        if (array.length > 0 && !this.timerHoldInterval) {
            this.iniciarTemporizadorHold();
        }
        this.recalcularTotalesEmision();
    }

    recalcularTotalesEmision() {
        const selVue = document.getElementById('emiSelectVuelo');
        const btnPay = document.getElementById('btnPagarConPasarelaEmision');
        const btnDirect = document.getElementById('btnEmitirDirectoEmision');

        const vueloId = parseInt(selVue?.value);
        const vuelo = this.vuelos.find(v => v.id === vueloId);

        const txt = document.getElementById('inputAsientosTexto')?.value || '';
        const array = txt.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
        const count = array.length;

        if (!vuelo || count === 0) {
            document.getElementById('emiLblPrecioBase').innerText = this.formatearPrecio(vuelo ? vuelo.precioBase : 0);
            document.getElementById('emiLblFactorClase').innerText = '1.0x (Estándar)';
            document.getElementById('emiLblCantidadAsientos').innerText = '0 asientos seleccionados';
            document.getElementById('emiLblSubtotal').innerText = this.formatearPrecio(0);
            document.getElementById('emiLblImpuestos').innerText = this.formatearPrecio(0);
            document.getElementById('emiLblTotalFinal').innerText = this.formatearPrecio(0);

            if (btnPay) {
                btnPay.disabled = true;
                btnPay.innerHTML = '<span>Pagar con Pasarela (LATAM Pay)</span>';
            }
            if (btnDirect) {
                btnDirect.disabled = true;
                btnDirect.innerHTML = '<span>Emisión Directa de Pasaje</span>';
            }
            return;
        }

        this.vueloSeleccionado = vuelo;
        const clase = document.getElementById('emiSelectClase')?.value || 'ECONOMICA';
        let factor = 1.0;
        if (clase === 'EXECUTIVA') factor = 1.5;
        if (clase === 'FIRST_CLASS') factor = 2.0;

        const precioUnitario = vuelo.precioBase * factor;
        const subtotal = precioUnitario * count;
        const impuestos = subtotal * 0.18;
        const total = subtotal + impuestos;
        this.montoTotalPago = total;

        document.getElementById('emiLblPrecioBase').innerText = this.formatearPrecio(vuelo.precioBase);
        document.getElementById('emiLblFactorClase').innerText = `${factor.toFixed(1)}x (${clase})`;
        document.getElementById('emiLblCantidadAsientos').innerText = `${count} asiento(s) [${array.join(', ')}]`;
        document.getElementById('emiLblSubtotal').innerText = this.formatearPrecio(subtotal);
        document.getElementById('emiLblImpuestos').innerText = this.formatearPrecio(impuestos);
        document.getElementById('emiLblTotalFinal').innerText = this.formatearPrecio(total);

        if (btnPay) {
            btnPay.disabled = false;
            btnPay.innerHTML = `<span>Pagar con Pasarela (${this.formatearPrecio(total)})</span>`;
        }
        if (btnDirect) {
            btnDirect.disabled = false;
            btnDirect.innerHTML = `<span>Emisión Directa de Pasaje (${this.formatearPrecio(total)})</span>`;
        }
    }

    limpiarFormularioEmision() {
        const selPas = document.getElementById('emiSelectPasajero');
        const selVue = document.getElementById('emiSelectVuelo');
        const selClase = document.getElementById('emiSelectClase');
        const txtAsientos = document.getElementById('inputAsientosTexto');
        const selEstado = document.getElementById('emiSelectEstadoPago');

        if (selPas) selPas.value = '';
        if (selVue) selVue.value = '';
        if (selClase) selClase.value = 'ECONOMICA';
        if (txtAsientos) txtAsientos.value = '';
        if (selEstado) selEstado.value = 'PAGADO';

        this.vueloSeleccionado = null;
        this.asientosSeleccionados.clear();
        this.detenerTemporizadorHold();

        const banner = document.getElementById('emisionHoldTimerBanner');
        if (banner) banner.style.display = 'none';

        const badges = document.getElementById('selectedSeatsBadges');
        if (badges) badges.innerHTML = '<span class="text-muted-sm">Ninguno</span>';

        this.recalcularTotalesEmision();
    }

    abrirMapaCabinaDesdeEmision() {
        if (!this.vueloSeleccionado && this.vuelos.length > 0) {
            this.vueloSeleccionado = this.vuelos[0];
        }
        if (this.vueloSeleccionado) {
            this.abrirCheckoutModalParaVuelo(this.vueloSeleccionado.id);
        }
    }

    async ejecutarEmisionDesdeModulo(conPasarela = false) {
        if (!this.token) {
            this.toast('Debes iniciar sesión con rol AGENTE o ADMIN para emitir pasajes.', 'warning');
            this.abrirModalLogin();
            return;
        }

        const selPas = document.getElementById('emiSelectPasajero');
        const selVue = document.getElementById('emiSelectVuelo');

        if (!selPas || !selVue) return;

        const idPasajero = parseInt(selPas.value);
        const idVuelo = parseInt(selVue.value);
        const vuelo = this.vuelos.find(v => v.id === idVuelo);

        if (!vuelo) {
            this.toast('Selecciona un vuelo válido.', 'warning');
            return;
        }

        const txtAsientos = document.getElementById('inputAsientosTexto').value;
        const arrayAsientos = txtAsientos.split(',').map(s => s.trim().toUpperCase()).filter(s => s.length > 0);

        if (arrayAsientos.length === 0) {
            this.toast('Debes ingresar al menos un número de asiento (ej. 12A, 12B).', 'warning');
            return;
        }

        if (arrayAsientos.length > vuelo.asientosDisponibles) {
            this.toast(`El vuelo solo cuenta con ${vuelo.asientosDisponibles} asientos disponibles.`, 'error');
            return;
        }

        this.asientosSeleccionados = new Set(arrayAsientos);
        this.vueloSeleccionado = vuelo;
        this.claseSeleccionada = document.getElementById('emiSelectClase').value;

        // Si elige pagar con pasarela interactiva:
        if (conPasarela) {
            const pasajero = this.pasajeros.find(p => p.id === idPasajero);
            if (pasajero) {
                if (document.getElementById('chkNombres')) document.getElementById('chkNombres').value = pasajero.nombres;
                if (document.getElementById('chkApellidos')) document.getElementById('chkApellidos').value = pasajero.apellidos;
                if (document.getElementById('chkDni')) document.getElementById('chkDni').value = pasajero.docIdentidad;
                if (document.getElementById('chkEmail')) document.getElementById('chkEmail').value = pasajero.email;
            }
            this.abrirPasarelaPago();
            return;
        }

        // Emisión directa:
        const estadoPago = document.getElementById('emiSelectEstadoPago').value;
        const detalles = arrayAsientos.map(asiento => ({
            numeroAsiento: asiento,
            clase: this.claseSeleccionada,
            precioUnitario: vuelo.precioBase
        }));

        const payload = {
            idPasajero,
            idVuelo,
            estadoPago,
            detalles
        };

        try {
            this.toast('Procesando transacción atómica de pasajes...', 'info');

            const res = await this.authFetch(`${API_BASE}/reservas`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                this.toast(data.mensaje || 'Error en la emisión del pasaje.', 'error');
                return;
            }

            this.toast(`Pasaje emitido con éxito. Código PNR: ${data.codigoReserva}`, 'success');
            this.limpiarFormularioEmision();
            this.mostrarModalBoardingPass(data);
            this.cargarVuelos();
            this.cargarHistorialReservas();

        } catch (err) {
            this.toast('Error de red al emitir la reserva.', 'error');
            console.error(err);
        }
    }

    // ============================================================
    // MAPA DE CABINA 3D (AIRBUS A320) - SOLO CONSULTA DE ASIENTOS
    // ============================================================
    async abrirCheckoutModalParaVuelo(vueloId) {
        const vuelo = this.vuelos.find(v => v.id === vueloId);
        if (!vuelo) return;

        this.vueloSeleccionado = vuelo;

        // Cargar asientos ocupados en tiempo real desde la BD
        await this.cargarAsientosOcupados(vueloId);

        // Header del modal con datos de vuelo
        const tituloEl = document.getElementById('vaModalTitulo');
        if (tituloEl) tituloEl.innerText = `Asientos · Vuelo ${vuelo.numeroVuelo} (${vuelo.nombreAerolinea || 'LATAM'})`;

        const subEl = document.getElementById('vaModalSubtitulo');
        if (subEl) subEl.innerText = `${vuelo.origen} → ${vuelo.destino} · Salida: ${this.formatearFechaTexto(vuelo.fechaSalida)} (${this.formatearHora12(vuelo.fechaSalida)})`;

        const detailsEl = document.getElementById('vaFlightDetailsText');
        if (detailsEl) {
            detailsEl.innerText = `Ruta: ${vuelo.origen} a ${vuelo.destino} · Categoría: ${vuelo.categoria || 'ECONOMICO'} · Capacidad Total: ${vuelo.capacidadAsientos || 150} asientos.`;
        }

        const cockpitEl = document.getElementById('vaCockpitLabel');
        if (cockpitEl) {
            cockpitEl.innerText = `Cabina de Pasajeros Airbus A320 · ${vuelo.numeroVuelo}`;
        }

        this.construirMatrizCabina(vuelo);
        this.actualizarBadgesAsientos();

        document.getElementById('modalCheckoutBooking').style.display = 'flex';
    }

    cerrarModalCheckout() {
        document.getElementById('modalCheckoutBooking').style.display = 'none';
        // Sincronizar asientos seleccionados en el input del módulo emisión
        const inputAsientos = document.getElementById('inputAsientosTexto');
        if (inputAsientos && this.asientosSeleccionados.size > 0) {
            inputAsientos.value = Array.from(this.asientosSeleccionados).join(', ');
            this.recalcularTotalesEmision();
        }
    }

    construirMatrizCabina(vuelo) {
        const matrix = document.getElementById('cabinSeatsMatrix');
        if (!matrix) return;
        matrix.innerHTML = '';

        const filas = 8;
        const colsIzq = ['A', 'B', 'C'];
        const colsDer = ['D', 'E', 'F'];
        const ocupadosTotal = new Set([...this.asientosOcupadosVueloActual]);
        if (ocupadosTotal.size === 0) {
            ocupadosTotal.add('1B');
            ocupadosTotal.add('2E');
            ocupadosTotal.add('4A');
        }

        // Actualizar contador en tiempo real de comprados y disponibles
        const totalAsientosCabina = filas * (colsIzq.length + colsDer.length); // 48
        const compradosCount = ocupadosTotal.size;
        const disponiblesCount = Math.max(0, totalAsientosCabina - compradosCount);
        const counterEl = document.getElementById('vaSeatsCounter');
        if (counterEl) {
            counterEl.innerHTML = `<span style="color:#DC2626;">${compradosCount} Comprados</span> &bull; <span style="color:#047857;">${disponiblesCount} Disponibles</span>`;
        }

        for (let f = 1; f <= filas; f++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-cabin-row';

            const numSpan = document.createElement('span');
            numSpan.className = 'sc-num';
            numSpan.innerText = f;
            rowDiv.appendChild(numSpan);

            colsIzq.forEach(col => {
                const code = `${f}${col}`;
                rowDiv.appendChild(this.crearBotonCabina(code, ocupadosTotal.has(code)));
            });

            const aisleSpan = document.createElement('span');
            aisleSpan.className = 'sc-aisle';
            aisleSpan.innerText = '||';
            rowDiv.appendChild(aisleSpan);

            colsDer.forEach(col => {
                const code = `${f}${col}`;
                rowDiv.appendChild(this.crearBotonCabina(code, ocupadosTotal.has(code)));
            });

            matrix.appendChild(rowDiv);
        }
    }

    crearBotonCabina(code, isOccupied) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-cabin-seat';
        btn.id = `cabinBtn_${code}`;
        btn.innerText = code;
        btn.setAttribute('data-seat-id', code);

        if (isOccupied) {
            btn.disabled = true;
            btn.classList.add('occupied');
            btn.title = `Asiento ${code} - Comprado / Ocupado`;
            btn.style.background = '#FEE2E2';
            btn.style.borderColor = '#FCA5A5';
            btn.style.color = '#DC2626';
            btn.style.cursor = 'not-allowed';
            btn.style.textDecoration = 'line-through';
        } else {
            btn.classList.add('available');
            btn.title = `Asiento ${code} - Disponible`;
            btn.style.background = '#ECFDF5';
            btn.style.borderColor = '#6EE7B7';
            btn.style.color = '#047857';

            if (this.asientosSeleccionados.has(code)) {
                btn.classList.add('selected');
                btn.style.background = 'var(--latam-red)';
                btn.style.borderColor = 'var(--latam-red)';
                btn.style.color = '#FFFFFF';
                btn.style.textDecoration = 'none';
            }

            btn.onclick = () => this.toggleAsientoClick(code);
        }
        return btn;
    }

    toggleAsientoClick(code) {
        const btn = document.getElementById(`cabinBtn_${code}`);

        if (this.asientosSeleccionados.has(code)) {
            this.asientosSeleccionados.delete(code);
            if (btn) {
                btn.classList.remove('selected');
                btn.style.background = '#ECFDF5';
                btn.style.borderColor = '#6EE7B7';
                btn.style.color = '#047857';
            }
        } else {
            if (this.vueloSeleccionado && this.asientosSeleccionados.size >= this.vueloSeleccionado.asientosDisponibles) {
                this.toast(`El vuelo solo cuenta con ${this.vueloSeleccionado.asientosDisponibles} asientos disponibles.`, 'warning');
                return;
            }
            this.asientosSeleccionados.add(code);
            if (btn) {
                btn.classList.add('selected');
                btn.style.background = 'var(--latam-red)';
                btn.style.borderColor = 'var(--latam-red)';
                btn.style.color = '#FFFFFF';
            }
        }

        this.actualizarBadgesAsientos();
        this.recalcularTotalesModal();

        // Reflejar en input de emisión
        const inputAsientos = document.getElementById('inputAsientosTexto');
        if (inputAsientos) {
            inputAsientos.value = Array.from(this.asientosSeleccionados).join(', ');
            this.recalcularTotalesEmision();
        }
    }

    actualizarBadgesAsientos() {
        const container = document.getElementById('selectedSeatsBadges');
        if (!container) return;

        if (this.asientosSeleccionados.size === 0) {
            container.innerHTML = `<span class="text-muted-sm">Ninguno</span>`;
            return;
        }

        container.innerHTML = Array.from(this.asientosSeleccionados).map(s => `
            <span class="seat-pill-tag" style="background:var(--latam-red); color:white; font-size:0.75rem; padding:0.2rem 0.5rem; border-radius:4px;">${s}</span>
        `).join(' ');
    }

    recalcularTotalesModal() {
        if (!this.vueloSeleccionado) return;
        const count = this.asientosSeleccionados.size;
        const elCant = document.getElementById('sumCantidadAsientos');
        if (elCant) elCant.innerText = count;
        const elTotal = document.getElementById('sumTotalFinal');
        if (elTotal) {
            const precioUnitario = this.vueloSeleccionado.precioBase;
            let multiplier = 1.0;
            if (this.claseSeleccionada === 'EXECUTIVA') multiplier = 1.5;
            if (this.claseSeleccionada === 'FIRST_CLASS') multiplier = 2.0;
            const subtotal = (precioUnitario * multiplier) * count;
            const totalFinal = subtotal + (subtotal * 0.18);
            elTotal.innerText = `S/ ${totalFinal.toFixed(2)}`;
        }
    }

    // ============================================================
    // PASARELA DE PAGO COMERCIAL (LATAM PAY)
    // ============================================================
    abrirPasarelaPago() {
        if (!this.token) {
            this.toast('Por favor inicia sesión con tu usuario para acceder a la pasarela de pago.', 'info');
            this.abrirModalLogin();
            return;
        }

        if (!this.vueloSeleccionado) {
            this.toast('Selecciona un vuelo para continuar.', 'warning');
            return;
        }

        if (this.asientosSeleccionados.size === 0) {
            this.toast('Debes ingresar al menos un asiento.', 'warning');
            return;
        }

        let nombres = 'Pasajero';
        let apellidos = 'Titular';
        let docIdentidad = '00000000';
        const selPas = document.getElementById('emiSelectPasajero');
        if (selPas && selPas.value) {
            const p = this.pasajeros.find(pas => pas.id === parseInt(selPas.value));
            if (p) {
                nombres = p.nombres;
                apellidos = p.apellidos;
                docIdentidad = p.docIdentidad;
            }
        } else if (document.getElementById('chkNombres')) {
            nombres = document.getElementById('chkNombres').value.trim() || nombres;
            apellidos = document.getElementById('chkApellidos')?.value?.trim() || apellidos;
            docIdentidad = document.getElementById('chkDni')?.value?.trim() || docIdentidad;
        }

        const count = this.asientosSeleccionados.size;
        const precioUnitario = this.vueloSeleccionado.precioBase;

        let multiplier = 1.0;
        if (this.claseSeleccionada === 'EXECUTIVA') multiplier = 1.5;
        if (this.claseSeleccionada === 'FIRST_CLASS') multiplier = 2.0;

        const subtotal = (precioUnitario * multiplier) * count;
        const impuestos = subtotal * 0.18;
        const totalFinal = subtotal + impuestos;
        this.montoTotalPago = totalFinal;

        document.getElementById('gatewayDisplayTotal').innerText = `S/ ${totalFinal.toFixed(2)}`;
        const yapeMonto = document.getElementById('yapeAmountText');
        if (yapeMonto) yapeMonto.innerText = `S/ ${totalFinal.toFixed(2)}`;

        const banner = document.getElementById('gatewayFlightBanner');
        if (banner) {
            const asientosList = Array.from(this.asientosSeleccionados).join(', ');
            banner.innerHTML = `
                <div>
                    <strong style="color:var(--latam-indigo); font-size:0.95rem;">LATAM Airlines · ${this.vueloSeleccionado.numeroVuelo}</strong>
                    <span style="margin-left:0.6rem; color:var(--brand-dark); font-weight:700;">${this.vueloSeleccionado.origen} &rarr; ${this.vueloSeleccionado.destino}</span>
                    <div style="font-size:0.75rem; color:var(--brand-slate); margin-top:2px;">
                        ${this.formatearFechaTexto(this.vueloSeleccionado.fechaSalida)} · ${this.formatearHora12(this.vueloSeleccionado.fechaSalida)} · Clase: ${this.claseSeleccionada}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div>Asientos: <strong style="color:var(--latam-red); font-weight:800;">${asientosList}</strong> (${count} pasaje${count > 1 ? 's' : ''})</div>
                    <div style="font-size:0.75rem; color:var(--brand-slate); margin-top:2px;">
                        Titular: <strong>${nombres} ${apellidos}</strong> (DNI: ${docIdentidad})
                    </div>
                </div>
            `;
        }

        // LIMPIAR CAMPOS DE TARJETA: COMPLETAMENTE VACÍOS SIN DATOS DE PRUEBA
        const inputHolder = document.getElementById('payCardHolder');
        const inputCardNum = document.getElementById('payCardNumber');
        const inputExp = document.getElementById('payCardExpiry');
        const inputCvv = document.getElementById('payCardCvv');

        if (inputHolder) inputHolder.value = '';
        if (inputCardNum) inputCardNum.value = '';
        if (inputExp) inputExp.value = '';
        if (inputCvv) inputCvv.value = '';

        const cardHolderDisp = document.getElementById('cardHolderDisplay');
        const cardNumDisp = document.getElementById('cardNumberDisplay');
        const cardExpDisp = document.getElementById('cardExpiryDisplay');
        const cardBrandDisp = document.getElementById('cardBrandDisplay');

        if (cardHolderDisp) cardHolderDisp.innerText = 'NOMBRE DEL TITULAR';
        if (cardNumDisp) cardNumDisp.innerText = '•••• •••• •••• ••••';
        if (cardExpDisp) cardExpDisp.innerText = 'MM/AA';
        if (cardBrandDisp) cardBrandDisp.innerText = 'TARJETA';

        const btnCompra = document.getElementById('btnOpCompraModal');
        const btnReserva = document.getElementById('btnOpReservaModal');

        if (this.reservaPendienteParaPagar) {
            // SI YA HIZO LA RESERVA Y QUIERE PAGAR COMPLETO:
            // En el modal ya NO debe aparecer el 50% btn sino solo 100%
            if (btnReserva) btnReserva.style.display = 'none';
            if (btnCompra) {
                btnCompra.style.display = 'inline-flex';
                btnCompra.innerText = 'Liquidación Total (100%)';
            }
            this.cambiarTipoOperacionModal('COMPRA');
        } else {
            // Emisión normal: mostrar opciones 100% y 50%
            if (btnReserva) {
                btnReserva.style.display = 'inline-flex';
                btnReserva.innerText = 'Reserva (50%)';
            }
            if (btnCompra) {
                btnCompra.style.display = 'inline-flex';
                btnCompra.innerText = 'Compra (100%)';
            }
            this.cambiarTipoOperacionModal(this.tipoOperacionModal || 'COMPRA');
        }

        this.seleccionarMetodoPago('tarjeta');
        document.getElementById('modalPaymentGateway').style.display = 'flex';
    }

    cambiarTipoOperacionModal(tipo) {
        // Si es una reserva previa que se va a pagar completa, forzar siempre COMPRA (100%)
        if (this.reservaPendienteParaPagar) {
            tipo = 'COMPRA';
        }
        this.tipoOperacionModal = tipo;
        const btnCompra = document.getElementById('btnOpCompraModal');
        const btnReserva = document.getElementById('btnOpReservaModal');
        const lblDesc = document.getElementById('lblDescOperacionModal');
        const emiEstado = document.getElementById('emiSelectEstadoPago');

        const baseTotal = (this.reservaPendienteParaPagar && this.reservaPendienteParaPagar.total) ? this.reservaPendienteParaPagar.total : this.montoTotalPago;

        if (tipo === 'RESERVA' && !this.reservaPendienteParaPagar) {
            if (btnCompra) btnCompra.classList.remove('active');
            if (btnReserva) btnReserva.classList.add('active');
            this.montoEfectivoPago = baseTotal * 0.5;
            if (lblDesc) lblDesc.innerText = `Reserva de pasaje con anticipo del 50% (S/ ${this.montoEfectivoPago.toFixed(2)}) · Saldo pendiente: S/ ${(baseTotal * 0.5).toFixed(2)}`;
            if (emiEstado) emiEstado.value = 'RESERVADO';
        } else {
            if (btnCompra) btnCompra.classList.add('active');
            if (btnReserva) btnReserva.classList.remove('active');
            this.montoEfectivoPago = baseTotal;
            if (lblDesc) {
                lblDesc.innerText = this.reservaPendienteParaPagar ?
                    `Liquidación completa de la reserva confirmada (100% del saldo pendiente: S/ ${baseTotal.toFixed(2)})` :
                    `Compra inmediata de boleto (100% de la tarifa)`;
            }
            if (emiEstado) emiEstado.value = 'PAGADO';
        }

        const displayTotal = document.getElementById('gatewayDisplayTotal');
        if (displayTotal) {
            displayTotal.innerText = (tipo === 'RESERVA') ? `S/ ${this.montoEfectivoPago.toFixed(2)} (50%)` : `S/ ${this.montoEfectivoPago.toFixed(2)}`;
        }

        const yapeMonto = document.getElementById('yapeAmountText');
        if (yapeMonto) yapeMonto.innerText = `S/ ${this.montoEfectivoPago.toFixed(2)}`;

        const btnPagar = document.getElementById('lblBotonPagarTexto');
        if (btnPagar) btnPagar.innerText = 'Pagar';
    }

    cerrarPasarelaPago() {
        document.getElementById('modalPaymentGateway').style.display = 'none';
        this.reservaPendienteParaPagar = null;
    }

    seleccionarMetodoPago(metodo) {
        this.metodoPagoSeleccionado = metodo;

        document.querySelectorAll('.gm-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-method') === metodo);
        });

        const secTarjeta = document.getElementById('sectionPaymentTarjeta');
        const secYape = document.getElementById('sectionPaymentYape');
        const secCip = document.getElementById('sectionPaymentPagoEfectivo');
        const secTransf = document.getElementById('sectionPaymentTransferencia');

        if (secTarjeta) secTarjeta.style.display = (metodo === 'tarjeta') ? 'block' : 'none';
        if (secYape) secYape.style.display = (metodo === 'yape') ? 'block' : 'none';
        if (secCip) secCip.style.display = (metodo === 'pagoefectivo') ? 'block' : 'none';
        if (secTransf) secTransf.style.display = (metodo === 'transferencia') ? 'block' : 'none';

        const lblBoton = document.getElementById('lblBotonPagarTexto');
        if (lblBoton) {
            lblBoton.innerText = 'Pagar';
        }
    }

    formatearNumeroTarjeta(input) {
        let val = input.value.replace(/\D/g, '').substring(0, 16);
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        input.value = formatted;

        const cardDisplay = document.getElementById('cardNumberDisplay');
        const brandDisplay = document.getElementById('cardBrandDisplay');

        if (cardDisplay) cardDisplay.innerText = formatted || '•••• •••• •••• ••••';
        if (brandDisplay) {
            if (val.startsWith('4')) brandDisplay.innerText = 'VISA';
            else if (val.startsWith('5')) brandDisplay.innerText = 'MASTERCARD';
            else if (val.startsWith('3')) brandDisplay.innerText = 'AMEX';
            else brandDisplay.innerText = 'TARJETA';
        }
    }

    actualizarTitularTarjeta(input) {
        const holderDisplay = document.getElementById('cardHolderDisplay');
        if (holderDisplay) {
            holderDisplay.innerText = input.value.trim().toUpperCase() || 'NOMBRE DEL TITULAR';
        }
    }

    formatearExpiracion(input) {
        let val = input.value.replace(/\D/g, '').substring(0, 4);
        if (val.length >= 3) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        input.value = val;

        const expDisplay = document.getElementById('cardExpiryDisplay');
        if (expDisplay) expDisplay.innerText = val || 'MM/AA';
    }

    async procesarPagoConPasarela() {
        if (!this.token) {
            this.toast('Sesión requerida.', 'warning');
            this.abrirModalLogin();
            return;
        }

        if (this.metodoPagoSeleccionado === 'tarjeta') {
            const rawNum = (document.getElementById('payCardNumber').value || '').replace(/\s+/g, '');
            const titular = (document.getElementById('payCardHolder').value || '').trim();
            const exp = (document.getElementById('payCardExpiry').value || '').trim();
            const cvv = (document.getElementById('payCardCvv').value || '').trim();

            if (rawNum.length < 15) {
                this.toast('Por favor ingresa un número de tarjeta válido (16 dígitos).', 'warning');
                return;
            }
            if (!titular) {
                this.toast('Por favor ingresa el nombre y apellido del titular como figura en la tarjeta.', 'warning');
                return;
            }
            if (!exp || !exp.includes('/')) {
                this.toast('Por favor ingresa la fecha de expiración de la tarjeta (MM/AA).', 'warning');
                return;
            }
            if (cvv.length < 3) {
                this.toast('Por favor ingresa el código CVV de seguridad de la tarjeta.', 'warning');
                return;
            }
        }

        const overlay = document.getElementById('gatewayProcessingOverlay');
        const pTitle = document.getElementById('processingTitle');
        const pSub = document.getElementById('processingSubtitle');
        const pFill = document.getElementById('ppbFill');

        if (overlay) overlay.style.display = 'flex';
        if (pFill) pFill.style.width = '35%';
        if (pTitle) pTitle.innerText = 'Conectando con la Pasarela Bancaria...';
        if (pSub) pSub.innerText = 'Estableciendo canal seguro TLS 1.3 con Visa / Mastercard / LATAM Pay...';

        await new Promise(r => setTimeout(r, 600));

        if (pFill) pFill.style.width = '75%';
        if (pTitle) pTitle.innerText = 'Validando Autenticación 3D Secure...';
        if (pSub) pSub.innerText = 'Firma digital bancaria aprobada. Confirmando boletos...';

        await new Promise(r => setTimeout(r, 600));

        // CASO A: Pago de una reserva existente en estado RESERVADO (Pendiente) desde Dashboard
        if (this.reservaPendienteParaPagar) {
            try {
                let exp = (document.getElementById('payCardExpiry').value || '12/28').split('/');
                let mesExp = parseInt(exp[0]) || 12;
                let anioExp = exp[1] ? (2000 + parseInt(exp[1])) : 2028;

                const titularInput = (document.getElementById('payCardHolder').value || '').trim();
                const numTarjetaInput = (document.getElementById('payCardNumber').value || '').replace(/\s+/g, '');
                const cvvInput = (document.getElementById('payCardCvv').value || '').trim();
                const codeAprob = (document.getElementById('payYapeCode') ? document.getElementById('payYapeCode').value : '').trim();

                const montoCobro = this.montoEfectivoPago || this.reservaPendienteParaPagar.total;

                const pagoPayload = {
                    idReserva: this.reservaPendienteParaPagar.id,
                    metodoPago: this.metodoPagoSeleccionado.toUpperCase(),
                    monto: montoCobro,
                    titularPagador: titularInput || this.reservaPendienteParaPagar.nombreCompletoPasajero || 'CLIENTE',
                    numeroTarjeta: numTarjetaInput || '0000000000000000',
                    mesExpiracion: mesExp,
                    anioExpiracion: anioExp,
                    cvv: cvvInput || '000',
                    codigoAprobacion: codeAprob
                };

                const pagoRes = await fetch(`${API_BASE}/pasarela/procesar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pagoPayload)
                });

                if (overlay) overlay.style.display = 'none';

                if (!pagoRes.ok) {
                    const errData = await pagoRes.json().catch(() => ({}));
                    this.toast(errData.mensaje || 'Error al procesar el pago de la reserva.', 'error');
                    return;
                }

                const pagoData = await pagoRes.json();
                this.detenerTemporizadorHold();
                this.toast(`¡Pago completado con éxito! Reserva ${this.reservaPendienteParaPagar.codigoReserva} confirmada.`, 'success');

                this.reservaPendienteParaPagar.estadoPago = 'PAGADO';
                this.reservaPendienteParaPagar.codigoTransaccionPago = pagoData.codigoTransaccion;
                this.reservaPendienteParaPagar.metodoPagoRegistrado = pagoData.metodoPago;
                this.reservaPendienteParaPagar.numeroEnmascarado = pagoData.numeroEnmascarado;

                const copiaReserva = { ...this.reservaPendienteParaPagar };
                this.reservaPendienteParaPagar = null;

                this.cerrarPasarelaPago();
                this.limpiarFormularioEmision();
                this.mostrarModalBoardingPass(copiaReserva);
                await this.cargarHistorialReservas();
                return;

            } catch (err) {
                if (overlay) overlay.style.display = 'none';
                this.toast('Error al comunicarse con la pasarela bancaria.', 'error');
                console.error(err);
                return;
            }
        }

        // CASO B: Nueva Reserva desde Emisión o Checkout
        let idPasajero = 1;
        const selPas = document.getElementById('emiSelectPasajero');
        if (selPas && selPas.value) {
            idPasajero = parseInt(selPas.value);
        } else {
            const nombres = document.getElementById('chkNombres')?.value?.trim() || 'Pasajero';
            const apellidos = document.getElementById('chkApellidos')?.value?.trim() || 'General';
            const docIdentidad = document.getElementById('chkDni')?.value?.trim() || '00000000';
            const email = document.getElementById('chkEmail')?.value?.trim() || 'cliente@correo.com';

            try {
                const pasRes = await this.authFetch(`${API_BASE}/pasajeros`, {
                    method: 'POST',
                    body: JSON.stringify({
                        nombres, apellidos, docIdentidad, nacionalidad: 'Peruana', telefono: '987654321', email
                    })
                });
                if (pasRes.ok) {
                    const pasData = await pasRes.json();
                    idPasajero = pasData.id;
                }
            } catch { idPasajero = 1; }
        }

        const detalles = Array.from(this.asientosSeleccionados).map(asiento => ({
            numeroAsiento: asiento,
            clase: this.claseSeleccionada,
            precioUnitario: this.vueloSeleccionado.precioBase
        }));

        const estadoPago = (this.tipoOperacionModal === 'RESERVA' || this.metodoPagoSeleccionado === 'pagoefectivo') ? 'RESERVADO' : 'PAGADO';

        const payload = {
            idPasajero,
            idVuelo: this.vueloSeleccionado.id,
            estadoPago,
            detalles
        };

        try {
            const res = await this.authFetch(`${API_BASE}/reservas`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (overlay) overlay.style.display = 'none';

            if (!res.ok) {
                this.toast(data.mensaje || 'Error al procesar la reserva.', 'error');
                return;
            }

            // Registrar transacción en la tabla `pagos` de MySQL vinculada a la reserva
            try {
                let exp = (document.getElementById('payCardExpiry').value || '12/28').split('/');
                let mesExp = parseInt(exp[0]) || 12;
                let anioExp = exp[1] ? (2000 + parseInt(exp[1])) : 2028;

                const titularInput = (document.getElementById('payCardHolder').value || '').trim();
                const numTarjetaInput = (document.getElementById('payCardNumber').value || '').replace(/\s+/g, '');
                const cvvInput = (document.getElementById('payCardCvv').value || '').trim();
                const codeAprob = (document.getElementById('payYapeCode') ? document.getElementById('payYapeCode').value : '').trim();

                const montoCobro = (this.tipoOperacionModal === 'RESERVA') ? (data.total * 0.5) : data.total;

                const pagoPayload = {
                    idReserva: data.id,
                    metodoPago: this.metodoPagoSeleccionado.toUpperCase(),
                    monto: montoCobro,
                    titularPagador: titularInput || data.nombreCompletoPasajero || 'CLIENTE',
                    numeroTarjeta: numTarjetaInput || '0000000000000000',
                    mesExpiracion: mesExp,
                    anioExpiracion: anioExp,
                    cvv: cvvInput || '000',
                    codigoAprobacion: codeAprob
                };

                const pagoRes = await fetch(`${API_BASE}/pasarela/procesar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pagoPayload)
                });

                if (pagoRes.ok) {
                    const pagoData = await pagoRes.json();
                    data.codigoTransaccionPago = pagoData.codigoTransaccion;
                    data.metodoPagoRegistrado = pagoData.metodoPago;
                    data.numeroEnmascarado = pagoData.numeroEnmascarado;
                }
            } catch (errPago) {
                console.warn('Registro de transacción de pago completado:', errPago);
            }

            this.detenerTemporizadorHold();
            if (this.tipoOperacionModal === 'RESERVA') {
                this.toast(`¡Reserva confirmada con anticipo del 50%! PNR: ${data.codigoReserva}`, 'success');
            } else {
                this.toast(`¡Pago exitoso y compra confirmada al 100%! PNR: ${data.codigoReserva}`, 'success');
            }
            this.cerrarPasarelaPago();
            this.cerrarModalCheckout();
            this.limpiarFormularioEmision();

            this.mostrarModalBoardingPass(data);
            this.cargarVuelos();
            this.cargarHistorialReservas();

        } catch (err) {
            if (overlay) overlay.style.display = 'none';
            this.toast('Error de red al comunicarse con el servidor.', 'error');
            console.error(err);
        }
    }

    // ============================================================
    // MÓDULO 4: DASHBOARD DE RESERVAS (HISTORIAL Y CANCELACIÓN ADMIN)
    // ============================================================
    filtrarReservasPorEstado(estado, btn) {
        this.filtroEstadoReserva = estado;
        this.paginaActualReservas = 1;
        document.querySelectorAll('#secModReservas .status-chip-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.renderizarTablaHistorialReservas();
    }

    async cargarHistorialReservas() {
        const tbody = document.getElementById('tbodyHistorialReservas');
        if (!tbody) return;

        if (!this.token) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4">
                        <p class="text-muted-sm">Inicia sesión con tu rol operativo para visualizar el historial completo de reservas.</p>
                    </td>
                </tr>
            `;
            return;
        }

        try {
            const res = await this.authFetch(`${API_BASE}/reservas`);
            if (!res.ok) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4" style="color:red;">Error al cargar registros.</td></tr>';
                return;
            }

            const reservas = await res.json();
            this.reservas = reservas;
            this.renderizarTablaHistorialReservas();

        } catch (err) {
            console.error(err);
        }
    }

    cambiarPaginaReservas(pag) {
        this.paginaActualReservas = pag;
        this.renderizarTablaHistorialReservas();
    }

    cambiarTamanoPaginaReservas(tam) {
        this.tamanoPaginaReservas = tam;
        this.paginaActualReservas = 1;
        this.renderizarTablaHistorialReservas();
    }

    renderizarTablaHistorialReservas() {
        const tbody = document.getElementById('tbodyHistorialReservas');
        if (!tbody) return;

        let lista = [...this.reservas];
        if (this.filtroEstadoReserva && this.filtroEstadoReserva !== 'TODOS') {
            lista = lista.filter(r => (r.estadoPago || '').toUpperCase() === this.filtroEstadoReserva);
        }

        const totalReservas = lista.length;
        if (totalReservas === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No se encontraron reservas con el filtro seleccionado.</td></tr>';
            this.renderPaginacion('paginationReservas', 0, 1, this.tamanoPaginaReservas, 'cambiarPaginaReservas', 'cambiarTamanoPaginaReservas');
            return;
        }

        const totalPaginas = Math.ceil(totalReservas / this.tamanoPaginaReservas) || 1;
        if (this.paginaActualReservas > totalPaginas) this.paginaActualReservas = totalPaginas;
        const inicio = (this.paginaActualReservas - 1) * this.tamanoPaginaReservas;
        const fin = inicio + this.tamanoPaginaReservas;
        const reservasPagina = lista.slice(inicio, fin);

        tbody.innerHTML = reservasPagina.map(r => {
            const asientos = (r.detalles || []).map(d => d.numeroAsiento).join(', ') || '-';
            const statusClass = r.estadoPago === 'PAGADO' ? 'pagado' : (r.estadoPago === 'ANULADO' ? 'anulado' : 'reservado');
            const totalFormatted = this.formatearPrecio(r.total);

            // Regla solicitada: una vez pagado NO debe aparecer el botón de pagar.
            const btnPagar = (r.estadoPago === 'RESERVADO') 
                ? `<button class="btn-latam-select btn-sm" onclick="app.pagarReservaPendiente(${r.id})" style="padding:0.25rem 0.55rem; font-size:0.75rem;">Pagar</button>`
                : '';

            const btnAnular = (this.rol === 'ROLE_ADMIN' && r.estadoPago !== 'ANULADO')
                ? `<button class="btn-clean-outline btn-sm" style="color:#EF4444; border-color:#EF4444; padding:0.25rem 0.55rem; font-size:0.75rem;" onclick="app.abrirModalCancelarReserva(${r.id}, '${r.codigoReserva}')">Cancelar</button>`
                : '';

            return `
                <tr>
                    <td><span class="pnr-tag-bold">${r.codigoReserva}</span></td>
                    <td>${this.formatearFechaTexto(r.fechaEmision)}</td>
                    <td><strong>${r.nombreCompletoPasajero}</strong><br><small class="text-muted-sm">DNI: ${r.docIdentidad}</small></td>
                    <td><strong>${r.numeroVuelo}</strong></td>
                    <td>${r.origen} &rarr; ${r.destino}</td>
                    <td><span class="role-badge" style="background:#F1EFFB; color:var(--latam-indigo);">${asientos}</span></td>
                    <td><strong style="color:var(--latam-red);">${totalFormatted}</strong></td>
                    <td><span class="status-badge ${statusClass}">${r.estadoPago}</span></td>
                    <td>
                        <div style="display:flex; gap:0.4rem; align-items:center;">
                            <button class="btn-clean-outline btn-sm" onclick="app.verTicketPorPnr('${r.codigoReserva}')" style="padding:0.25rem 0.5rem; font-size:0.75rem;">Boleto</button>
                            ${btnPagar}
                            ${btnAnular}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        this.renderPaginacion('paginationReservas', totalReservas, this.paginaActualReservas, this.tamanoPaginaReservas, 'cambiarPaginaReservas', 'cambiarTamanoPaginaReservas');
    }

    pagarReservaPendiente(idReserva) {
        const r = this.reservas.find(res => res.id === idReserva);
        if (!r) return;

        if (r.estadoPago === 'PAGADO') {
            this.toast('Esta reserva ya cuenta con un pago completado y confirmado.', 'info');
            return;
        }

        this.reservaPendienteParaPagar = r;
        const vuelo = this.vuelos.find(v => v.id === r.idVuelo) || {
            id: r.idVuelo,
            numeroVuelo: r.numeroVuelo,
            origen: r.origen,
            destino: r.destino,
            fechaSalida: r.fechaSalida,
            precioBase: r.total
        };

        this.vueloSeleccionado = vuelo;
        this.asientosSeleccionados = new Set((r.detalles || []).map(d => d.numeroAsiento));
        this.montoTotalPago = r.total;

        const nombresPartes = (r.nombreCompletoPasajero || '').split(' ');
        if (document.getElementById('chkNombres')) document.getElementById('chkNombres').value = nombresPartes[0] || '';
        if (document.getElementById('chkApellidos')) document.getElementById('chkApellidos').value = nombresPartes.slice(1).join(' ') || '';
        if (document.getElementById('chkDni')) document.getElementById('chkDni').value = r.docIdentidad || '';

        this.iniciarTemporizadorHold();
        this.abrirPasarelaPago();
    }

    abrirModalCancelarReserva(id, codigo) {
        if (this.rol !== 'ROLE_ADMIN') {
            this.toast('Solo el Administrador puede anular reservas y reponer asientos.', 'warning');
            return;
        }

        const r = this.reservas.find(res => res.id === id);
        if (!r) return;

        this.reservaACancelar = r;
        const asientos = (r.detalles || []).map(d => d.numeroAsiento).join(', ') || '-';

        document.getElementById('cancelModalDetailsBox').innerHTML = `
            <div><strong>Código PNR:</strong> <span style="color:var(--latam-red); font-weight:800;">${r.codigoReserva}</span></div>
            <div><strong>Pasajero:</strong> ${r.nombreCompletoPasajero} (DNI: ${r.docIdentidad})</div>
            <div><strong>Vuelo & Ruta:</strong> ${r.numeroVuelo} (${r.origen} &rarr; ${r.destino})</div>
            <div><strong>Asientos a Liberar:</strong> <span class="role-badge" style="background:#10004F; color:white;">${asientos}</span> (${(r.detalles || []).length} asiento(s))</div>
            <div><strong>Importe de Reserva:</strong> ${this.formatearPrecio(r.total)}</div>
        `;

        document.getElementById('modalConfirmarCancelacionReserva').style.display = 'flex';
    }

    cerrarModalCancelarReserva() {
        document.getElementById('modalConfirmarCancelacionReserva').style.display = 'none';
        this.reservaACancelar = null;
    }

    async ejecutarCancelacionConfirmada() {
        if (!this.reservaACancelar) return;

        const id = this.reservaACancelar.id;
        const codigo = this.reservaACancelar.codigoReserva;
        const motivo = document.getElementById('cancelReasonSelect').value;

        try {
            const res = await this.authFetch(`${API_BASE}/reservas/${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!res.ok) {
                this.toast(data.mensaje || 'Error al cancelar reserva.', 'error');
                return;
            }

            this.toast(`Reserva ${codigo} anulada exitosamente. Asientos liberados y repuestos al vuelo.`, 'success');
            this.cerrarModalCancelarReserva();
            this.cargarHistorialReservas();
            this.cargarVuelos();

        } catch (err) {
            this.toast('Error al cancelar reserva.', 'error');
            console.error(err);
        }
    }

    async buscarPorCodigoPnr() {
        const codigo = document.getElementById('inputBuscarPnrDirecto').value.trim().toUpperCase();
        if (!codigo) {
            this.toast('Ingresa tu código PNR de 6 caracteres (ej: PNR-26E78A).', 'warning');
            return;
        }

        try {
            const res = await this.authFetch(`${API_BASE}/reservas/${codigo}`);
            const data = await res.json();

            if (!res.ok) {
                this.toast(data.mensaje || 'Reserva no encontrada con ese código PNR.', 'error');
                return;
            }

            this.mostrarModalBoardingPass(data);

        } catch (err) {
            this.toast('Error al consultar el PNR.', 'error');
            console.error(err);
        }
    }

    async verTicketPorPnr(codigo) {
        try {
            const res = await this.authFetch(`${API_BASE}/reservas/${codigo}`);
            const data = await res.json();
            if (res.ok) this.mostrarModalBoardingPass(data);
        } catch (err) {
            console.error(err);
        }
    }

    // ============================================================
    // BOARDING PASS OFICIAL LATAM AIRLINES
    // ============================================================
    mostrarModalBoardingPass(r) {
        const modal = document.getElementById('modalBoardingPassView');
        const container = document.getElementById('boardingPassCardContainer');

        const asientos = (r.detalles || []).map(d => d.numeroAsiento).join(', ') || '3A';

        container.innerHTML = `
            <div style="background:var(--latam-indigo); color:white; border-radius:12px; padding:1.5rem 1.8rem; margin-bottom:1.2rem;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="font-size:0.75rem; letter-spacing:1.5px; opacity:0.8;">TARJETA DE EMBARQUE · BOARDING PASS</span>
                        <h2 style="font-size:1.6rem; font-weight:900; margin-top:2px;">LATAM Airlines · ${r.numeroVuelo || 'LA-2045'}</h2>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:0.7rem; opacity:0.8;">CÓDIGO DE RESERVA</span>
                        <div style="font-size:1.6rem; font-weight:900; color:var(--latam-red); letter-spacing:1px;">${r.codigoReserva}</div>
                    </div>
                </div>
            </div>

            <div style="padding:0 0.5rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:1.2rem; border-bottom:1px solid #E2E8F0; padding-bottom:1rem;">
                    <div>
                        <span class="text-muted-sm">PASAJERO TITULAR</span>
                        <div style="font-size:1.15rem; font-weight:800; text-transform:uppercase;">${r.nombreCompletoPasajero || 'JAZMIN CHAMORRO ARONE'}</div>
                        <span class="text-muted-sm">DOC IDENTIDAD: ${r.docIdentidad || '001557367'}</span>
                    </div>
                    <div style="text-align:right;">
                        <span class="text-muted-sm">ESTADO DE PAGO</span>
                        <div><span class="status-badge pagado">${r.estadoPago}</span></div>
                        ${r.codigoTransaccionPago ? `<div style="font-size:0.75rem; color:var(--latam-indigo); font-weight:700; margin-top:3px;">Transacción: ${r.codigoTransaccionPago}</div>` : ''}
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1rem; background:#F8FAFC; padding:1rem; border-radius:8px; margin-bottom:1.2rem; text-align:center;">
                    <div>
                        <span class="text-muted-sm">PUERTA</span>
                        <div style="font-size:1.3rem; font-weight:900; color:var(--latam-indigo);">G14</div>
                    </div>
                    <div>
                        <span class="text-muted-sm">ASIENTO(S)</span>
                        <div style="font-size:1.3rem; font-weight:900; color:var(--latam-red);">${asientos}</div>
                    </div>
                    <div>
                        <span class="text-muted-sm">GRUPO</span>
                        <div style="font-size:1.3rem; font-weight:900; color:var(--latam-indigo);">GRUPO 2</div>
                    </div>
                    <div>
                        <span class="text-muted-sm">TOTAL PAGADO</span>
                        <div style="font-size:1.3rem; font-weight:900; color:var(--brand-dark);">S/ ${r.total.toFixed(2)}</div>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.2rem;">
                    <div>
                        <div style="font-size:1.8rem; font-weight:900; color:var(--brand-dark);">${r.origen || 'LIM'}</div>
                        <span class="text-muted-sm">Salida: ${this.formatearHora12(r.fechaSalida)}</span>
                    </div>
                    <div style="text-align:center; color:var(--latam-indigo); font-weight:800;">
                        <span>Vuelo Directo</span>
                        <div style="width:120px; height:2px; background:#CBD5E1; margin:4px auto;"></div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.8rem; font-weight:900; color:var(--brand-dark);">${r.destino || 'CUZ'}</div>
                        <span class="text-muted-sm">Llegada: ${this.formatearHora12(r.fechaLlegada)}</span>
                    </div>
                </div>

                <!-- Código de Barras Imprimible -->
                <div style="height:42px; background:repeating-linear-gradient(90deg, #10004F, #10004F 2px, transparent 2px, transparent 6px); margin-top:1.5rem;"></div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    cerrarModalBoardingPass() {
        document.getElementById('modalBoardingPassView').style.display = 'none';
    }

    // ============================================================
    // SISTEMA DE PAGINACIÓN COMPLETA (FILTROS 10, 20, 50)
    // ============================================================
    renderPaginacion(containerId, totalItems, paginaActual, tamanoPagina, fnCambiarPagina, fnCambiarTamano) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (totalItems <= 0) {
            container.innerHTML = '';
            return;
        }

        const totalPaginas = Math.ceil(totalItems / tamanoPagina) || 1;
        const desde = (paginaActual - 1) * tamanoPagina + 1;
        const hasta = Math.min(paginaActual * tamanoPagina, totalItems);

        // Generar botones numéricos de navegación
        let pageButtonsHtml = '';
        const maxButtons = 5;
        let startPage = Math.max(1, paginaActual - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPaginas, startPage + maxButtons - 1);
        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let p = startPage; p <= endPage; p++) {
            const activeClass = p === paginaActual ? 'active' : '';
            pageButtonsHtml += `
                <button type="button" class="pag-btn ${activeClass}" onclick="app.${fnCambiarPagina}(${p})">
                    ${p}
                </button>
            `;
        }

        container.innerHTML = `
            <div class="pagination-container">
                <div class="pagination-size-wrap">
                    <label class="pag-size-label">Mostrar:</label>
                    <select class="pagination-select" onchange="app.${fnCambiarTamano}(parseInt(this.value))">
                        <option value="10" ${tamanoPagina === 10 ? 'selected' : ''}>10 registros</option>
                        <option value="20" ${tamanoPagina === 20 ? 'selected' : ''}>20 registros</option>
                        <option value="50" ${tamanoPagina === 50 ? 'selected' : ''}>50 registros</option>
                    </select>
                    <span class="pagination-info">Mostrando ${desde} a ${hasta} de ${totalItems} registros</span>
                </div>
                <div class="pagination-buttons">
                    <button type="button" class="pag-btn" ${paginaActual <= 1 ? 'disabled' : ''} onclick="app.${fnCambiarPagina}(1)" title="Primera página">&laquo;</button>
                    <button type="button" class="pag-btn" ${paginaActual <= 1 ? 'disabled' : ''} onclick="app.${fnCambiarPagina}(${paginaActual - 1})" title="Página anterior">&lsaquo;</button>
                    ${pageButtonsHtml}
                    <button type="button" class="pag-btn" ${paginaActual >= totalPaginas ? 'disabled' : ''} onclick="app.${fnCambiarPagina}(${paginaActual + 1})" title="Página siguiente">&rsaquo;</button>
                    <button type="button" class="pag-btn" ${paginaActual >= totalPaginas ? 'disabled' : ''} onclick="app.${fnCambiarPagina}(${totalPaginas})" title="Última página">&raquo;</button>
                </div>
            </div>
        `;
    }

    // ============================================================
    // UTILIDADES COMUNES
    // ============================================================
    authFetch(url, options = {}) {
        options.headers = options.headers || {};
        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }
        options.headers['Content-Type'] = 'application/json';
        return fetch(url, options);
    }

    toast(mensaje, tipo = 'info') {
        const container = document.getElementById('toastContainer');
        const t = document.createElement('div');
        t.className = `toast toast-${tipo}`;
        t.innerText = mensaje;
        container.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0';
            setTimeout(() => t.remove(), 250);
        }, 4000);
    }

    formatearHora12(iso) {
        if (!iso) return '--:--';
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { return iso; }
    }

    formatearFechaTexto(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('es-PE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return iso; }
    }

    calcularDuracion(salida, llegada) {
        try {
            const ms = new Date(llegada) - new Date(salida);
            const mins = Math.floor(ms / (1000 * 60));
            const hrs = Math.floor(mins / 60);
            const rest = mins % 60;
            return `${hrs}h ${rest > 0 ? rest + 'm' : ''}`;
        } catch { return '1h 20m'; }
    }
}

// Iniciar aplicación
const app = new TravelApp();
