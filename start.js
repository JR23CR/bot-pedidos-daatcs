#!/usr/bin/env node

const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// Importar módulos locales
const Utils = require('./utils');
const ComandosBot = require('./comandos');
const config = require('./config');

class BotPedidosDAATCS {
    constructor() {
        this.pedidos = [];
        this.clientes = {};
        this.groupId = null;
        this.sock = null;
        this.comandos = null;
        this.inicializado = false;
    }

    // Inicialización del bot
    async inicializar() {
        try {
            console.log('🤖 Iniciando Bot de Pedidos DAATCS...');
            console.log(`📅 Fecha: ${new Date().toLocaleString('es-ES')}`);
            
            // Crear directorios necesarios
            this.crearDirectorios();
            
            // Cargar datos existentes
            this.cargarDatos();
            
            // Configurar logger
            const logger = pino({
                level: config.logging.nivel || 'info',
                transport: config.logging.consola ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard'
                    }
                } : undefined
            });

            // Configurar autenticación
            const { state, saveCreds } = await useMultiFileAuthState('./auth');
            
            // Crear socket de WhatsApp
            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                logger: logger,
                browser: [`Bot ${config.empresa.nombre}`, 'Chrome', '1.0.0'],
                defaultQueryTimeoutMs: 60000
            });

            // Inicializar comandos
            this.comandos = new ComandosBot(this.pedidos, this.clientes, this.sock);

            // Configurar eventos
            this.configurarEventos(saveCreds);
            
            // Configurar tareas programadas
            this.configurarTareasProgramadas();
            
            Utils.log('info', 'Bot inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando bot:', error);
            process.exit(1);
        }
    }

    // Crear directorios necesarios
    crearDirectorios() {
        const directorios = ['./data', './auth', './logs', './backups', './exports'];
        directorios.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                Utils.log('info', `Directorio creado: ${dir}`);
            }
        });
    }

    // Cargar datos existentes
    cargarDatos() {
        try {
            if (fs.existsSync(config.pedidosFile)) {
                this.pedidos = JSON.parse(fs.readFileSync(config.pedidosFile, 'utf8'));
                Utils.log('info', `Cargados ${this.pedidos.length} pedidos`);
            }
            
            if (fs.existsSync(config.clientesFile)) {
                this.clientes = JSON.parse(fs.readFileSync(config.clientesFile, 'utf8'));
                Utils.log('info', `Cargados ${Object.keys(this.clientes).length} clientes`);
            }
        } catch (error) {
            Utils.log('error', 'Error cargando datos', error);
            // Inicializar con datos vacíos
            this.pedidos = [];
            this.clientes = {};
        }
    }

    // Guardar datos
    guardarDatos() {
        try {
            fs.writeFileSync(config.pedidosFile, JSON.stringify(this.pedidos, null, 2));
            fs.writeFileSync(config.clientesFile, JSON.stringify(this.clientes, null, 2));
            Utils.log('debug', 'Datos guardados correctamente');
        } catch (error) {
            Utils.log('error', 'Error guardando datos', error);
        }
    }

    // Configurar eventos de WhatsApp
    configurarEventos(saveCreds) {
        // Evento de actualización de credenciales
        this.sock.ev.on('creds.update', saveCreds);

        // Evento de conexión
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 Escanea el código QR con tu WhatsApp');
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;
                    
                Utils.log('warn', 'Conexión cerrada', { 
                    reason: lastDisconnect?.error?.output?.statusCode,
                    shouldReconnect 
                });
                
                if (shouldReconnect) {
                    Utils.log('info', 'Reconectando en 5 segundos...');
                    setTimeout(() => this.inicializar(), 5000);
                }
            } else if (connection === 'open') {
                console.log('✅ Bot conectado exitosamente a WhatsApp!');
                Utils.log('info', 'Conexión establecida correctamente');
                this.inicializado = true;
                this.buscarGrupoObjetivo();
            }
        });

        // Evento de actualización de grupos
        this.sock.ev.on('groups.update', (updates) => {
            updates.forEach(update => {
                if (update.subject === config.groupName) {
                    this.groupId = update.id;
                    Utils.log('info', `Grupo encontrado: ${config.groupName}`, { groupId: this.groupId });
                }
            });
        });

        // Evento de mensajes
        this.sock.ev.on('messages.upsert', async (m) => {
            await this.procesarMensajes(m.messages);
        });

        // Eventos de error
        this.sock.ev.on('error', (error) => {
            Utils.log('error', 'Error en socket WhatsApp', error);
        });
    }

    // Buscar grupo objetivo
    async buscarGrupoObjetivo() {
        try {
            const grupos = await this.sock.groupFetchAllParticipating();
            
            for (const [id, grupo] of Object.entries(grupos)) {
                if (grupo.subject === config.groupName) {
                    this.groupId = id;
                    Utils.log('info', `Grupo objetivo encontrado: ${config.groupName}`, { groupId: id });
                    break;
                }
            }
            
            if (!this.groupId) {
                Utils.log('warn', `Grupo "${config.groupName}" no encontrado. Esperando...`);
            }
        } catch (error) {
            Utils.log('error', 'Error buscando grupos', error);
        }
    }

    // Procesamiento de mensajes
    async procesarMensajes(messages) {
        for (const msg of messages) {
            try {
                if (!msg.message || msg.key.fromMe) continue;

                const text = msg.message.conversation || 
                            msg.message.extendedTextMessage?.text || '';
                
                const sender = msg.key.remoteJid;
                const senderNumber = msg.key.participant || msg.key.remoteJid;
                const isGroup = sender.endsWith('@g.us');

                // Validar que sea el grupo correcto
                if (!this.esGrupoCorrecto(sender)) continue;

                Utils.log('debug', 'Mensaje recibido', { 
                    sender: sender.substring(0, 20) + '...', 
                    text: text.substring(0, 50) + '...' 
                });

                // Procesar comandos o pedidos
                await this.procesarComando(text, sender, senderNumber);

            } catch (error) {
                Utils.log('error', 'Error procesando mensaje', error);
            }
        }
    }

    // Verificar si es el grupo correcto
    esGrupoCorrecto(sender) {
        if (!sender.endsWith('@g.us')) return false;
        
        // Si ya tenemos el groupId, comparar directamente
        if (this.groupId) {
            return sender === this.groupId;
        }
        
        // Si no tenemos groupId, intentar identificar por nombre (menos confiable)
        return sender.toLowerCase().includes(config.groupName.toLowerCase().replace(/\s+/g, ''));
    }

    // Procesamiento de comandos
    async procesarComando(text, sender, senderNumber) {
        const isAdmin = this.esAdmin(senderNumber);
        
        if (text.startsWith('!')) {
            await this.ejecutarComando(text, sender, senderNumber, isAdmin);
        } else {
            await this.procesarPosiblePedido(text, sender, senderNumber);
        }
    }

    // Verificar si es administrador
    esAdmin(number) {
        const numeroLimpio = number.replace('@s.whatsapp.net', '').replace('@c.us', '');
        return config.adminNumbers.some(admin => 
            admin === numeroLimpio || number.includes(admin)
        );
    }

    // Ejecutar comando específico
    async ejecutarComando(text, sender, senderNumber, isAdmin) {
        const [command, ...args] = text.split(' ');
        const cmd = command.toLowerCase();

        try {
            switch (cmd) {
                case '!ayuda':
                    await this.comandos.mostrarAyuda(sender, isAdmin);
                    break;

                case '!catalogo':
                    await this.comandos.mostrarCatalogo(sender);
                    break;

                case '!contacto':
                    await this.comandos.mostrarContacto(sender);
                    break;

                case '!mispedidos':
                    await this.mostrarPedidosUsuario(sender, senderNumber);
                    break;

                case '!estado':
                    await this.consultarEstadoPedido(sender, senderNumber, args[0]);
                    break;

                case '!estadisticas':
                    if (isAdmin) {
                        await this.comandos.generarReporteVentas(sender);
                    } else {
                        await this.comandos.mostrarEstadisticasCliente(sender, senderNumber);
                    }
                    break;

                // Comandos de administrador
                case '!admin':
                    if (isAdmin) {
                        await this.mostrarComandosAdmin(sender);
                    } else {
                        await this.sock.sendMessage(sender, { 
                            text: '❌ No tienes permisos de administrador.' 
                        });
                    }
                    break;

                case '!listapedidos':
                    if (isAdmin) {
                        await this.mostrarTodosPedidos(sender);
                    }
                    break;

                case '!pedidospendientes':
                    if (isAdmin) {
                        await this.comandos.mostrarPedidosPendientes(sender);
                    }
                    break;

                case '!cambiarestado':
                    if (isAdmin && args.length >= 2) {
                        await this.cambiarEstadoPedido(sender, args[0], args[1]);
                    }
                    break;

                case '!buscarpedido':
                    if (isAdmin && args.length > 0) {
                        await this.buscarPedido(sender, args[0]);
                    }
                    break;

                case '!buscarcliente':
                    if (isAdmin && args.length > 0) {
                        await this.comandos.buscarCliente(sender, args.join(' '));
                    }
                    break;

                case '!reporte':
                    if (isAdmin) {
                        const dias = parseInt(args[0]) || 30;
                        await this.comandos.generarReporteVentas(sender, dias);
                    }
                    break;

                case '!backup':
                    if (isAdmin) {
                        await this.comandos.crearBackupManual(sender);
                    }
                    break;

                case '!exportar':
                    if (isAdmin) {
                        await this.comandos.exportarDatos(sender);
                    }
                    break;

                case '!salud':
                    if (isAdmin) {
                        await this.comandos.mostrarSaludSistema(sender);
                    }
                    break;

                default:
                    // Comando no reconocido
                    Utils.log('debug', `Comando no reconocido: ${cmd}`);
                    break;
            }
        } catch (error) {
            Utils.log('error', `Error ejecutando comando ${cmd}`, error);
            await this.sock.sendMessage(sender, { 
                text: '❌ Error interno ejecutando comando. Intenta nuevamente.' 
            });
        }
    }

    // Procesar posible pedido
    async procesarPosiblePedido(text, sender, senderNumber) {
        const palabrasClave = ['cliente:', 'producto:', 'cantidad:', 'precio:', 'teléfono:', 'artículo:'];
        const esPedido = palabrasClave.some(palabra => 
            text.toLowerCase().includes(palabra.toLowerCase())
        );

        if (!esPedido) return;

        try {
            const validacion = this.comandos.validarPedido(text);
            
            if (!validacion.esValido) {
                await this.sock.sendMessage(sender, { text: validacion.mensaje });
                return;
            }

            const nuevoPedido = this.procesarPedido(text, senderNumber);
            const resumen = this.generarResumenPedido(nuevoPedido);
            
            await this.sock.sendMessage(sender, { text: resumen });
            
            // Programar recordatorio
            this.comandos.programarRecordatorio(nuevoPedido.id, 3);
            
            // Notificar administradores si está habilitado
            if (config.notificaciones.nuevoPedido) {
                await this.notificarAdminsNuevoPedido(nuevoPedido);
            }
            
            Utils.log('info', `Pedido registrado: ${nuevoPedido.id}`, { 
                cliente: nuevoPedido.nombreCliente,
                total: nuevoPedido.total 
            });
            
        } catch (error) {
            Utils.log('error', 'Error procesando pedido', error);
            await this.sock.sendMessage(sender, { 
                text: '❌ Error procesando pedido. Verifica el formato.\n\nUsa !ayuda para ver el formato correcto.' 
            });
        }
    }

    // Procesar datos del pedido
    procesarPedido(message, sender) {
        const lines = message.split('\n');
        const pedidoId = this.generarIdPedido();
        
        const pedido = {
            id: pedidoId,
            cliente: sender,
            fecha: new Date().toISOString(),
            estado: 'pendiente',
            items: [],
            total: 0,
            notas: '',
            nombreCliente: 'No especificado',
            telefono: 'No especificado'
        };

        // Extraer información del pedido
        lines.forEach(line => {
            line = line.trim();
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) return;
            
            const key = line.substring(0, colonIndex).toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            
            switch (key) {
                case 'cliente':
                    pedido.nombreCliente = value;
                    break;
                case 'teléfono':
                case 'telefono':
                    pedido.telefono = Utils.limpiarNumeroTelefono(value);
                    break;
                case 'producto':
                case 'artículo':
                    pedido.items.push({
                        producto: value,
                        cantidad: 1,
                        precio: 0
                    });
                    break;
                case 'cantidad':
                    if (pedido.items.length > 0) {
                        pedido.items[pedido.items.length - 1].cantidad = parseInt(value) || 1;
                    }
                    break;
                case 'precio':
                    if (pedido.items.length > 0) {
                        pedido.items[pedido.items.length - 1].precio = parseFloat(value) || 0;
                    }
                    break;
                case 'nota':
                case 'observación':
                    pedido.notas = value;
                    break;
            }
        });

        // Calcular total
        pedido.total = pedido.items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

        // Agregar tiempo estimado de entrega
        const tiempoEntrega = Utils.calcularTiempoEntrega(pedido.items);
        pedido.tiempoEstimado = tiempoEntrega;

        // Guardar pedido
        this.pedidos.push(pedido);
        
        // Actualizar información del cliente
        this.actualizarCliente(sender, pedido);
        
        // Guardar datos
        this.guardarDatos();
        
        return pedido;
    }

    // Actualizar información del cliente
    actualizarCliente(sender, pedido) {
        if (!this.clientes[sender]) {
            this.clientes[sender] = {
                nombre: pedido.nombreCliente,
                telefono: pedido.telefono,
                pedidos: [],
                totalCompras: 0,
                fechaRegistro: new Date().toISOString()
            };
        }
        
        // Actualizar datos del cliente
        if (pedido.nombreCliente !== 'No especificado') {
            this.clientes[sender].nombre = pedido.nombreCliente;
        }
        if (pedido.telefono !== 'No especificado') {
            this.clientes[sender].telefono = pedido.telefono;
        }
        
        this.clientes[sender].pedidos.push(pedido.id);
        this.clientes[sender].totalCompras += pedido.total;
        this.clientes[sender].ultimaCompra = new Date().toISOString();
    }

    // Generar ID único de pedido
    generarIdPedido() {
        const fecha = new Date();
        const año = fecha.getFullYear().toString().slice(-2);
        const mes = String(fecha.getMonth() + 1).padStart
