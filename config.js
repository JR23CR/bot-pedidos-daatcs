// config.js - Configuración DAATCS STUDIOS
const config = {
  // Información de la empresa
  empresa: {
    nombre: 'DAATCS STUDIOS',
    tipo: 'Sublimaciones y Estampados Personalizados',
    telefono: '+50242181782', // Actualizar con número real
    email: 'daatcsstudios@gmail.com',
    ubicacion: 'Guatemala',
    web: 'https://jr23cr.github.io/daatcsstudio.github.io/'
  },

  // Números de administradores de DAATCS (sin +, solo números)
  admins: [
    '50242181782', // Reemplaza con tu número
    '50255813076',
    '50232682854'  // Agrega más admins aquí
  ],
  
  // Configuración del bot
  botName: '🎨 DAATCS STUDIOS Bot',
  prefix: '.',
  grupoAutorizado: 'PEDIDOS DAATCS', // Nombre exacto del grupo
  
  // Categorías de productos de sublimación
  categorias: {
    textil: {
      nombre: 'Textiles',
      icono: '👕',
      descripcion: 'Camisetas, hoodies, gorras sublimables',
      tiempo: '3-4 días hábiles'
    },
    mug: {
      nombre: 'Mugs',
      icono: '☕',
      descripcion: 'Mugs cerámicos sublimables',
      tiempo: '2-3 días hábiles'
    },
    termo: {
      nombre: 'Termos',
      icono: '🥤',
      descripcion: 'Termos y botellas sublimables',
      tiempo: '2-3 días hábiles'
    },
    cojin: {
      nombre: 'Cojines',
      icono: '🛏️',
      descripcion: 'Cojines y almohadas personalizadas',
      tiempo: '2-3 días hábiles'
    },
    mousepad: {
      nombre: 'Mouse Pads',
      icono: '🖱️',
      descripcion: 'Mouse pads sublimables',
      tiempo: '1-2 días hábiles'
    },
    personalizado: {
      nombre: 'Personalizado',
      icono: '🎨',
      descripcion: 'Productos personalizados especiales',
      tiempo: '5-7 días hábiles'
    }
  },
  
  // Configuración de base de datos
  database: {
    pedidos: './data/pedidos.json',
    productos: './data/productos.json',
    clientes: './data/clientes.json',
    configuracion: './data/configuracion.json'
  },
  
  // Estados de pedidos específicos para sublimación
  estadosPedido: {
    borrador: '📝 En construcción',
    confirmado: '✅ Confirmado - Por iniciar', 
    diseñando: '🎨 Creando diseño',
    procesando: '⚙️ En producción',
    sublimando: '🔥 Sublimando',
    control_calidad: '🔍 Control de calidad',
    listo: '📦 Listo para entrega',
    enviado: '🚚 Enviado',
    entregado: '✅ Entregado',
    cancelado: '❌ Cancelado'
  },
  
  // Mensajes personalizados para DAATCS
  mensajes: {
    bienvenida: '🎨 ¡Bienvenido a DAATCS STUDIOS! ✨\nEspecialistas en sublimaciones de alta calidad.\nUsa .menu para ver todos los comandos disponibles.',
    noRegistrado: '❌ Primero debes registrarte usando:\n.registrarme [nombre] [teléfono] [dirección]',
    soloAdmin: '❌ Solo los administradores de DAATCS pueden usar este comando.',
    soloGrupo: '❌ Este bot solo funciona en el grupo "PEDIDOS DAATCS".\nÚnete para realizar tus pedidos de sublimación.',
    pedidoNoEncontrado: '❌ Pedido no encontrado.',
    productoNoEncontrado: '❌ Producto no encontrado o no disponible.'
  },

  // Horarios de atención
  horarios: {
    lunes_viernes: '8:00 AM - 6:00 PM',
    sabado: '9:00 AM - 2:00 PM', 
    domingo: 'Solo WhatsApp'
  },

  // Precios de envío
  envios: {
    local: { min: 5000, max: 10000 },
    nacional: { min: 15000, max: 25000 },
    recogida: 0
  }
};

module.exports = config;

// utils.js - Funciones utilitarias
const fs = require('fs');

const utils = {
  // Generar ID único
  generarId: (prefix) => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  },
  
  // Formatear fecha
  formatearFecha: (timestamp) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  // Formatear moneda
  formatearMoneda: (cantidad) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(cantidad);
  },
  
  // Guardar datos en archivo JSON
  guardarJSON: (ruta, datos) => {
    try {
      const dir = './data';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      fs.writeFileSync(ruta, JSON.stringify(datos, null, 2));
      return true;
    } catch (error) {
      console.error('Error guardando archivo:', error);
      return false;
    }
  },
  
  // Cargar datos desde archivo JSON
  cargarJSON: (ruta) => {
    try {
      if (fs.existsSync(ruta)) {
        return JSON.parse(fs.readFileSync(ruta, 'utf8'));
      }
      return {};
    } catch (error) {
      console.error('Error cargando archivo:', error);
      return {};
    }
  },
  
  // Validar número de teléfono
  validarTelefono: (telefono) => {
    const regex = /^[+]?[0-9\s\-\(\)]{10,15}$/;
    return regex.test(telefono);
  },
  
  // Limpiar número de WhatsApp
  limpiarNumero: (numero) => {
    return numero.replace('@s.whatsapp.net', '').replace('@g.us', '');
  },
  
  // Crear respaldo de datos
  crearRespaldo: () => {
    const fecha = new Date().toISOString().split('T')[0];
    const respaldoDir = './respaldos';
    
    if (!fs.existsSync(respaldoDir)) {
      fs.mkdirSync(respaldoDir);
    }
    
    try {
      // Copiar archivos de datos
      const archivos = ['pedidos.json', 'productos.json', 'clientes.json'];
      
      archivos.forEach(archivo => {
        const origen = `./data/${archivo}`;
        const destino = `${respaldoDir}/${fecha}-${archivo}`;
        
        if (fs.existsSync(origen)) {
          fs.copyFileSync(origen, destino);
        }
      });
      
      return `Respaldo creado exitosamente: ${fecha}`;
    } catch (error) {
      console.error('Error creando respaldo:', error);
      return 'Error creando respaldo';
    }
  }
};

