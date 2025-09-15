module.exports = {
    // Configuración del grupo
    groupName: 'PEDIDOS DAATCS',
    groupId: null, // Se detecta automáticamente
    
    // Números de administradores (formato internacional sin +)
    // Ejemplo: para +52 55 1234 5678 usar '5255123456789'
    adminNumbers: [
        // Agregar aquí los números de los administradores
        // '5215551234567',
        // '5215559876543'
    ],
    
    // Rutas de archivos
    pedidosFile: './data/pedidos.json',
    clientesFile: './data/clientes.json',
    logFile: './logs/bot.log',
    
    // Configuración de la empresa
    empresa: {
        nombre: 'DAATCS Sublimaciones',
        eslogan: 'Tu imagen, nuestro arte',
        contacto: {
            telefono: '', // Teléfono de contacto
            email: '', // Email de contacto
            direccion: '' // Dirección física
        }
    },
    
    // Estados de pedidos disponibles
    estadosPedidos: [
        'pendiente',
        'confirmado', 
        'en_proceso',
        'listo',
        'entregado',
        'cancelado'
    ],
    
    // Productos predefinidos (opcional)
    productos: {
        'taza': {
            nombre: 'Taza Sublimada',
            precioBase: 50,
            tiempoProduccion: '1-2 días'
        },
        'playera': {
            nombre: 'Playera Sublimada',
            precioBase: 120,
            tiempoProduccion: '2-3 días'
        },
        'gorra': {
            nombre: 'Gorra Bordada/Sublimada',
            precioBase: 80,
            tiempoProduccion: '3-4 días'
        },
        'mousepad': {
            nombre: 'Mouse Pad Sublimado',
            precioBase: 35,
            tiempoProduccion: '1 día'
        },
        'llavero': {
            nombre: 'Llavero Sublimado',
            precioBase: 15,
            tiempoProduccion: '1 día'
        }
    },
    
    // Configuración de mensajes automáticos
    mensajes: {
        bienvenida: '¡Bienvenido al sistema de pedidos DAATCS! 🎨\nUsa !ayuda para ver los comandos disponibles.',
        pedidoRecibido: '¡Tu pedido ha sido recibido exitosamente! ✅\nEn breve te confirmaremos los detalles.',
        recordatorioFormato: 'Por favor usa el formato correcto:\nCliente: Tu nombre\nTeléfono: Tu número\nProducto: Producto deseado\nCantidad: Número de piezas\nPrecio: Costo acordado'
    },
    
    // Configuración de notificaciones
    notificaciones: {
        nuevoPedido: true, // Notificar a admins sobre nuevos pedidos
        cambioEstado: true, // Notificar a cliente sobre cambios de estado
        pedidosVencidos: true // Notificar sobre pedidos pendientes antiguos
    },
    
    // Configuración de backup automático
    backup: {
        habilitado: true,
        intervaloHoras: 24, // Backup cada 24 horas
        mantenerArchivos: 7 // Mantener 7 backups
    },
    
    // Configuración de logs
    logging: {
        nivel: 'info', // debug, info, warn, error
        archivo: true,
        consola: true,
        rotacion: true // Rotar logs diariamente
    }
};
