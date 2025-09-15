const fs = require('fs');
const path = require('path');

class Utils {
    
    // Crear backup de datos
    static crearBackup(pedidos, clientes) {
        try {
            const fecha = new Date().toISOString().split('T')[0];
            const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
            const backupDir = './backups';
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir);
            }
            
            const backupData = {
                fecha: new Date().toISOString(),
                pedidos: pedidos,
                clientes: clientes,
                version: '1.0.0'
            };
            
            const fileName = `backup_${fecha}_${hora}.json`;
            const filePath = path.join(backupDir, fileName);
            
            fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
            console.log(`✅ Backup creado: ${fileName}`);
            
            // Limpiar backups antiguos (mantener solo los últimos 7)
            this.limpiarBackupsAntiguos(backupDir, 7);
            
            return filePath;
        } catch (error) {
            console.error('❌ Error creando backup:', error);
            return null;
        }
    }
    
    // Limpiar backups antiguos
    static limpiarBackupsAntiguos(backupDir, mantener = 7) {
        try {
            const archivos = fs.readdirSync(backupDir)
                .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(backupDir, file),
                    time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time);
            
            // Eliminar archivos antiguos
            if (archivos.length > mantener) {
                archivos.slice(mantener).forEach(archivo => {
                    fs.unlinkSync(archivo.path);
                    console.log(`🗑️ Backup eliminado: ${archivo.name}`);
                });
            }
        } catch (error) {
            console.error('❌ Error limpiando backups:', error);
        }
    }
    
    // Restaurar desde backup
    static restaurarBackup(archivoBackup) {
        try {
            if (!fs.existsSync(archivoBackup)) {
                throw new Error('Archivo de backup no encontrado');
            }
            
            const backupData = JSON.parse(fs.readFileSync(archivoBackup, 'utf8'));
            return {
                pedidos: backupData.pedidos || [],
                clientes: backupData.clientes || {},
                fecha: backupData.fecha
            };
        } catch (error) {
            console.error('❌ Error restaurando backup:', error);
            return null;
        }
    }
    
    // Validar formato de pedido
    static validarFormatoPedido(texto) {
        const camposRequeridos = ['cliente:', 'producto:'];
        const camposOpcionales = ['teléfono:', 'cantidad:', 'precio:', 'nota:'];
        
        const textoLower = texto.toLowerCase();
        const camposEncontrados = camposRequeridos.filter(campo => 
            textoLower.includes(campo)
        );
        
        return {
            valido: camposEncontrados.length >= camposRequeridos.length,
            camposEncontrados: camposEncontrados.length,
            camposRequeridos: camposRequeridos.length,
            sugerencias: this.generarSugerenciasFormato(textoLower, camposRequeridos, camposOpcionales)
        };
    }
    
    // Generar sugerencias de formato
    static generarSugerenciasFormato(texto, requeridos, opcionales) {
        const sugerencias = [];
        
        requeridos.forEach(campo => {
            if (!texto.includes(campo)) {
                sugerencias.push(`Falta: ${campo}`);
            }
        });
        
        if (sugerencias.length === 0) {
            sugerencias.push('Formato correcto ✅');
        }
        
        return sugerencias;
    }
    
    // Limpiar número de teléfono
    static limpiarNumeroTelefono(numero) {
        if (!numero) return 'No especificado';
        
        // Remover caracteres no numéricos excepto +
        let limpio = numero.replace(/[^\d+]/g, '');
        
        // Si no tiene código de país, agregar +52 (México)
        if (!limpio.startsWith('+') && !limpio.startsWith('52')) {
            limpio = '+52' + limpio;
        } else if (!limpio.startsWith('+')) {
            limpio = '+' + limpio;
        }
        
        return limpio;
    }
    
    // Formatear moneda
    static formatearMoneda(cantidad, moneda = 'MXN') {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 0
        }).format(cantidad);
    }
    
    // Calcular tiempo estimado de entrega
    static calcularTiempoEntrega(productos) {
        const tiemposBase = {
            'taza': 1,
            'playera': 2,
            'gorra': 3,
            'mousepad': 1,
            'llavero': 1,
            'default': 2
        };
        
        let tiempoMaximo = 0;
        productos.forEach(item => {
            const nombreProducto = item.producto.toLowerCase();
            let tiempo = tiemposBase.default;
            
            // Buscar coincidencias en el nombre del producto
            Object.keys(tiemposBase).forEach(key => {
                if (nombreProducto.includes(key) && key !== 'default') {
                    tiempo = tiemposBase[key];
                }
            });
            
            // Ajustar por cantidad
            if (item.cantidad > 10) tiempo += 1;
            if (item.cantidad > 50) tiempo += 2;
            
            tiempoMaximo = Math.max(tiempoMaximo, tiempo);
        });
        
        const fechaEntrega = new Date();
        fechaEntrega.setDate(fechaEntrega.getDate() + tiempoMaximo);
        
        return {
            dias: tiempoMaximo,
            fechaEstimada: fechaEntrega.toLocaleDateString('es-ES'),
            mensaje: `Tiempo estimado: ${tiempoMaximo} día${tiempoMaximo > 1 ? 's' : ''}`
        };
    }
    
    // Generar reporte de ventas
    static generarReporteVentas(pedidos, fechaInicio, fechaFin) {
        const pedidosFiltrados = pedidos.filter(pedido => {
            const fechaPedido = new Date(pedido.fecha);
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            return fechaPedido >= inicio && fechaPedido <= fin;
        });
        
        const totalVentas = pedidosFiltrados.reduce((sum, p) => sum + p.total, 0);
        const totalPedidos = pedidosFiltrados.length;
        const promedioVenta = totalPedidos > 0 ? totalVentas / totalPedidos : 0;
        
        const ventasPorDia = {};
        const productosMasVendidos = {};
        
        pedidosFiltrados.forEach(pedido => {
            const fecha = new Date(pedido.fecha).toLocaleDateString('es-ES');
            ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + pedido.total;
            
            pedido.items.forEach(item => {
                const producto = item.producto.toLowerCase();
                productosMasVendidos[producto] = (productosMasVendidos[producto] || 0) + item.cantidad;
            });
        });
        
        return {
            periodo: { inicio: fechaInicio, fin: fechaFin },
            resumen: {
                totalVentas: totalVentas,
                totalPedidos: totalPedidos,
                promedioVenta: promedioVenta,
                ventasMayorDia: Math.max(...Object.values(ventasPorDia), 0)
            },
            ventasPorDia: ventasPorDia,
            productosMasVendidos: productosMasVendidos
        };
    }
    
    // Exportar datos a CSV
    static exportarCSV(pedidos, nombreArchivo = 'pedidos_export.csv') {
        try {
            const headers = [
                'ID', 'Cliente', 'Telefono', 'Fecha', 'Estado', 
                'Productos', 'Cantidad_Total', 'Total', 'Notas'
            ];
            
            const rows = pedidos.map(pedido => {
                const productos = pedido.items.map(item => 
                    `${item.producto} (${item.cantidad})`
                ).join('; ');
                
                const cantidadTotal = pedido.items.reduce((sum, item) => sum + item.cantidad, 0);
                
                return [
                    pedido.id,
                    pedido.nombreCliente || 'N/A',
                    pedido.telefono || 'N/A',
                    pedido.fecha,
                    pedido.estado,
                    productos,
                    cantidadTotal,
                    pedido.total,
                    pedido.notas || ''
                ];
            });
            
            const csvContent = [headers, ...rows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');
            
            const exportDir = './exports';
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir);
            }
            
            const filePath = path.join(exportDir, nombreArchivo);
            fs.writeFileSync(filePath, csvContent, 'utf8');
            
            console.log(`📊 Datos exportados a: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error('❌ Error exportando CSV:', error);
            return null;
        }
    }
    
    // Logger personalizado
    static log(nivel, mensaje, datos = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${nivel.toUpperCase()}: ${mensaje}`;
        
        console.log(logMessage);
        
        if (datos) {
            console.log(JSON.stringify(datos, null, 2));
        }
        
        // Escribir a archivo de log si existe el directorio
        try {
            const logDir = './logs';
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir);
            }
            
            const logFile = path.join(logDir, `bot_${new Date().toISOString().split('T')[0]}.log`);
            const logEntry = datos ? 
                `${logMessage}\n${JSON.stringify(datos, null, 2)}\n\n` : 
                `${logMessage}\n`;
                
            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            // Silenciar errores de logging para evitar bucles
        }
    }
    
    // Verificar salud del sistema
    static verificarSaludSistema() {
        const salud = {
            timestamp: new Date().toISOString(),
            memoria: process.memoryUsage(),
            uptime: process.uptime(),
            version: process.version,
            plataforma: process.platform,
            archivosExisten: {
                pedidos: fs.existsSync('./data/pedidos.json'),
                clientes: fs.existsSync('./data/clientes.json'),
                auth: fs.existsSync('./auth')
            }
        };
        
        return salud;
    }
}

module.exports = Utils;
