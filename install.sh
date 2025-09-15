#!/bin/bash

# 🎨 DAATCS STUDIOS - Instalador Automático Bot de Sublimaciones
# Instalador especializado para WhatsApp

echo "🎨 DAATCS STUDIOS - Bot de Sublimaciones"
echo "======================================"
echo "✨ Especialistas en sublimaciones de alta calidad"
echo "📱 Bot exclusivo para grupo PEDIDOS DAATCS"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

show_message() {
    echo -e "${GREEN}[DAATCS]${NC} $1"
}

show_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

show_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_step() {
    echo -e "${BLUE}[PASO]${NC} $1"
}

show_daatcs() {
    echo -e "${PURPLE}[DAATCS STUDIOS]${NC} $1"
}

# Banner DAATCS
show_banner() {
    echo -e "${PURPLE}"
    echo "  ██████╗  ██████╗  █████╗ ████████╗ ██████╗███████╗"
    echo "  ██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██╔════╝"
    echo "  ██║  ██║██████╔╝███████║   ██║   ██║     ███████╗"
    echo "  ██║  ██║██╔══██╗██╔══██║   ██║   ██║     ╚════██║"
    echo "  ██████╔╝██║  ██║██║  ██║   ██║   ╚██████╗███████║"
    echo "  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝╚══════╝"
    echo -e "${NC}"
    echo "           🎨 STUDIOS - Sublimaciones Premium 🎨"
    echo ""
}

# Verificar entorno
check_environment() {
    if [[ -n "$TERMUX_VERSION" ]]; then
        show_message "Detectado Termux - Perfecto para DAATCS Bot"
        ENV="termux"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        show_message "Detectado Linux"
        ENV="linux"
    else
        show_warning "Entorno no completamente compatible"
        ENV="unknown"
    fi
}

# Instalar dependencias
install_dependencies() {
    show_step "Instalando dependencias para DAATCS Studios..."
    
    if [[ "$ENV" == "termux" ]]; then
        show_daatcs "Configurando Termux para sublimaciones..."
        termux-setup-storage
        
        show_message "Actualizando sistema..."
        apt update -y && yes | apt upgrade
        
        show_message "Instalando herramientas DAATCS..."
        pkg install -y bash wget git nodejs ffmpeg imagemagick yarn python
        
    elif [[ "$ENV" == "linux" ]]; then
        show_message "Configurando Linux..."
        sudo apt update && sudo apt upgrade -y
        sudo apt install -y curl git nodejs npm ffmpeg imagemagick python3 build-essential
        
        if ! command -v yarn &> /dev/null; then
            show_message "Instalando Yarn..."
            npm install -g yarn
        fi
    fi
}

# Crear estructura DAATCS
create_daatcs_structure() {
    show_step "Creando estructura DAATCS Studios..."
    
    mkdir -p daatcs-bot/{data,respaldos,logs,productos,diseños}
    cd daatcs-bot
    
    show_daatcs "Estructura creada para sublimaciones"
}

# Crear archivos DAATCS
create_daatcs_files() {
    show_step "Creando archivos DAATCS Studios..."
    
    # package.json específico DAATCS
    cat > package.json << 'EOF'
{
  "name": "daatcs-studios-bot",
  "version": "2.0.0",
  "description": "Bot WhatsApp especializado para DAATCS Studios - Sublimaciones",
  "main": "index.js",
  "author": "DAATCS Studios",
  "license": "MIT",
  "keywords": [
    "whatsapp", "bot", "sublimacion", "daatcs", "estampados", "personalizacion"
  ],
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "daatcs": "node index.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.5.0",
    "pino": "^8.15.0",
    "qrcode-terminal": "^0.12.0"
  }
}
EOF

    # Configuración DAATCS
    cat > config.js << 'EOF'
// Configuración DAATCS STUDIOS
const config = {
  empresa: {
    nombre: 'DAATCS STUDIOS',
    tipo: 'Sublimaciones y Estampados Personalizados',
    telefono: '+57 XXX XXX XXXX', // ⚠️ ACTUALIZAR CON NÚMERO REAL
    email: 'pedidos@daatcsstudios.com',
    ubicacion: 'Colombia',
    web: 'www.daatcsstudios.com'
  },

  // ⚠️ IMPORTANTE: Agregar números de administradores DAATCS
  admins: [
    '573123456789' // Reemplazar con número real sin +
  ],
  
  botName: '🎨 DAATCS STUDIOS Bot',
  prefix: '.',
  grupoAutorizado: 'PEDIDOS DAATCS',
  
  // Estados específicos de sublimación
  estadosPedido: {
    borrador: '📝 En construcción',
    confirmado: '✅ Confirmado',
    diseñando: '🎨 Creando diseño',
    procesando: '⚙️ En producción', 
    sublimando: '🔥 Sublimando',
    control_calidad: '🔍 Control de calidad',
    listo: '📦 Listo para entrega',
    enviado: '🚚 Enviado',
    entregado: '✅ Entregado',
    cancelado: '❌ Cancelado'
  }
};

