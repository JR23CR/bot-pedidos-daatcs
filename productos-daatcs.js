// productos-daatcs.js - Catálogo predefinido DAATCS STUDIOS
const productosDaatcs = {
  // TEXTILES
  'SUB-001': {
    id: 'SUB-001',
    categoria: 'textil',
    nombre: 'Camiseta Básica Sublimable',
    precio: 25000,
    descripcion: 'Camiseta 100% poliéster, ideal para sublimación. Tallas S a XXL.',
    disponible: true,
    tiempoProduccion: '3-4 días hábiles',
    imagen: 'camiseta-basica.jpg',
    especificaciones: {
      material: '100% Poliéster',
      tallas: ['S', 'M', 'L', 'XL', 'XXL'],
      colores: ['Blanco', 'Gris claro'],
      cuidado: 'Lavar en agua fría, no planchar directo'
    }
  },
  
  'SUB-002': {
    id: 'SUB-002',
    categoria: 'textil',
    nombre: 'Hoodie Premium Sublimable',
    precio: 45000,
    descripcion: 'Sudadera con capota, 100% poliéster, excelente para sublimación.',
    disponible: true,
    tiempoProduccion: '4-5 días hábiles',
    especificaciones: {
      material: '100% Poliéster',
      tallas: ['S', 'M', 'L', 'XL'],
      colores: ['Blanco', 'Gris claro'],
      caracteristicas: 'Capota ajustable, bolsillo frontal'
    }
  },

  'SUB-003': {
    id: 'SUB-003',
    categoria: 'textil',
    nombre: 'Gorra Sublimable',
    precio: 18000,
    descripcion: 'Gorra de poliéster blanca, ideal para logos y diseños.',
    disponible: true,
    tiempoProduccion: '2-3 días hábiles',
    especificaciones: {
      material: '100% Poliéster',
      color: 'Blanco',
      ajuste: 'Talla única ajustable',
      area_impresion: 'Frontal completa'
    }
  },

  // MUGS Y TERMOS
  'SUB-004': {
    id: 'SUB-004',
    categoria: 'mug',
    nombre: 'Mug Cerámico Blanco 11oz',
    precio: 12000,
    descripcion: 'Mug cerámico sublimable, acabado brillante, 11oz.',
    disponible: true,
    tiempoProduccion: '2-3 días hábiles',
    especificaciones: {
      material: 'Cerámica',
      capacidad: '11oz (330ml)',
      acabado: 'Brillante',
      area_impresion: '360° completa',
      apto: 'Microondas y lavavajillas'
    }
  },

  'SUB-005': {
    id: 'SUB-005',
    categoria: 'mug',
    nombre: 'Mug Mágico Negro 11oz',
    precio: 18000,
    descripcion: 'Mug que cambia de negro a blanco con calor, efecto mágico.',
    disponible: true,
    tiempoProduccion: '3-4 días hábiles',
    especificaciones: {
      material: 'Cerámica especial',
      capacidad: '11oz (330ml)',
      efecto: 'Cambia color con calor',
      temperatura: 'Activación 60°C',
      cuidado: 'Solo lavar a mano'
    }
  },

  'SUB-006': {
    id: 'SUB-006',
    categoria: 'termo',
    nombre: 'Termo Acero Inoxidable 500ml',
    precio: 35000,
    descripcion: 'Termo sublimable con recubrimiento blanco, mantiene temperatura 12h.',
    disponible: true,
    tiempoProduccion: '3-4 días hábiles',
    especificaciones: {
      material: 'Acero inoxidable',
      capacidad: '500ml',
      mantenimiento: 'Calor 12h, Frío 24h',
      acabado: 'Recubrimiento blanco sublimable',
      tapa: 'Rosca hermética'
    }
  },

  // COJINES Y DECORACIÓN
  'SUB-007': {
    id: 'SUB-007',
    categoria: 'cojin',
    nombre: 'Cojín Sublimable 40x40cm',
    precio: 22000,
    descripcion: 'Cojín cuadrado con funda sublimable, relleno incluido.',
    disponible: true,
    tiempoProduccion: '2-3 días hábiles',
    especificaciones: {
      dimension: '40x40cm',
      material: 'Poliéster sublimable',
      relleno: 'Fibra sintética',
      cierre: 'Cremallera invisible',
      lavado: 'Funda removible lavable'
    }
  },

  'SUB-008': {
    id: 'SUB-008',
    categoria: 'cojin',
    nombre: 'Almohada Rectangular 30x50cm',
    precio: 28000,
    descripcion: 'Almohada rectangular sublimable, ideal para sofás.',
    disponible: true,
    tiempoProduccion: '3-4 días hábiles',
    especificaciones: {
      dimension: '30x50cm',
      material: 'Poliéster premium',
      relleno: 'Memory foam suave',
      uso: 'Decorativo y funcional'
    }
  },

  // MOUSE PADS Y ACCESORIOS
  'SUB-009': {
    id: 'SUB-009',
    categoria: 'mousepad',
    nombre: 'Mouse Pad Rectangular 24x19cm',
    precio: 8000,
    descripcion: 'Mouse pad sublimable con base antideslizante.',
    disponible: true,
    tiempoProduccion: '1-2 días hábiles',
    especificaciones: {
      dimension: '24x19cm',
      grosor: '3mm',
      superficie: 'Poliéster liso',
      base: 'Goma antideslizante',
      borde: 'Costura reforzada'
    }
  },

  'SUB-010': {
    id: 'SUB-010',
    categoria: 'mousepad',
    nombre: 'Mouse Pad XXL Gaming 80x30cm',
    precio: 25000,
    descripcion: 'Mouse pad gigante para gaming, superficie extendida.',
    disponible: true,
    tiempoProduccion: '2-3 días hábiles',
    especificaciones: {
      dimension: '80x30cm',
      grosor: '4mm',
      superficie: 'Microfibra premium',
      uso: 'Gaming y oficina',
      resistencia: 'Agua y desgaste'
    }
  },

  // PRODUCTOS PERSONALIZADOS ESPECIALES
  'SUB-011': {
    id: 'SUB-011',
    categoria: 'personalizado',
    nombre: 'Cuadro Sublimado MDF 20x30cm',
    precio: 35000,
    descripcion: 'Cuadro en MDF blanco sublimable con soporte trasero.',
    disponible: true,
    tiempoProduccion: '5-7 días hábiles',
    especificaciones: {
      material: 'MDF blanco sublimable',
      dimension: '20x30cm',
      grosor: '6mm',
      acabado: 'Brillante',
      soporte: 'Pie trasero incluido'
    }
  },

  'SUB-012': {
    id: 'SUB-012',
    categoria: 'personalizado',
    nombre: 'Plato Decorativo Cerámico',
    precio: 28000,
    descripcion: 'Plato cerámico decorativo sublimable con soporte.',
    disponible: true,
    tiempoProduccion: '4-5 días hábiles',
    especificaciones: {
      material: 'Cerámica blanca',
      diametro: '20cm',
      uso: 'Decorativo únicamente',
      soporte: 'Atril incluido',
      acabado: 'Brillante premium'
    }
  },

  // COMBOS Y OFERTAS ESPECIALES
  'SUB-COMBO-001': {
    id: 'SUB-COMBO-001',
    categoria: 'personalizado',
    nombre: 'Combo Oficina (Mug + Mouse Pad)',
    precio: 18000,
    descripcion: 'Combo ideal para oficina: Mug 11oz + Mouse pad rectangular.',
    disponible: true,
    tiempoProduccion: '2-3 días hábiles',
    descuento: '10% OFF',
    incluye: ['Mug cerámico 11oz', 'Mouse pad 24x19cm', 'Mismo diseño en ambos'],
    ahorro: 2000
  },

  'SUB-COMBO-002': {
    id: 'SUB-COMBO-002',
    categoria: 'textil',
    nombre: 'Pack Familiar 4 Camisetas',
    precio: 85000,
    descripcion: 'Pack de 4 camisetas sublimables con el mismo diseño.',
    disponible: true,
    tiempoProduccion: '4-5 días hábiles',
    descuento: '15% OFF',
    incluye: ['4 camisetas básicas', 'Tallas a elección', 'Mismo diseño'],
    ahorro: 15000
  }
};

