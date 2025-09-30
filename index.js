const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

// CONFIGURACIÓN DAATCS STUDIOS
const EMPRESA_INFO = {
  nombre: 'DAATCS STUDIOS',
  tipo: 'Sublimaciones y Estampados',
  grupoAutorizado: 'PEDIDOS DAATCS',
  grupoId: null,
  telefono: '+502 4218 1782',
  ubicacion: 'Guatemala'
};

// Sistema de base de datos simple para pedidos
let pedidos = {};
let productos = {};
let clientes = {};
let configuracion = {
  grupoAutorizado: null,
  activo: true
};

// Cargar datos guardados
function cargarDatos() {
  try {
    if (fs.existsSync('./data/pedidos.json')) {
      pedidos = JSON.parse(fs.readFileSync('./data/pedidos.json', 'utf8'));
    }
    if (fs.existsSync('./data/productos.json')) {
      productos = JSON.parse(fs.readFileSync('./data/productos.json', 'utf8'));
    }
    if (fs.existsSync('./data/clientes.json')) {
      clientes = JSON.parse(fs.readFileSync('./data/clientes.json', 'utf8'));
    }
    if (fs.existsSync('./data/configuracion.json')) {
      configuracion = JSON.parse(fs.readFileSync('./data/configuracion.json', 'utf8'));
    }
  } catch (error) {
    console.log('Error cargando datos:', error);
  }
}

// Guardar datos
function guardarDatos() {
  try {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data');
    }
    fs.writeFileSync('./data/pedidos.json', JSON.stringify(pedidos, null, 2));
    fs.writeFileSync('./data/productos.json', JSON.stringify(productos, null, 2));
    fs.writeFileSync('./data/clientes.json', JSON.stringify(clientes, null, 2));
    fs.writeFileSync('./data/configuracion.json', JSON.stringify(configuracion, null, 2));
  } catch (error) {
    console.log('Error guardando datos:', error);
  }
}

// Verificar si el mensaje viene del grupo autorizado
function esGrupoAutorizado(from, sock) {
  if (!from.includes('@g.us')) {
    return false;
  }

  if (configuracion.grupoAutorizado && from === configuracion.grupoAutorizado) {
    return true;
  }

  return false;
}

// Función para configurar el grupo autorizado
async function configurarGrupo(sock, groupId) {
  try {
    const groupMetadata = await sock.groupMetadata(groupId);
    if (groupMetadata.subject.includes('PEDIDOS DAATCS')) {
      configuracion.grupoAutorizado = groupId;
      guardarDatos();
      console.log(`Grupo autorizado configurado: ${groupMetadata.subject}`);
      return true;
    }
  } catch (error) {
    console.log('Error configurando grupo:', error);
  }
  return false;
}

// Generar ID único para pedidos
function generarIdPedido() {
  return 'PED-' + Date.now() + Math.floor(Math.random() * 1000);
}

// Formatear fecha
function formatearFecha(timestamp) {
  return new Date(timestamp).toLocaleString('es-ES');
}