module.exports = config;
EOF

    # README específico DAATCS
    cat > README.md << 'EOF'
# 🎨 DAATCS STUDIOS - Bot de Sublimaciones

Bot especializado para DAATCS Studios, empresa líder en sublimaciones.

## 🚀 Inicio Rápido

1. Configura tu número admin en `config.js`
2. Ejecuta: `npm start`  
3. Escanea QR con WhatsApp
4. Úsalo solo en grupo "PEDIDOS DAATCS"

## 📞 Contacto DAATCS

- WhatsApp: +57 XXX XXX XXXX
- Email: pedidos@daatcsstudios.com
- Web: www.daatcsstudios.com

🎨 ¡Sublimaciones de alta calidad!
EOF

    # .gitignore
    cat > .gitignore << 'EOF'
node_modules/
auth/
*.log
data/*.json
respaldos/
diseños/
productos/temp/
.env
.DS_Store
EOF

    show_daatcs "Archivos base creados correctamente"
}

# Instalar dependencias Node.js
install_node_dependencies() {
    show_step "Instalando dependencias Node.js para DAATCS..."
    
    if command -v yarn &> /dev/null; then
        show_message "Instalando con Yarn..."
        yarn install
    else
        show_message "Instalando con NPM..."
        npm install
    fi
    
    show_daatcs "Dependencias instaladas correctamente"
}

# Configurar PM2 para DAATCS
setup_daatcs_pm2() {
    show_step "Configurando PM2 para DAATCS Studios..."
    
    if [[ "$ENV" == "termux" ]]; then
        termux-wake-lock
        show_message "Wake lock activado en Termux"
    fi
    
    npm install -g pm2
    
    # Configuración PM2 específica DAATCS
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'daatcs-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      EMPRESA: 'DAATCS_STUDIOS'
    },
    error_file: './logs/daatcs-error.log',
    out_file: './logs/daatcs-out.log',
    log_file: './logs/daatcs-combined.log'
  }]
};
EOF
    
    show_daatcs "PM2 configurado para sublimaciones"
}

# Scripts específicos DAATCS
create_daatcs_scripts() {
    show_step "Creando scripts DAATCS Studios..."
    
    # Script iniciar DAATCS
    cat > start-daatcs.sh << 'EOF'
#!/bin/bash
echo "🎨 Iniciando DAATCS STUDIOS Bot..."
echo "✨ Especialistas en sublimaciones"
pm2 start ecosystem.config.js
pm2 save
echo "✅ Bot DAATCS iniciado correctamente"
echo "📱 Escanea el código QR con WhatsApp"
echo "🔗 Úsalo solo en grupo 'PEDIDOS DAATCS'"
pm2 logs daatcs-bot
EOF

    # Script detener DAATCS
    cat > stop-daatcs.sh << 'EOF'
#!/bin/bash
echo "🛑 Deteniendo DAATCS Studios Bot..."
pm2 stop daatcs-bot
pm2 delete daatcs-bot
echo "✅ Bot DAATCS detenido correctamente"
EOF

    # Script status DAATCS
    cat > status-daatcs.sh << 'EOF'
#!/bin/bash
echo "📊 Estado DAATCS Studios Bot:"
echo "==============================="
pm2 list
echo ""
echo "📋 Logs recientes:"
pm2 logs daatcs-bot --lines 10
EOF

    # Script respaldo DAATCS
    cat > backup-daatcs.sh << 'EOF'
#!/bin/bash
fecha=$(date +%Y%m%d_%H%M%S)
echo "💾 Creando respaldo DAATCS Studios: $fecha"
mkdir -p "respaldos/daatcs_backup_$fecha"
cp -r data/ "respaldos/daatcs_backup_$fecha/"
cp -r productos/ "respaldos/daatcs_backup_$fecha/" 2>/dev/null || true
cp -r diseños/ "respaldos/daatcs_backup_$fecha/" 2>/dev/null || true
echo "✅ Respaldo DAATCS creado en respaldos/daatcs_backup_$fecha"
EOF

    # Script actualizar DAATCS
    cat > update-daatcs.sh << 'EOF'
#!/bin/bash
echo "🔄 Actualizando DAATCS Studios Bot..."
./backup-daatcs.sh
git pull origin main
npm install
pm2 restart daatcs-bot
echo "✅ DAATCS Bot actualizado correctamente"
EOF

    # Hacer ejecutables
    chmod +x *.sh
    
    show_daatcs "Scripts DAATCS creados y configurados"
}

# Crear estructura de productos DAATCS
create_products_structure() {
    show_step "Creando catálogo de productos DAATCS..."
    
    mkdir -p productos/{textiles,mugs,termos,cojines,accesorios,personalizados}
    mkdir -p diseños/{templates,logos,trabajos}
    
    # Crear productos predefinidos
    cat > data/productos-base.json << 'EOF'
{
  "SUB-001": {
    "id": "SUB-001",
    "categoria": "textil",
    "nombre": "Camiseta Básica Sublimable",
    "precio": 25000,
    "descripcion": "Camiseta 100% poliéster, ideal para sublimación",
    "disponible": true,
    "tiempoProduccion": "3-4 días hábiles"
  },
  "SUB-002": {
    "id": "SUB-002", 
    "categoria": "mug",
    "nombre": "Mug Cerámico 11oz",
    "precio": 12000,
    "descripcion": "Mug cerámico blanco sublimable",
    "disponible": true,
    "tiempoProduccion": "2-3 días hábiles"
  },
  "SUB-003": {
    "id": "SUB-003",
    "categoria": "termo",
    "nombre": "Termo Acero Inoxidable 500ml",
    "precio": 35000,
    "descripcion": "Termo sublimable mantiene temperatura 12h",
    "disponible": true,
    "tiempoProduccion": "3-4 días hábiles"
  }
}
EOF
    
    show_daatcs "Catálogo base de sublimaciones creado"
}

# Instrucciones finales DAATCS
show_daatcs_instructions() {
    show_banner
    
    echo -e "${GREEN}🎉 ¡Instalación DAATCS STUDIOS completada!${NC}"
    echo "=============================================="
    echo ""
    
    show_daatcs "CONFIGURACIÓN FINAL:"
    echo "1️⃣  Edita config.js y agrega tu número de administrador:"
    echo "   nano config.js"
    echo ""
    echo "2️⃣  Actualiza información de contacto DAATCS"
    echo "3️⃣  Inicia el bot:"
    echo "   ./start-daatcs.sh"
    echo ""
    echo "4️⃣  Escanea el código QR con WhatsApp"
    echo "5️⃣  Agrégalo al grupo 'PEDIDOS DAATCS'"
    echo ""
    
    show_step "COMANDOS DAATCS DISPONIBLES:"
    echo "• ./start-daatcs.sh     - Iniciar bot sublimaciones"
    echo "• ./stop-daatcs.sh      - Detener bot"
    echo "• ./status-daatcs.sh    - Ver estado del bot"
    echo "• ./backup-daatcs.sh    - Crear respaldo"
    echo "• ./update-daatcs.sh    - Actualizar bot"
    echo ""
    
    show_daatcs "COMANDOS DEL BOT (en WhatsApp):"
    echo "📋 .menu - Ver menú completo"
    echo "🎨 .productos - Catálogo de sublimaciones"  
    echo "☕ .mugs - Ver mugs disponibles"
    echo "👕 .textiles - Ver ropa sublimable"
    echo "📞 .contacto - Información DAATCS"
    echo "⏰ .tiempos - Tiempos de entrega"
    echo "🛍️ .nuevopedido - Crear pedido"
    echo ""
    
    show_warning "IMPORTANTE:"
    echo "• Configura tu número de admin en config.js"
    echo "• El bot SOLO funciona en grupo 'PEDIDOS DAATCS'" 
    echo "• Actualiza datos de contacto reales"
    echo "• Mantén respaldos regulares"
    echo ""
    
    show_daatcs "SOPORTE TÉCNICO:"
    echo "📱 WhatsApp: +57 XXX XXX XXXX"
    echo "📧 Email: soporte@daatcsstudios.com"
    echo "🌐 Web: www.daatcsstudios.com"
    echo ""
    
    echo -e "${PURPLE}🎨 ¡DAATCS STUDIOS - Sublimaciones de Alta Calidad! ✨${NC}"
    echo -e "${GREEN}¡Tu bot especializado está listo para usar!${NC}"
}

# Función principal
main() {
    show_banner
    check_environment
    install_dependencies
    create_daatcs_structure
    create_daatcs_files
    install_node_dependencies
    setup_daatcs_pm2
    create_daatcs_scripts
    create_products_structure
    show_daatcs_instructions
}

# Ejecutar con manejo de errores
set -e
trap 'show_error "Error en la instalación DAATCS en línea $LINENO"' ERR

main "$@"