module.exports = utils;

// comandos-extra.js - Comandos adicionales para el bot
const comandosExtra = {
  // Estadísticas del negocio
  '.estadisticas': (sock, from, args, sender, data) => {
    const { pedidos, productos, clientes } = data;
    
    const totalPedidos = Object.keys(pedidos).length;
    const totalProductos = Object.keys(productos).length;
    const totalClientes = Object.keys(clientes).length;
    
    // Calcular ventas totales
    const ventasTotales = Object.values(pedidos)
      .filter(p => p.estado === 'entregado')
      .reduce((sum, p) => sum + p.total, 0);
    
    // Pedidos por estado
    const estadisticasEstado = {};
    Object.values(pedidos).forEach(pedido => {
      estadisticasEstado[pedido.estado] = (estadisticasEstado[pedido.estado] || 0) + 1;
    });
    
    let mensaje = '📊 *ESTADÍSTICAS DEL NEGOCIO*\n\n';
    mensaje += `👥 Total clientes: ${totalClientes}\n`;
    mensaje += `📦 Total productos: ${totalProductos}\n`;
    mensaje += `🛍️ Total pedidos: ${totalPedidos}\n`;
    mensaje += `💰 Ventas totales: $${ventasTotales}\n\n`;
    
    mensaje += '📈 *PEDIDOS POR ESTADO:*\n';
    Object.entries(estadisticasEstado).forEach(([estado, cantidad]) => {
      mensaje += `• ${estado}: ${cantidad}\n`;
    });
    
    sock.sendMessage(from, { text: mensaje });
  },
  
  // Buscar productos
  '.buscar': (sock, from, args, sender, data) => {
    if (args.length < 1) {
      sock.sendMessage(from, { text: '❌ Uso: .buscar [término de búsqueda]' });
      return;
    }
    
    const termino = args.join(' ').toLowerCase();
    const { productos } = data;
    
    const resultados = Object.values(productos).filter(producto => 
      producto.disponible && 
      (producto.nombre.toLowerCase().includes(termino) || 
       producto.descripcion.toLowerCase().includes(termino))
    );
    
    if (resultados.length === 0) {
      sock.sendMessage(from, { text: `🔍 No se encontraron productos con el término: "${termino}"` });
      return;
    }
    
    let mensaje = `🔍 *RESULTADOS PARA: "${termino}"*\n\n`;
    resultados.forEach(producto => {
      mensaje += `🆔 ${producto.id}\n`;
      mensaje += `📝 ${producto.nombre}\n`;
      mensaje += `💰 $${producto.precio}\n`;
      mensaje += `📋 ${producto.descripcion}\n\n`;
    });
    
    sock.sendMessage(from, { text: mensaje });
  },
  
  // Cambiar estado de pedido
  '.cambiarestado': (sock, from, args, sender, data) => {
    if (args.length < 2) {
      sock.sendMessage(from, { text: '❌ Uso: .cambiarestado [id_pedido] [nuevo_estado]\nEstados: borrador, confirmado, procesando, enviado, entregado, cancelado' });
      return;
    }
    
    const [idPedido, nuevoEstado] = args;
    const { pedidos } = data;
    const pedido = pedidos[idPedido];
    
    if (!pedido) {
      sock.sendMessage(from, { text: '❌ Pedido no encontrado.' });
      return;
    }
    
    const estadosValidos = ['borrador', 'confirmado', 'procesando', 'enviado', 'entregado', 'cancelado'];
    
    if (!estadosValidos.includes(nuevoEstado)) {
      sock.sendMessage(from, { text: '❌ Estado inválido. Estados válidos: ' + estadosValidos.join(', ') });
      return;
    }
    
    const estadoAnterior = pedido.estado;
    pedido.estado = nuevoEstado;
    pedido.fechaActualizacion = Date.now();
    
    sock.sendMessage(from, { 
      text: `✅ Estado del pedido ${idPedido} cambiado de "${estadoAnterior}" a "${nuevoEstado}"` 
    });
    
    // Notificar al cliente si es necesario
    if (sender !== pedido.cliente) {
      sock.sendMessage(pedido.cliente + '@s.whatsapp.net', {
        text: `📦 Tu pedido ${idPedido} cambió de estado:\n${estadoAnterior} → ${nuevoEstado}`
      });
    }
  }
};

module.exports = comandosExtra;
