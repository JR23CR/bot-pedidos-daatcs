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
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const contador = String(this.pedidos.length + 1).padStart(3, '0');
        
        return `DAA${año}${mes}${dia}${contador}`;
    }

    // Generar resumen de pedido
    generarResumenPedido(pedido) {
        let resumen = `🎨 *PEDIDO REGISTRADO - ${config.empresa.nombre.toUpperCase()}*\n\n`;
        resumen += `📋 *ID:* ${pedido.id}\n`;
        resumen += `👤 *Cliente:* ${pedido.nombreCliente}\n`;
        resumen += `📱 *Teléfono:* ${pedido.telefono}\n`;
        resumen += `📅 *Fecha:* ${new Date(pedido.fecha).toLocaleString('es-ES')}\n`;
        resumen += `📊 *Estado:* ${pedido.estado.toUpperCase()}\n\n`;
        
        resumen += `📦 *PRODUCTOS SOLICITADOS:*\n`;
        pedido.items.forEach((item, index) => {
            resumen += `${index + 1}. *${item.producto}*\n`;
            resumen += `   • Cantidad: ${item.cantidad} unidades\n`;
            resumen += `   • Precio unitario: ${Utils.formatearMoneda(item.precio)}\n`;
            resumen += `   • Subtotal: ${Utils.formatearMoneda(item.cantidad * item.precio)}\n\n`;
        });
        
        resumen += `💰 *TOTAL: ${Utils.formatearMoneda(pedido.total)}*\n\n`;
        
        if (pedido.tiempoEstimado) {
            resumen += `⏱️ *${pedido.tiempoEstimado.mensaje}*\n`;
            resumen += `📅 *Fecha estimada de entrega:* ${pedido.tiempoEstimado.fechaEstimada}\n\n`;
        }
        
        if (pedido.notas) {
            resumen += `📝 *Notas especiales:* ${pedido.notas}\n\n`;
        }
        
        resumen += `✅ *Tu pedido ha sido registrado exitosamente.*\n`;
        resumen += `🔍 Para consultar el estado usa: !estado ${pedido.id}\n`;
        resumen += `📞 Para dudas contacta: ${config.empresa.contacto.telefono || 'Ver !contacto'}`;
        
        return resumen;
    }

    // Mostrar pedidos del usuario
    async mostrarPedidosUsuario(sender, senderNumber) {
        const pedidosUsuario = this.pedidos.filter(p => p.cliente === senderNumber);
        
        if (pedidosUsuario.length === 0) {
            await this.sock.sendMessage(sender, { 
                text: '📋 No tienes pedidos registrados.\n\nPara crear un pedido, usa el formato que aparece en !ayuda' 
            });
            return;
        }
        
        let listText = `📋 *TUS PEDIDOS (${pedidosUsuario.length}):*\n\n`;
        
        pedidosUsuario
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .forEach(pedido => {
                const fechaFormat = new Date(pedido.fecha).toLocaleDateString('es-ES');
                const estadoEmoji = this.obtenerEmojiEstado(pedido.estado);
                
                listText += `${estadoEmoji} *${pedido.id}*\n`;
                listText += `   📅 ${fechaFormat}\n`;
                listText += `   📊 ${pedido.estado.toUpperCase()}\n`;
                listText += `   💰 ${Utils.formatearMoneda(pedido.total)}\n`;
                listText += `   📦 ${pedido.items.length} producto(s)\n\n`;
            });
            
        listText += `💡 Usa !estado [ID] para ver detalles específicos`;
        
        await this.sock.sendMessage(sender, { text: listText });
    }

    // Consultar estado específico de pedido
    async consultarEstadoPedido(sender, senderNumber, pedidoId) {
        if (!pedidoId) {
            await this.sock.sendMessage(sender, { 
                text: '❌ Uso correcto: !estado [ID_PEDIDO]\n\nEjemplo: !estado DAA240101001' 
            });
            return;
        }
        
        const pedido = this.pedidos.find(p => p.id === pedidoId && p.cliente === senderNumber);
        if (!pedido) {
            await this.sock.sendMessage(sender, { 
                text: '❌ Pedido no encontrado o no tienes permisos para consultarlo.' 
            });
            return;
        }
        
        const resumenDetallado = this.generarResumenDetallado(pedido);
        await this.sock.sendMessage(sender, { text: resumenDetallado });
    }

    // Generar resumen detallado del pedido
    generarResumenDetallado(pedido) {
        const estadoEmoji = this.obtenerEmojiEstado(pedido.estado);
        const fechaCreacion = new Date(pedido.fecha).toLocaleString('es-ES');
        
        let resumen = `${estadoEmoji} *DETALLE DEL PEDIDO ${pedido.id}*\n\n`;
        
        resumen += `👤 *Cliente:* ${pedido.nombreCliente}\n`;
        resumen += `📱 *Teléfono:* ${pedido.telefono}\n`;
        resumen += `📅 *Fecha de pedido:* ${fechaCreacion}\n`;
        resumen += `📊 *Estado actual:* ${pedido.estado.toUpperCase()}\n\n`;
        
        resumen += `📦 *PRODUCTOS:*\n`;
        pedido.items.forEach((item, index) => {
            resumen += `${index + 1}. ${item.producto}\n`;
            resumen += `   • Cantidad: ${item.cantidad}\n`;
            resumen += `   • Precio: ${Utils.formatearMoneda(item.precio)} c/u\n`;
            resumen += `   • Subtotal: ${Utils.formatearMoneda(item.cantidad * item.precio)}\n\n`;
        });
        
        resumen += `💰 *TOTAL: ${Utils.formatearMoneda(pedido.total)}*\n\n`;
        
        if (pedido.tiempoEstimado) {
            resumen += `⏱️ *Tiempo estimado:* ${pedido.tiempoEstimado.dias} día(s)\n`;
            resumen += `📅 *Fecha estimada:* ${pedido.tiempoEstimado.fechaEstimada}\n\n`;
        }
        
        if (pedido.notas) {
            resumen += `📝 *Notas:* ${pedido.notas}\n\n`;
        }
        
        // Información del estado
        resumen += this.obtenerInfoEstado(pedido.estado);
        
        return resumen;
    }

    // Obtener emoji según estado
    obtenerEmojiEstado(estado) {
        const emojis = {
            'pendiente': '⏳',
            'confirmado': '✅',
            'en_proceso': '🔄',
            'listo': '📦',
            'entregado': '🎉',
            'cancelado': '❌'
        };
        return emojis[estado] || '📋';
    }

    // Obtener información del estado
    obtenerInfoEstado(estado) {
        const info = {
            'pendiente': '⏳ Tu pedido está en espera de confirmación.',
            'confirmado': '✅ Pedido confirmado. Iniciando producción.',
            'en_proceso': '🔄 Tu pedido está siendo elaborado.',
            'listo': '📦 ¡Tu pedido está listo! Puedes pasar a recogerlo.',
            'entregado': '🎉 Pedido entregado. ¡Gracias por tu confianza!',
            'cancelado': '❌ Pedido cancelado.'
        };
        
        return info[estado] || 'Estado desconocido.';
    }

    // Mostrar comandos de administrador
    async mostrarComandosAdmin(sender) {
        let adminText = `👑 *COMANDOS DE ADMINISTRADOR*\n\n`;
        adminText += `📋 *Gestión de Pedidos:*\n`;
        adminText += `• !listapedidos - Ver todos los pedidos\n`;
        adminText += `• !pedidospendientes - Solo pedidos pendientes\n`;
        adminText += `• !buscarpedido [ID] - Buscar pedido específico\n`;
        adminText += `• !cambiarestado [ID] [estado] - Cambiar estado\n\n`;
        
        adminText += `👥 *Gestión de Clientes:*\n`;
        adminText += `• !buscarcliente [término] - Buscar cliente\n\n`;
        
        adminText += `📊 *Reportes y Análisis:*\n`;
        adminText += `• !estadisticas - Estadísticas generales\n`;
        adminText += `• !reporte [días] - Reporte de ventas\n\n`;
        
        adminText += `🔧 *Sistema:*\n`;
        adminText += `• !backup - Crear backup manual\n`;
        adminText += `• !exportar - Exportar datos a CSV\n`;
        adminText += `• !salud - Estado del sistema\n\n`;
        
        adminText += `📋 *Estados disponibles:*\n`;
        config.estadosPedidos.forEach(estado => {
            adminText += `• ${estado}\n`;
        });
        
        await this.sock.sendMessage(sender, { text: adminText });
    }

    // Mostrar todos los pedidos (admin)
    async mostrarTodosPedidos(sender) {
        if (this.pedidos.length === 0) {
            await this.sock.sendMessage(sender, { text: '📋 No hay pedidos registrados.' });
            return;
        }
        
        let listText = `📋 *TODOS LOS PEDIDOS (${this.pedidos.length})*\n\n`;
        
        this.pedidos
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 20) // Mostrar solo los últimos 20
            .forEach(pedido => {
                const estadoEmoji = this.obtenerEmojiEstado(pedido.estado);
                const fecha = new Date(pedido.fecha).toLocaleDateString('es-ES');
                
                listText += `${estadoEmoji} *${pedido.id}*\n`;
                listText += `   👤 ${pedido.nombreCliente}\n`;
                listText += `   📅 ${fecha}\n`;
                listText += `   📊 ${pedido.estado.toUpperCase()}\n`;
                listText += `   💰 ${Utils.formatearMoneda(pedido.total)}\n\n`;
            });
            
        if (this.pedidos.length > 20) {
            listText += `... y ${this.pedidos.length - 20} pedidos más\n\n`;
        }
        
        listText += `💡 Usa !buscarpedido [ID] para ver detalles`;
        
        await this.sock.sendMessage(sender, { text: listText });
    }

    // Cambiar estado de pedido (admin)
    async cambiarEstadoPedido(sender, pedidoId, nuevoEstado) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        
        if (!pedido) {
            await this.sock.sendMessage(sender, { text: '❌ Pedido no encontrado.' });
            return;
        }
        
        if (!config.estadosPedidos.includes(nuevoEstado.toLowerCase())) {
            const estadosTexto = config.estadosPedidos.join(', ');
            await this.sock.sendMessage(sender, { 
                text: `❌ Estado inválido.\n\nEstados disponibles: ${estadosTexto}` 
            });
            return;
        }
        
        const estadoAnterior = pedido.estado;
        pedido.estado = nuevoEstado.toLowerCase();
        pedido.ultimaActualizacion = new Date().toISOString();
        
        this.guardarDatos();
        
        // Confirmación al admin
        await this.sock.sendMessage(sender, { 
            text: `✅ Estado del pedido ${pedidoId} cambiado:\n${estadoAnterior.toUpperCase()} → ${nuevoEstado.toUpperCase()}` 
        });
        
        // Notificar al cliente si está habilitado
        if (config.notificaciones.cambioEstado) {
            await this.notificarCambioEstado(pedido, estadoAnterior);
        }
        
        Utils.log('info', `Estado cambiado: ${pedidoId}`, { 
            anterior: estadoAnterior, 
            nuevo: nuevoEstado 
        });
    }

    // Buscar pedido específico (admin)
    async buscarPedido(sender, pedidoId) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        
        if (!pedido) {
            await this.sock.sendMessage(sender, { text: '❌ Pedido no encontrado.' });
            return;
        }
        
        const resumenAdmin = this.generarResumenAdmin(pedido);
        await this.sock.sendMessage(sender, { text: resumenAdmin });
    }

    // Generar resumen para administrador
    generarResumenAdmin(pedido) {
        const estadoEmoji = this.obtenerEmojiEstado(pedido.estado);
        const fechaCreacion = new Date(pedido.fecha).toLocaleString('es-ES');
        
        let resumen = `${estadoEmoji} *PEDIDO ${pedido.id}* (Admin)\n\n`;
        
        resumen += `👤 *Cliente:* ${pedido.nombreCliente}\n`;
        resumen += `📱 *Teléfono:* ${pedido.telefono}\n`;
        resumen += `🆔 *WhatsApp:* ${pedido.cliente.replace('@s.whatsapp.net', '')}\n`;
        resumen += `📅 *Fecha:* ${fechaCreacion}\n`;
        resumen += `📊 *Estado:* ${pedido.estado.toUpperCase()}\n\n`;
        
        resumen += `📦 *PRODUCTOS:*\n`;
        pedido.items.forEach((item, index) => {
            resumen += `${index + 1}. ${item.producto}\n`;
            resumen += `   • Cantidad: ${item.cantidad}\n`;
            resumen += `   • Precio: ${Utils.formatearMoneda(item.precio)} c/u\n`;
            resumen += `   • Subtotal: ${Utils.formatearMoneda(item.cantidad * item.precio)}\n\n`;
        });
        
        resumen += `💰 *TOTAL: ${Utils.formatearMoneda(pedido.total)}*\n\n`;
        
        if (pedido.tiempoEstimado) {
            resumen += `⏱️ *Tiempo estimado:* ${pedido.tiempoEstimado.mensaje}\n`;
        }
        
        if (pedido.notas) {
            resumen += `📝 *Notas:* ${pedido.notas}\n\n`;
        }
        
        if (pedido.ultimaActualizacion) {
            resumen += `🔄 *Última actualización:* ${new Date(pedido.ultimaActualizacion).toLocaleString('es-ES')}\n`;
        }
        
        resumen += `\n🔧 Para cambiar estado: !cambiarestado ${pedido.id} [nuevo_estado]`;
        
        return resumen;
    }

    // Notificar administradores sobre nuevo pedido
    async notificarAdminsNuevoPedido(pedido) {
        const notificacion = `🔔 *NUEVO PEDIDO RECIBIDO*\n\n` +
            `📋 *ID:* ${pedido.id}\n` +
            `👤 *Cliente:* ${pedido.nombreCliente}\n` +
            `💰 *Total:* ${Utils.formatearMoneda(pedido.total)}\n` +
            `📦 *Productos:* ${pedido.items.length}\n\n` +
            `Usa !buscarpedido ${pedido.id} para ver detalles completos.`;
        
        for (const adminNumber of config.adminNumbers) {
            try {
                const adminJid = adminNumber.includes('@') ? adminNumber : `${adminNumber}@s.whatsapp.net`;
                await this.sock.sendMessage(adminJid, { text: notificacion });
            } catch (error) {
                Utils.log('error', 'Error notificando admin', { adminNumber, error });
            }
        }
    }

    // Notificar cliente sobre cambio de estado
    async notificarCambioEstado(pedido, estadoAnterior) {
        const estadoEmoji = this.obtenerEmojiEstado(pedido.estado);
        const infoEstado = this.obtenerInfoEstado(pedido.estado);
        
        const notificacion = `${estadoEmoji} *ACTUALIZACIÓN DE PEDIDO*\n\n` +
            `📋 *Pedido:* ${pedido.id}\n` +
            `📊 *Nuevo estado:* ${pedido.estado.toUpperCase()}\n\n` +
            `${infoEstado}\n\n` +
            `💡 Usa !estado ${pedido.id} para ver todos los detalles.`;
        
        try {
            const clienteJid = pedido.cliente.includes('@') ? pedido.cliente : `${pedido.cliente}@s.whatsapp.net`;
            await this.sock.sendMessage(clienteJid, { text: notificacion });
            Utils.log('info', `Notificación enviada a cliente: ${pedido.id}`);
        } catch (error) {
            Utils.log('error', 'Error notificando cliente', { pedidoId: pedido.id, error });
        }
    }

    // Configurar tareas programadas
    configurarTareasProgramadas() {
        // Backup automático
        if (config.backup.habilitado) {
            setInterval(() => {
                Utils.crearBackup(this.pedidos, this.clientes);
            }, config.backup.intervaloHoras * 60 * 60 * 1000);
        }
        
        // Verificación de pedidos vencidos (cada 12 horas)
        setInterval(() => {
            if (this.comandos) {
                this.comandos.verificarPedidosVencidos();
            }
        }, 12 * 60 * 60 * 1000);
        
        // Estadísticas diarias (cada 24 horas)
        setInterval(() => {
            Utils.log('info', 'Estadísticas diarias', {
                pedidos: this.pedidos.length,
                clientes: Object.keys(this.clientes).length,
                memoria: process.memoryUsage()
            });
        }, 24 * 60 * 60 * 1000);
    }

    // Manejo de cierre graceful
    configurarCierreGraceful() {
        const cerrar = () => {
            console.log('\n🛑 Cerrando bot...');
            Utils.log('info', 'Bot cerrándose');
            this.guardarDatos();
            Utils.crearBackup(this.pedidos, this.clientes);
            process.exit(0);
        };

        process.on('SIGINT', cerrar);
        process.on('SIGTERM', cerrar);
        process.on('uncaughtException', (error) => {
            Utils.log('error', 'Excepción no capturada', error);
            cerrar();
        });
    }
}

// Inicializar y ejecutar el bot
const bot = new BotPedidosDAATCS();

// Configurar manejo de errores
bot.configurarCierreGraceful();

// Mensaje de inicio
console.log(`
🎨 ================================
   BOT PEDIDOS ${config.empresa.nombre.toUpperCase()}
   ${config.empresa.eslogan}
================================ 🎨
`);

// Iniciar bot
bot.inicializar().catch(error => {
    console.error('❌ Error crítico:', error);
    process.exit(1);
});

module.exports = BotPedidosDAATCS;