// Función para obtener productos por categoría
function obtenerProductosPorCategoria(categoria) {
  return Object.values(productosDaatcs).filter(producto => 
    producto.categoria === categoria && producto.disponible
  );
}

// Función para buscar productos
function buscarProductos(termino) {
  const terminoLower = termino.toLowerCase();
  return Object.values(productosDaatcs).filter(producto => 
    producto.disponible && (
      producto.nombre.toLowerCase().includes(terminoLower) ||
      producto.descripcion.toLowerCase().includes(terminoLower) ||
      producto.categoria.toLowerCase().includes(terminoLower)
    )
  );
}

// Función para obtener productos en oferta
function obtenerOfertas() {
  return Object.values(productosDaatcs).filter(producto => 
    producto.disponible && (producto.descuento || producto.ahorro)
  );
}

// Función para formatear producto para mostrar
function formatearProducto(producto) {
  let mensaje = `🆔 *${producto.id}*\n`;
  mensaje += `📝 ${producto.nombre}\n`;
  mensaje += `💰 ${producto.precio.toLocaleString()}`;
  
  if (producto.descuento) {
    mensaje += ` (${producto.descuento})`;
  }
  
  mensaje += `\n📋 ${producto.descripcion}\n`;
  mensaje += `⏰ ${producto.tiempoProduccion}\n`;
  
  if (producto.especificaciones) {
    mensaje += `📏 `;
    if (producto.especificaciones.dimension) {
      mensaje += `${producto.especificaciones.dimension} - `;
    }
    if (producto.especificaciones.material) {
      mensaje += `${producto.especificaciones.material}`;
    }
  }
  
  return mensaje;
}

module.exports = {
  productosDaatcs,
  obtenerProductosPorCategoria,
  buscarProductos,
  obtenerOfertas,
  formatearProducto
};
