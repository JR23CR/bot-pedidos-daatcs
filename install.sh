#!/bin/bash

# Script de instalación para Bot Pedidos DAATCS en Termux
echo "🤖 Instalando Bot de Pedidos DAATCS para Termux..."

# Actualizar paquetes de Termux
echo "📦 Actualizando paquetes de Termux..."
pkg update -y && pkg upgrade -y

# Instalar Node.js y npm
echo "📦 Instalando Node.js y npm..."
pkg install nodejs npm git -y

# Verificar instalación
echo "🔍 Verificando instalaciones..."
node --version
npm --version
git --version

# Crear directorio del bot
echo "📁 Creando estructura de directorios..."
mkdir -p ~/bot-pedidos-daatcs
cd ~/bot-pedidos-daatcs

# Crear directorios necesarios
mkdir -p data auth logs

# Inicializar npm y instalar dependencias
echo "📦 Instalando dependencias de Node.js..."
npm init -y
npm install @whiskeysockets/baileys@^6.5.0 @hapi/boom@^10.0.1 pino@^8.15.0 qrcode-terminal@^0.12.0

# Crear archivo .gitignore
echo "📝 Creando archivo .gitignore..."
cat > .gitignore << EOL
# Dependencias
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Archivos de autenticación de WhatsApp
auth/
*.session.json

# Datos locales
data/
*.json

# Logs
logs/
*.log

# Archivos temporales
.tmp/
temp/

# Archivos del sistema
.DS_Store
Thumbs.db

# Variables de entorno
.env
.env.local
.env.production

# Cache
.cache/
EOL

# Crear archivo de configuración
echo "⚙️ Creando archivo de configuración..."
cat > config.js << EOL
module.exports = {
    groupName: 'PEDIDOS DAATCS',
    adminNumbers: [
        // Agregar números de admin aquí (formato: '521234567890')
        // Ejemplo: '5215551234567'
    ],
    pedidosFile: './data/pedidos.json',
    clientesFile: './data/clientes.json',
    logFile: './logs/bot.log'
};
EOL

# Crear script de inicio
echo "🚀 Creando scripts de inicio..."
cat > start.sh << EOL
#!/bin/bash
echo "🤖 Iniciando Bot de Pedidos DAATCS..."
cd ~/bot-pedidos-daatcs
node bot.js
EOL

chmod +x start.sh

# Crear script de reinicio automático
cat > auto-restart.sh << EOL
#!/bin/bash
echo "🔄 Iniciando Bot con reinicio automático..."
cd ~/bot-pedidos-daatcs
while true; do
    echo "🚀 Iniciando bot..."
    node bot.js
    echo "⚠️ Bot se detuvo. Reiniciando en 5 segundos..."
    sleep 5
done
EOL

chmod +x auto-restart.sh

# Crear archivo README con instrucciones
echo "📖 Creando documentación..."
cat > README.md << EOL
# Bot de Pedidos DAATCS 🤖

Bot de WhatsApp para gestionar pedidos de sublimaciones que funciona exclusivamente en el grupo "PEDIDOS DAATCS".

## 📋 Características

- ✅ Registro automático de pedidos
- 📊 Seguimiento de estados
- 👥 Gestión de clientes
- 📈 Estadísticas de ventas
- 🔐 Comandos de administrador
- 💾 Persistencia de datos

## 🚀 Instalación en Termux

1. Ejecuta el script de instalación:
   \`\`\`bash
   bash install.sh
   \`\`\`

2. Configura números de administrador en \`config.js\`

3. Inicia el bot:
   \`\`\`bash
   ./start.sh
   \`\`\`

## 📱 Comandos Disponibles

### Para todos los usuarios:
- \`!ayuda\` - Mostrar ayuda
- \`!mispedidos\` - Ver mis pedidos
- \`!estado [ID]\` - Consultar estado de pedido

### Para administradores:
- \`!admin\` - Ver comandos de admin
- \`!listapedidos\` - Ver todos los pedidos
- \`!cambiarestado [ID] [estado]\` - Cambiar estado
- \`!estadisticas\` - Ver estadísticas
- \`!buscarpedido [ID]\` - Buscar pedido específico

## 📝 Formato de Pedido

\`\`\`
Cliente: Nombre del cliente
Teléfono: Número de contacto
Producto: Nombre del producto
Cantidad: Número de piezas
Precio: Costo por pieza
Nota: Observaciones adicionales
\`\`\`

## 🔧 Configuración

Edita el archivo \`config.js\` para:
- Agregar números de administrador
- Cambiar rutas de archivos
- Personalizar configuraciones

## 📂 Estructura de Archivos

\`\`\`
bot-pedidos-daatcs/
├── bot.js              # Archivo principal del bot
├── config.js           # Configuración
├── package.json        # Dependencias
├── start.sh           # Script de inicio
├── auto-restart.sh    # Script con reinicio automático
├── data/              # Datos persistentes
│   ├── pedidos.json   # Pedidos guardados
│   └── clientes.json  # Información de clientes
├── auth/              # Autenticación WhatsApp
└── logs/              # Archivos de log
\`\`\`

## 🛠️ Mantenimiento

- **Iniciar bot**: \`./start.sh\`
- **Con reinicio automático**: \`./auto-restart.sh\`
- **Ver logs**: \`tail -f logs/bot.log\`
- **Backup datos**: Copia la carpeta \`data/\`

## 🔒 Seguridad

- Solo funciona en el grupo "PEDIDOS DAATCS"
- Comandos de admin restringidos
- Datos guardados localmente
- Autenticación por QR

## 📞 Soporte

Para soporte técnico, contacta al administrador del sistema.
EOL

echo "✅ Instalación completada!"
echo ""
echo "🔧 CONFIGURACIÓN REQUERIDA:"
echo "1. Edita config.js y agrega los números de administrador"
echo "2. Ejecuta: ./start.sh para iniciar el bot"
echo "3. Escanea el código QR con WhatsApp"
echo ""
echo "📁 Directorio del bot: ~/bot-pedidos-daatcs"
echo "📖 Lee README.md para más información"
echo ""
echo "🚀 Para iniciar el bot ejecuta:"
echo "   cd ~/bot-pedidos-daatcs && ./start.sh"
