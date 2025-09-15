const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBailieys } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

// Configuración
const CONFIG = {
    groupName: 'PEDIDOS DAATCS',
    groupId: null, // Se detectará automáticamente
    adminNumbers: [], // Números de administradores (formato: 521234567890)
    pedidosFile: './data/pedidos.json',
    clientesFile: './data/clientes.json'
};

// Estructura de datos
let pedidos = [];
let clientes = {};
let groupId = null;

// Cargar datos existentes
function loadData() {
    try {
        if (fs.existsSync(CONFIG.pedidosFile)) {
            pedidos = JSON.parse(fs.readFileSync(CONFIG.pedidosFile, 'utf8'));
        }
        if (fs.existsSync(CONFIG.clientesFile)) {
            clientes = JSON.parse(fs.readFileSync(CONFIG.clientesFile, 'utf8'));
        }
    } catch (error) {
        console.log('Error cargando datos:', error);
    }
}

// Guardar datos
function saveData() {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        fs.writeFileSync(CONFIG.pedidosFile, JSON.stringify(pedidos, null, 2));
        fs.writeFileSync(CONFIG.clientesFile, JSON.stringify(clientes, null, 2));
    } catch (error) {
        console.log('Error guardando datos:', error);
    }
}

// Generar ID único para pedidos
function generatePedidoId() {
    return 'PED' + Date.now().toString().slice(-6);
}

// Formatear fecha
function formatDate(date = new Date()) {
    return date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
}

// Verificar si es admin
function isAdmin(number) {
    return CONFIG.adminNumbers.includes(number);
}

// Procesar pedido
function procesarPedido(message, sender) {
    const lines = message.split('\n');
    const pedidoId = generatePedidoId();
    
    const pedido = {
        id: pedidoId,
        cliente: sender,
        fecha: formatDate(),
        estado: 'pendiente',
        items: [],
        total: 0,
        notas: ''
    };

    // Extraer información del pedido
    let currentSection = '';
    lines.forEach(line => {
        line = line.trim();
        if (line.toLowerCase().includes('cliente:')) {
            pedido.nombreCliente = line.split(':')[1]?.trim() || 'No especificado';
        } else if (line.toLowerCase().includes('teléfono:')) {
            pedido.telefono = line.split(':')[1]?.trim() || 'No especificado';
        } else if (line.toLowerCase().includes('cantidad:')) {
            const cantidad = parseInt(line.split(':')[1]?.trim()) || 1;
            if (pedido.items.length > 0) {
                pedido.items[pedido.items.length - 1].cantidad = cantidad;
            }
        } else if (line.toLowerCase().includes('producto:') || line.toLowerCase().includes('artículo:')) {
            const producto = line.split(':')[1]?.trim() || line;
            pedido.items.push({
                producto: producto,
                cantidad: 1,
                precio: 0
            });
        } else if (line.toLowerCase().includes('precio:') || line.toLowerCase().includes('total:')) {
            const precio = parseFloat(line.split(':')[1]?.trim()) || 0;
            if (pedido.items.length > 0) {
                pedido.items[pedido.items.length - 1].precio = precio;
            }
        } else if (line.toLowerCase().includes('nota:') || line.toLowerCase().includes('observación:')) {
            pedido.notas = line.split(':')[1]?.trim() || '';
        }
    });

    // Calcular total
    pedido.total = pedido.items.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);

    // Guardar pedido
    pedidos.push(pedido);
    
    // Actualizar cliente
    if (!clientes[sender]) {
        clientes[sender] = {
            nombre: pedido.nombreCliente || 'Cliente',
            telefono: pedido.telefono || 'No especificado',
            pedidos: [],
            totalCompras: 0
        };
    }
    clientes[sender].pedidos.push(pedidoId);
    clientes[sender].totalCompras += pedido.total;

    saveData();
    return pedido;
}

// Generar resumen de pedido
function generarResumenPedido(pedido) {
    let resumen = `🛍️ *PEDIDO REGISTRADO*\n\n`;
    resumen += `📋 *ID:* ${pedido.id}\n`;
    resumen += `👤 *Cliente:* ${pedido.nombreCliente}\n`;
    resumen += `📱 *Teléfono:* ${pedido.telefono}\n`;
    resumen += `📅 *Fecha:* ${pedido.fecha}\n`;
    resumen += `📊 *Estado:* ${pedido.estado.toUpperCase()}\n\n`;
    
    resumen += `📦 *PRODUCTOS:*\n`;
    pedido.items.forEach((item, index) => {
        resumen += `${index + 1}. ${item.producto}\n`;
        resumen += `   • Cantidad: ${item.cantidad}\n`;
        resumen += `   • Precio: $${item.precio}\n`;
        resumen += `   • Subtotal: $${item.cantidad * item.precio}\n\n`;
    });
    
    resumen += `💰 *TOTAL: $${pedido.total}*\n\n`;
    
    if (pedido.notas) {
        resumen += `📝 *Notas:* ${pedido.notas}\n\n`;
    }
    
    resumen += `✅ Tu pedido ha sido registrado exitosamente.`;
    return resumen;
}