// Comandos del bot
const comandos = {
  '.menu': (sock, from) => {
    const menu = `🎨 *DAATCS STUDIOS - SUBLIMACIONES* 🎨

📋 *COMANDOS DISPONIBLES:*

*ℹ️ INFORMACIÓN GENERAL:*
• .productos - Ver catálogo completo de sublimación.
• .contacto - Ver información de contacto de DAATCS.
• .materiales - Conocer los materiales que utilizamos.
• .tiempos - Consultar tiempos de entrega estimados.

*🛒 GESTIÓN DE PEDIDOS:*
• .registrarme [nombre] [teléfono] [dirección] - Crea tu perfil de cliente.
• .nuevopedido - Inicia un nuevo pedido.
• .agregaralcarrito [id_pedido] [id_producto] [cantidad] - Agrega un producto a tu pedido.
• .mispedidos - Revisa el historial de tus pedidos.
• .pedido [id_pedido] - Ve el detalle de un pedido específico.
• .confirmarpedido [id_pedido] - Confirma un pedido para que entre a producción.

*👨‍💼 ADMINISTRACIÓN (Solo Admins):*
• .agregarproducto [nombre] [precio] [descripción] - Agrega un nuevo producto al catálogo.

💫 *DAATCS STUDIOS* - Sublimaciones de alta calidad
📍 ${EMPRESA_INFO.ubicacion}
📱 ${EMPRESA_INFO.telefono}

_Bot exclusivo para grupo PEDIDOS DAATCS_`;

    sock.sendMessage(from, { text: menu });
  },

  '.contacto': (sock, from) => {
    const contacto = `📞 *CONTACTO DAATCS STUDIOS* 📞

🎨 *Especialistas en Sublimaciones*

📱 *WhatsApp:* ${EMPRESA_INFO.telefono}
📧 *Email:* daatcsstidoos@gmail.com
📍 *Ubicación:* ${EMPRESA_INFO.ubicacion}
🌐 *Web:* https://jr23cr.github.io/daatcsstudio.github.io/

⏰ *Horarios de Atención:*
• Lunes a Viernes: 8:00 AM - 6:00 PM
• Sábados: 9:00 AM - 2:00 PM
• Domingos: Solo WhatsApp

🎯 *Servicios:*
• Sublimación en textiles
• Estampados personalizados
• Mugs y termos
• Cojines y almohadas
• Productos promocionales
• Diseños personalizados

💎 *¡Calidad garantizada en cada producto!*`;

    sock.sendMessage(from, { text: contacto });
  },

  '.materiales': (sock, from) => {
    const materiales = `🧵 *MATERIALES DISPONIBLES - DAATCS STUDIOS* 🧵

*👕 TEXTILES:*
• Polyester 100% (Recomendado)
• Sublimable blanco/claro
• Camisetas, hoodies, gorras
• Uniformes deportivos

*☕ PRODUCTOS RÍGIDOS:*
• Mugs cerámicos blancos
• Termos sublimables
• Mouse pads
• Azulejos cerámicos

*🏠 DECORACIÓN:*
• Cojines 40x40cm
• Almohadas personalizadas
• Cuadros en MDF
• Portaretratos

*📝 REQUERIMIENTOS:*
• Imágenes mínimo 300 DPI
• Formato PNG o JPEG
• Fondos transparentes (logos)
• Colores RGB para mejor resultado

✨ *Todos nuestros materiales son de primera calidad*`;

    sock.sendMessage(from, { text: materiales });
  },

  '.tiempos': (sock, from) => {
    const tiempos = `⏰ *TIEMPOS DE ENTREGA - DAATCS STUDIOS* ⏰

*🚀 PRODUCTOS ESTÁNDAR:*
• Mugs y termos: 2-3 días hábiles
• Camisetas (1-5 unidades): 3-4 días
• Cojines: 2-3 días hábiles
• Mouse pads: 1-2 días hábiles

*📦 PEDIDOS GRANDES:*
• 6-20 piezas: 5-7 días hábiles
• 21-50 piezas: 7-10 días hábiles
• +50 piezas: 10-15 días hábiles

*🎨 DISEÑOS PERSONALIZADOS:*
• Con diseño incluido: +1-2 días
• Revisiones de diseño: +1 día
• Diseños complejos: +2-3 días

*🚚 ENTREGA:*
• Recogida en tienda: Sin costo
• Domicilio local: $5.000 - $10.000
• Envío nacional: $15.000 - $25.000

⚠️ *Los tiempos pueden variar en temporadas altas*`;

    sock.sendMessage(from, { text: tiempos });
  },

  '.agregarproducto': (sock, from, args, sender) => {
    if (!esAdmin(sender)) {
      sock.sendMessage(from, { text: '❌ Solo los administradores pueden agregar productos.' });
      return;
    }

    if (args.length < 3) {
      sock.sendMessage(from, { text: '❌ Uso: .agregarproducto [nombre] [precio] [descripción]' });
      return;
    }

    const [nombre, precio, ...descripcionArr] = args;
    const descripcion = descripcionArr.join(' ');
    const id = 'PROD-' + Date.now();

    productos[id] = {
      id,
      nombre,
      precio: parseFloat(precio),
      descripcion,
      disponible: true,
      fechaCreacion: Date.now()
    };

    guardarDatos();
    sock.sendMessage(from, {
      text: `✅ Producto agregado exitosamente:\n\n📦 *${nombre}*\n💰 Precio: $${precio}\n📝 ${descripcion}\n🆔 ID: ${id}`
    });
  },

  '.productos': (sock, from) => {
    const listaProductos = Object.values(productos).filter(p => p.disponible);

    if (listaProductos.length === 0) {
      sock.sendMessage(from, { text: '📦 No hay productos disponibles actualmente.' });
      return;
    }

    let mensaje = '📦 *PRODUCTOS DISPONIBLES:*\n\n';
    listaProductos.forEach(producto => {
      mensaje += `🆔 *${producto.id}*\n`;
      mensaje += `📝 ${producto.nombre}\n`;
      mensaje += `💰 $${producto.precio}\n`;
      mensaje += `📋 ${producto.descripcion}\n\n`;
    });

    sock.sendMessage(from, { text: mensaje });
  },

  '.registrarme': (sock, from, args, sender) => {
    if (args.length < 3) {
      sock.sendMessage(from, { text: '❌ Uso: .registrarme [nombre] [teléfono] [dirección]' });
      return;
    }

    const [nombre, telefono, ...direccionArr] = args;
    const direccion = direccionArr.join(' ');

    clientes[sender] = {
      id: sender,
      nombre,
      telefono,
      direccion,
      pedidos: [],
      fechaRegistro: Date.now()
    };

    guardarDatos();
    sock.sendMessage(from, {
      text: `✅ Te has registrado exitosamente!\n\n👤 *Perfil creado:*\n📝 Nombre: ${nombre}\n📱 Teléfono: ${telefono}\n🏠 Dirección: ${direccion}`
    });
  },

  '.nuevopedido': (sock, from, args, sender) => {
    if (!clientes[sender]) {
      sock.sendMessage(from, { text: '❌ Primero debes registrarte usando: .registrarme [nombre] [teléfono] [dirección]' });
      return;
    }

    const idPedido = generarIdPedido();

    pedidos[idPedido] = {
      id: idPedido,
      cliente: sender,
      productos: [],
      total: 0,
      estado: 'borrador',
      fecha: Date.now(),
      notas: ''
    };

    clientes[sender].pedidos.push(idPedido);
    guardarDatos();

    sock.sendMessage(from, {
      text: `🛍️ *Nuevo pedido creado*\n\n🆔 ID: ${idPedido}\n📅 Fecha: ${formatearFecha(Date.now())}\n\n📝 Para agregar productos usa:\n.agregaralcarrito [id_pedido] [id_producto] [cantidad]\n\nEjemplo: .agregaralcarrito ${idPedido} PROD-123 2`
    });
  },

  '.agregaralcarrito': (sock, from, args, sender) => {
    if (args.length < 3) {
      sock.sendMessage(from, { text: '❌ Uso: .agregaralcarrito [id_pedido] [id_producto] [cantidad]' });
      return;
    }

    const [idPedido, idProducto, cantidadStr] = args;
    const cantidad = parseInt(cantidadStr);

    if (!pedidos[idPedido]) {
      sock.sendMessage(from, { text: '❌ Pedido no encontrado.' });
      return;
    }

    if (pedidos[idPedido].cliente !== sender) {
      sock.sendMessage(from, { text: '❌ Este pedido no te pertenece.' });
      return;
    }

    if (!productos[idProducto] || !productos[idProducto].disponible) {
      sock.sendMessage(from, { text: '❌ Producto no encontrado o no disponible.' });
      return;
    }

    if (cantidad <= 0) {
      sock.sendMessage(from, { text: '❌ La cantidad debe ser mayor a 0.' });
      return;
    }

    const producto = productos[idProducto];
    const subtotal = producto.precio * cantidad;

    const productoExistente = pedidos[idPedido].productos.find(p => p.id === idProducto);

    if (productoExistente) {
      productoExistente.cantidad += cantidad;
      productoExistente.subtotal = productoExistente.cantidad * producto.precio;
    } else {
      pedidos[idPedido].productos.push({
        id: idProducto,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: cantidad,
        subtotal: subtotal
      });
    }

    pedidos[idPedido].total = pedidos[idPedido].productos.reduce((sum, p) => sum + p.subtotal, 0);

    guardarDatos();

    sock.sendMessage(from, {
      text: `✅ Producto agregado al pedido ${idPedido}\n\n📦 ${producto.nombre}\n🔢 Cantidad: ${cantidad}\n💰 Subtotal: $${subtotal}\n\n💵 *Total del pedido: $${pedidos[idPedido].total}*`
    });
  },

  '.mispedidos': (sock, from, args, sender) => {
    if (!clientes[sender] || !clientes[sender].pedidos.length) {
      sock.sendMessage(from, { text: '📋 No tienes pedidos registrados.' });
      return;
    }

    let mensaje = '🛍️ *MIS PEDIDOS:*\n\n';

    clientes[sender].pedidos.forEach(idPedido => {
      const pedido = pedidos[idPedido];
      if (pedido) {
        mensaje += `🆔 ${pedido.id}\n`;
        mensaje += `📅 ${formatearFecha(pedido.fecha)}\n`;
        mensaje += `📊 Estado: ${pedido.estado.toUpperCase()}\n`;
        mensaje += `💰 Total: $${pedido.total}\n`;
        mensaje += `📦 Productos: ${pedido.productos.length}\n\n`;
      }
    });

    sock.sendMessage(from, { text: mensaje });
  },

  '.pedido': (sock, from, args, sender) => {
    if (args.length < 1) {
      sock.sendMessage(from, { text: '❌ Uso: .pedido [id_pedido]' });
      return;
    }

    const idPedido = args[0];
    const pedido = pedidos[idPedido];

    if (!pedido) {
      sock.sendMessage(from, { text: '❌ Pedido no encontrado.' });
      return;
    }

    if (pedido.cliente !== sender && !esAdmin(sender)) {
      sock.sendMessage(from, { text: '❌ No tienes permiso para ver este pedido.' });
      return;
    }

    let mensaje = `🛍️ *DETALLE DEL PEDIDO*\n\n`;
    mensaje += `🆔 ID: ${pedido.id}\n`;
    mensaje += `👤 Cliente: ${clientes[pedido.cliente]?.nombre || 'Desconocido'}\n`;
    mensaje += `📅 Fecha: ${formatearFecha(pedido.fecha)}\n`;
    mensaje += `📊 Estado: ${pedido.estado.toUpperCase()}\n\n`;

    mensaje += `📦 *PRODUCTOS:*\n`;
    pedido.productos.forEach(producto => {
      mensaje += `• ${producto.nombre}\n`;
      mensaje += `  💰 $${producto.precio} x ${producto.cantidad} = $${producto.subtotal}\n\n`;
    });

    mensaje += `💵 *TOTAL: $${pedido.total}*\n`;

    if (pedido.notas) {
      mensaje += `\n📝 *Notas:* ${pedido.notas}`;
    }

    sock.sendMessage(from, { text: mensaje });
  },

  '.confirmarpedido': (sock, from, args, sender) => {
    if (args.length < 1) {
      sock.sendMessage(from, { text: '❌ Uso: .confirmarpedido [id_pedido]' });
      return;
    }

    const idPedido = args[0];
    const pedido = pedidos[idPedido];

    if (!pedido) {
      sock.sendMessage(from, { text: '❌ Pedido no encontrado.' });
      return;
    }

    if (pedido.cliente !== sender && !esAdmin(sender)) {
      sock.sendMessage(from, { text: '❌ No tienes permiso para confirmar este pedido.' });
      return;
    }

    if (pedido.productos.length === 0) {
      sock.sendMessage(from, { text: '❌ No se puede confirmar un pedido vacío.' });
      return;
    }

    pedido.estado = 'confirmado';
    pedido.fechaConfirmacion = Date.now();

    guardarDatos();

    sock.sendMessage(from, {
      text: `✅ Pedido ${idPedido} confirmado exitosamente!\n\n📦 Se procesará en breve.\n💰 Total: $${pedido.total}`
    });

    if (esAdmin(sender) && pedido.cliente !== sender) {
      sock.sendMessage(pedido.cliente + '@s.whatsapp.net', {
        text: `✅ Tu pedido ${idPedido} ha sido confirmado!\n💰 Total: $${pedido.total}\nSe procesará en breve.`
      });
    }
  }
};

