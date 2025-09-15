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
            direccion: '' //