// Comandos disponibles
const comandos = {
    '!pedido': 'Registrar un nuevo pedido',
    '!mispedidos': 'Ver mis pedidos',
    '!estado [ID]': 'Consultar estado de un pedido',
    '!admin': 'Comandos de administrador (solo admins)',
    '!ayuda': 'Mostrar esta ayuda'
};

// Comandos de admin
const comandosAdmin = {
    '!listapedidos': 'Ver todos los pedidos',
    '!cambiarestado [ID] [estado]': 'Cambiar estado de pedido',
    '!buscarpedido [ID]': 'Buscar pedido específico',
    '!estadisticas': 'Ver estadísticas generales',
    '!exportar': 'Exportar datos'
};

// Función principal del bot
async function startBot() {
    console.log('🤖 Iniciando Bot de Pedidos DAATCS...');
    
    // Cargar datos
    loadData();
    
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Bot Pedidos DAATCS', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if(qr) {
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;
                
            console.log('Conexión cerrada debido a:', lastDisconnect?.error);
            
            if (shouldReconnect) {
                console.log('Reconectando...');
                startBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot conectado exitosamente!');
        }
    });

    sock.ev.on('groups.update', (updates) => {
        updates.forEach(update => {
            if (update.subject === CONFIG.groupName) {
                groupId = update.id;
                CONFIG.groupId = groupId;
                console.log(`📱 Grupo encontrado: ${CONFIG.groupName} (${groupId})`);
            }
        });
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const text = msg.message.conversation || 
                        msg.message.extendedTextMessage?.text || '';
            
            const sender = msg.key.remoteJid;
            const senderNumber = msg.key.participant || msg.key.remoteJid;
            const isGroup = sender.endsWith('@g.us');

            // Solo procesar mensajes del grupo específico
            if (!isGroup || !sender.includes(CONFIG.groupName.toLowerCase().replace(/\s+/g, ''))) {
                // Verificar si es el grupo correcto por ID si ya lo tenemos
                if (groupId && sender !== groupId) return;
            }

            // Si aún no tenemos el groupId, intentar obtenerlo
            if (!groupId) {
                try {
                    const groupMetadata = await sock.groupMetadata(sender);
                    if (groupMetadata.subject === CONFIG.groupName) {
                        groupId = sender;
                        CONFIG.groupId = groupId;
                        console.log(`📱 Grupo configurado: ${CONFIG.groupName}`);
                    } else {
                        return; // No es nuestro grupo
                    }
                } catch (error) {
                    return; // Error obteniendo metadata, ignorar
                }
            }

            console.log(`📨 Mensaje recibido en ${CONFIG.groupName}: ${text.substring(0, 50)}...`);

            // Procesar comandos
            if (text.startsWith('!')) {
                const command = text.split(' ')[0].toLowerCase();
                const args = text.split(' ').slice(1);

                switch (command) {
                    case '!ayuda':
                        let helpText = `🤖 *BOT PEDIDOS DAATCS* 📋\n\n`;
                        helpText += `*COMANDOS DISPONIBLES:*\n`;
                        Object.entries(comandos).forEach(([cmd, desc]) => {
                            helpText += `${cmd} - ${desc}\n`;
                        });
                        helpText += `\n💡 *Para hacer un pedido:*\n`;
                        helpText += `Usa el formato:\n`;
                        helpText += `Cliente: Tu nombre\n`;
                        helpText += `Teléfono: Tu número\n`;
                        helpText += `Producto: Nombre del producto\n`;
                        helpText += `Cantidad: Número de piezas\n`;
                        helpText += `Precio: Costo por pieza\n`;
                        helpText += `Nota: Observaciones adicionales`;
                        
                        await sock.sendMessage(sender, { text: helpText });
                        break;

                    case '!mispedidos':
                        const misPedidos = pedidos.filter(p => p.cliente === senderNumber);
                        if (misPedidos.length === 0) {
                            await sock.sendMessage(sender, { text: '❌ No tienes pedidos registrados.' });
                        } else {
                            let listText = `📋 *TUS PEDIDOS:*\n\n`;
                            misPedidos.forEach(pedido => {
                                listText += `🔸 *${pedido.id}* - ${pedido.fecha}\n`;
                                listText += `   Estado: ${pedido.estado.toUpperCase()}\n`;
                                listText += `   Total: $${pedido.total}\n\n`;
                            });
                            await sock.sendMessage(sender, { text: listText });
                        }
                        break;

                    case '!estado':
                        if (args.length === 0) {
                            await sock.sendMessage(sender, { text: '❌ Uso: !estado [ID_PEDIDO]' });
                            break;
                        }
                        const pedidoId = args[0];
                        const pedidoConsulta = pedidos.find(p => p.id === pedidoId && p.cliente === senderNumber);
                        if (!pedidoConsulta) {
                            await sock.sendMessage(sender, { text: '❌ Pedido no encontrado o no tienes permisos.' });
                        } else {
                            await sock.sendMessage(sender, { text: generarResumenPedido(pedidoConsulta) });
                        }
                        break;

                    case '!admin':
                        if (!isAdmin(senderNumber)) {
                            await sock.sendMessage(sender, { text: '❌ No tienes permisos de administrador.' });
                            break;
                        }
                        let adminText = `👑 *COMANDOS DE ADMINISTRADOR:*\n\n`;
                        Object.entries(comandosAdmin).forEach(([cmd, desc]) => {
                            adminText += `${cmd} - ${desc}\n`;
                        });
                        await sock.sendMessage(sender, { text: adminText });
                        break;

                    case '!listapedidos':
                        if (!isAdmin(senderNumber)) {
                            await sock.sendMessage(sender, { text: '❌ No tienes permisos de administrador.' });
                            break;
                        }
                        if (pedidos.length === 0) {
                            await sock.sendMessage(sender, { text: '📋 No hay pedidos registrados.' });
                        } else {
                            let adminListText = `📋 *TODOS LOS PEDIDOS:*\n\n`;
                            pedidos.forEach(pedido => {
                                adminListText += `🔸 *${pedido.id}* - ${pedido.nombreCliente}\n`;
                                adminListText += `   Estado: ${pedido.estado.toUpperCase()}\n`;
                                adminListText += `   Total: $${pedido.total}\n`;
                                adminListText += `   Fecha: ${pedido.fecha}\n\n`;
                            });
                            await sock.sendMessage(sender, { text: adminListText });
                        }
                        break;

                    case '!cambiarestado':
                        if (!isAdmin(senderNumber)) {
                            await sock.sendMessage(sender, { text: '❌ No tienes permisos de administrador.' });
                            break;
                        }
                        if (args.length < 2) {
                            await sock.sendMessage(sender, { text: '❌ Uso: !cambiarestado [ID_PEDIDO] [pendiente|en_proceso|completado|cancelado]' });
                            break;
                        }
                        const pedidoCambio = pedidos.find(p => p.id === args[0]);
                        if (!pedidoCambio) {
                            await sock.sendMessage(sender, { text: '❌ Pedido no encontrado.' });
                        } else {
                            const nuevoEstado = args[1].toLowerCase();
                            const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
                            if (!estadosValidos.includes(nuevoEstado)) {
                                await sock.sendMessage(sender, { text: '❌ Estado inválido. Usa: pendiente, en_proceso, completado, cancelado' });
                            } else {
                                pedidoCambio.estado = nuevoEstado;
                                saveData();
                                await sock.sendMessage(sender, { text: `✅ Estado del pedido ${args[0]} cambiado a: ${nuevoEstado.toUpperCase()}` });
                            }
                        }
                        break;

                    case '!estadisticas':
                        if (!isAdmin(senderNumber)) {
                            await sock.sendMessage(sender, { text: '❌ No tienes permisos de administrador.' });
                            break;
                        }
                        const totalPedidos = pedidos.length;
                        const totalVentas = pedidos.reduce((sum, p) => sum + p.total, 0);
                        const estadosCount = pedidos.reduce((acc, p) => {
                            acc[p.estado] = (acc[p.estado] || 0) + 1;
                            return acc;
                        }, {});
                        
                        let statsText = `📊 *ESTADÍSTICAS DAATCS*\n\n`;
                        statsText += `📦 Total pedidos: ${totalPedidos}\n`;
                        statsText += `💰 Total ventas: $${totalVentas}\n`;
                        statsText += `👥 Total clientes: ${Object.keys(clientes).length}\n\n`;
                        statsText += `📋 *Por estado:*\n`;
                        Object.entries(estadosCount).forEach(([estado, count]) => {
                            statsText += `• ${estado.toUpperCase()}: ${count}\n`;
                        });
                        
                        await sock.sendMessage(sender, { text: statsText });
                        break;

                    default:
                        // Comando no reconocido
                        break;
                }
            } else {
                // Detectar si es un pedido (contiene palabras clave)
                const palabrasClavePedido = ['cliente:', 'producto:', 'cantidad:', 'precio:', 'teléfono:', 'artículo:'];
                const esPedido = palabrasClavePedido.some(palabra => 
                    text.toLowerCase().includes(palabra.toLowerCase())
                );

                if (esPedido) {
                    try {
                        const nuevoPedido = procesarPedido(text, senderNumber);
                        const resumen = generarResumenPedido(nuevoPedido);
                        await sock.sendMessage(sender, { text: resumen });
                        console.log(`✅ Pedido ${nuevoPedido.id} registrado exitosamente`);
                    } catch (error) {
                        console.error('Error procesando pedido:', error);
                        await sock.sendMessage(sender, { 
                            text: '❌ Error procesando el pedido. Verifica el formato e intenta nuevamente.\n\nUsa !ayuda para ver el formato correcto.' 
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    });

    return sock;
}

// Iniciar el bot
startBot().catch(console.error);

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando bot...');
    saveData();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando bot...');
    saveData();
    process.exit(0);
});

console.log('🚀 Bot de Pedidos DAATCS iniciado');
console.log('📱 Esperando conexión a WhatsApp...');