// Obtener tiempo de producción según categoría
function obtenerTiempoProduccion(categoria) {
  const tiempos = {
    'mug': '2-3 días hábiles',
    'termo': '2-3 días hábiles',
    'textil': '3-4 días hábiles',
    'cojin': '2-3 días hábiles',
    'mousepad': '1-2 días hábiles',
    'personalizado': '5-7 días hábiles'
  };
  return tiempos[categoria.toLowerCase()] || '3-5 días hábiles';
}

// Función para verificar si es admin
function esAdmin(sender) {
  const admins = ['50242181782', '50255813076', '50232682854']; // Reemplazar con números reales de DAATCS
  return admins.includes(sender.replace('@s.whatsapp.net', ''));
}

// Función principal del bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' }))
    },
    printQRInTerminal: false // Desactiva el QR automático de Baileys
  });

  cargarDatos();

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      // Genera el QR en la terminal
      qrcode.generate(qr, { small: true });
      console.log('📱 Escanea el código QR con WhatsApp para autenticar el bot.');
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexión cerrada. Reconectando...', shouldReconnect);

      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('🤖 Bot de pedidos conectado exitosamente!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];

    if (!message.key.fromMe && m.type === 'notify') {
      const from = message.key.remoteJid;
      const sender = message.key.participant || message.key.remoteJid;
      const body = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

      if (!esGrupoAutorizado(from, sock)) {
        if (from.includes('@g.us')) {
          try {
            const groupMetadata = await sock.groupMetadata(from);
            if (groupMetadata.subject.includes('PEDIDOS DAATCS')) {
              await configurarGrupo(sock, from);
              sock.sendMessage(from, {
                text: `🎨 *DAATCS STUDIOS ACTIVADO* 🎨\n\n✅ Bot configurado para este grupo\n📱 Usa .menu para ver comandos disponibles\n\n🎯 *Especialistas en sublimaciones de alta calidad*`
              });
            } else {
              return;
            }
          } catch (error) {
            return;
          }
        } else {
          // No responder a mensajes privados para evitar confusiones.
          return;
        }
      }

      const args = body.trim().split(/\s+/);
      const command = args.shift()?.toLowerCase();

      if (comandos[command]) {
        try {
          comandos[command](sock, from, args, sender.replace('@s.whatsapp.net', ''));
        } catch (error) {
          console.error('Error ejecutando comando:', error);
          sock.sendMessage(from, { text: '❌ Error interno. Intenta de nuevo o contacta a DAATCS Studios.' });
        }
      } else if (body.toLowerCase().includes('hola') || body.toLowerCase().includes('buenos')) {
        sock.sendMessage(from, {
          text: `🎨 ¡Hola! Bienvenido a *DAATCS STUDIOS* 🎨\n\n✨ *Especialistas en sublimaciones*\n📱 Usa .menu para ver todos los comandos\n🛍️ Usa .productos para ver nuestro catálogo\n\n💫 ¡Estamos aquí para crear productos únicos!`
        });
      }
    }
  });
}

// Iniciar el bot
startBot().catch(console.error);

console.log('🎨 Iniciando Bot DAATCS STUDIOS - Sublimaciones...');
