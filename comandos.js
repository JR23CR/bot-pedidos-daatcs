const Utils = require('./utils');
const config = require('./config');

class ComandosBot {
    constructor(pedidos, clientes, sock) {
        this.pedidos = pedidos;
        this.clientes = clientes;
        this.sock = sock;
    }

    // Comando de ayuda mejorado
    async mostrarAyuda(sender, isAdmin = false) {
        let helpText = `🤖 *BOT PEDIDOS ${config.empresa.nombre.toUpperCase()}* 🎨\n\n`;
        helpText += `${config.empresa.eslogan}\n\n`;
        
        helpText += `*📋 COMANDOS PARA CLIENTES:*\n`;
        helpText += `• !ayuda - Mostrar esta ayuda\n`;
        helpText += `• !pedido - Crear un nuevo pedido\n`;
        helpText += `• !mispedidos - Ver mis pedidos\n`;
        helpText += `• !estado [ID] - Consultar estado específico\n`;
        helpText += `• !catalogo - Ver productos disponibles\n`;
        helpText += `• !contacto - Información de contacto\n\n`;
        
        if (isAdmin) {
            helpText += `*👑 COMANDOS DE ADMINISTRADOR:*\n`;
            helpText += `• !admin - Ver comandos de admin\n`;
            helpText += `• !listapedidos - Todos los pedidos\n`;
            helpText += `• !pedidospendientes - Solo pendientes\n`;
            helpText += `• !cambiarestado [ID] [estado] - Cambiar estado\n`;
            helpText += `• !buscarpedido [ID] - Buscar pedido específico\n`;
            helpText += `• !estadisticas - Estadísticas generales\n`;
            helpText += `• !reporte [días] - Reporte de ventas\n`;
            helpText += `• !backup - Crear backup manual\n`;
            helpText += `• !exportar - Exportar a CSV\n`;
            helpText += `• !salud - Estado del sistema\n\n`;
        }
        
        helpText += `*💡 FORMATO DE PEDIDO:*\n`;
        helpText += `\`\`\`\n`;
        helpText += `Cliente: Tu nombre completo\n`;
        helpText += `Teléfono: Tu número de contacto\n`;
        helpText += `Producto: Descripción del producto\n`;
        helpText += `Cantidad: Número de piezas\n`;
        helpText += `Precio: Costo acordado por pieza\n`;
        helpText += `Nota: Observaciones especiales\n`;
        helpText += `\`\`\`\n\n`;
        
        helpText += `*🎯 EJEMPLO DE PEDIDO:*\n`;
        helpText += `Cliente: Juan Pérez\n`;
        helpText += `Teléfono: 55 1234 5678\n`;
        helpText += `Producto: Taza personalizada con logo\n`;
        helpText += `Cantidad: 5\n`;
        helpText += `Precio: 50\n`;
        helpText += `Nota: Logo en alta resolución adjunto\n\n`;
        
        helpText += `📞 *Contacto:* ${config.empresa.contacto.telefono}`;
        
        await this.sock.sendMessage(sender, { text: helpText });
    }

    // Mostrar catálogo de productos
    async mostrarCatalogo(sender) {
        let catalogoText = `🛍️ *CATÁLOGO ${config.empresa.nombre.toUpperCase()}*\n\n`;
        
        Object.entries(config.productos).forEach(([key, producto]) => {
            const tiempo = Utils.calcularTiempoEntrega([{ producto: key, cantidad: 1 }]);
            catalogoText += `🔸 *${producto.nombre}*\n`;
            catalogoText += `   💰 Precio base: ${Utils.formatearMoneda(producto.precioBase)}\n`;
            catalogoText += `   ⏱️ ${tiempo.mensaje}\n\n`;
        });
        
        catalogoText += `📝 *Nota:* Los precios pueden variar según diseño y cantidad.\n`;
        catalogoText += `💬 Para pedidos personalizados, usa el formato de pedido.`;
        
        await this.sock.sendMessage(sender, { text: catalogoText });
    }

    // Información de contacto
    async mostrarContacto(sender) {
        let contactoText = `📞 *CONTACTO ${config.empresa.nombre}*\n\n`;
        contactoText += `${config.empresa.eslogan}\n\n`;
        
        if (config.empresa.contacto.telefono) {
            contactoText += `📱 *Teléfono:* ${config.empresa.contacto.telefono}\n`;
        }
        if (config.empresa.contacto.email) {
            contactoText += `📧 *Email:* ${config.empresa.contacto.email}\n`;
        }
        if (config.empresa.contacto.direccion) {
            contactoText += `📍 *Dirección:* ${config.empresa.contacto.direccion}\n`;
        }
        
        contactoText += `\n⏰ *Horarios de atención:*\n`;
        contactoText += `Lunes a Viernes: 9:00 AM - 7:00 PM\n`;
        contactoText += `Sábados: 9:00 AM - 3:00 PM\n\n`;
        
        contactoText += `🎨 *Especialidades:*\n`;
        contactoText += `• Sublimación en telas\n`;
        contactoText += `• Bordados personalizados\n`;
        contactoText += `• Artículos promocionales\n`;
        contactoText += `• Regalos corporativos\n`;
        contactoText += `• Diseño gráfico\n\n`;
        
        contactoText += `💡 Usa !catalogo para ver nuestros productos`;
        
        await this.sock.sendMessage(sender, { text: contactoText });
    }

    // Ver pedidos pendientes (admin)
    async mostrarPedidosPendientes(sender) {
        const pendientes = this.pedidos.filter(p => 
            p.estado === 'pendiente' || p.estado === 'confirmado' || p.estado === 'en_proceso'
        );
        
        if (pendientes.length === 0) {
            await this.sock.sendMessage(sender, { 
                text: '✅ ¡Excelente! No hay pedidos pendientes.' 
            });
            return;
        }
        
        let listText = `⏳ *PEDIDOS PENDIENTES (${pendientes.length})*\n\n`;
        
        pendientes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)).forEach(pedido => {
            const diasTranscurridos = Math.floor(
                (new Date() - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)
            );
            
            let urgencia = '';
            if (diasTranscurridos > 7) urgencia = '🔴 URGENTE ';
            else if (diasTranscurridos > 3) urgencia = '🟡 ';
            
            listText += `${urgencia}🔸 *${pedido.id}*\n`;
            listText += `   👤 ${pedido.nombreCliente}\n`;
            listText += `   📊 Estado: ${pedido.estado.toUpperCase()}\n`;
            listText += `   💰 Total: ${Utils.formatearMoneda(pedido.total)}\n`;
            listText += `   📅 ${diasTranscurridos} días transcurridos\n\n`;
        });
        
        await this.sock.sendMessage(sender, { text: listText });
    }

    // Reporte de ventas
    async generarReporteVentas(sender, dias = 30) {
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - dias);
        
        const reporte = Utils.generarReporteVentas(
            this.pedidos, 
            fechaInicio.toISOString(), 
            fechaFin.toISOString()
        );
        
        let reporteText = `📊 *REPORTE DE VENTAS*\n`;
        reporteText += `📅 Período: ${dias} días\n\n`;
        
        reporteText += `💰 *RESUMEN FINANCIERO:*\n`;
        reporteText += `• Total ventas: ${Utils.formatearMoneda(reporte.resumen.totalVentas)}\n`;
        reporteText += `• Total pedidos: ${reporte.resumen.totalPedidos}\n`;
        reporteText += `• Promedio por venta: ${Utils.formatearMoneda(reporte.resumen.promedioVenta)}\n`;
        reporteText += `• Mayor venta del día: ${Utils.formatearMoneda(reporte.resumen.ventasMayorDia)}\n\n`;
        
        // Productos más vendidos
        const topProductos = Object.entries(reporte.productosMasVendidos)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
            
        if (topProductos.length > 0) {
            reporteText += `🏆 *TOP PRODUCTOS:*\n`;
            topProductos.forEach(([producto, cantidad], index) => {
                reporteText += `${index + 1}. ${producto}: ${cantidad} unidades\n`;
            });
            reporteText += `\n`;
        }
        
        // Ventas por estado
        const estadosCount = this.pedidos
            .filter(p => new Date(p.fecha) >= fechaInicio)
            .reduce((acc, p) => {
                acc[p.estado] = (acc[p.estado] || 0) + 1;
                return acc;
            }, {});
            
        reporteText += `📋 *PEDIDOS POR ESTADO:*\n`;
        Object.entries(estadosCount).forEach(([estado, count]) => {
            reporteText += `• ${estado.toUpperCase()}: ${count}\n`;
        });
        
        await this.sock.sendMessage(sender, { text: reporteText });
    }

    // Crear backup manual
    async crearBackupManual(sender) {
        try {
            const backupPath = Utils.crearBackup(this.pedidos, this.clientes);
            if (backupPath) {
                await this.sock.sendMessage(sender, { 
                    text: `✅ Backup creado exitosamente\n📁 Archivo: ${backupPath.split('/').pop()}` 
                });
            } else {
                await this.sock.sendMessage(sender, { 
                    text: '❌ Error creando backup. Revisa los logs.' 
                });
            }
        } catch (error) {
            Utils.log('error', 'Error en backup manual', error);
            await this.sock.sendMessage(sender, { 
                text: '❌ Error interno creando backup.' 
            });
        }
    }

    // Exportar datos a CSV
    async exportarDatos(sender) {
        try {
            const fecha = new Date().toISOString().split('T')[0];
            const nombreArchivo = `pedidos_${fecha}.csv`;
            const csvPath = Utils.exportarCSV(this.pedidos, nombreArchivo);
            
            if (csvPath) {
                await this.sock.sendMessage(sender, { 
                    text: `📊 Datos exportados exitosamente\n📁 Archivo: ${nombreArchivo}\n📂 Ubicación: ./exports/` 
                });
            } else {
                await this.sock.sendMessage(sender, { 
                    text: '❌ Error exportando datos. Revisa los logs.' 
                });
            }
        } catch (error) {
            Utils.log('error', 'Error en exportación', error);
            await this.sock.sendMessage(sender, { 
                text: '❌ Error interno exportando datos.' 
            });
        }
    }

    // Estado del sistema
    async mostrarSaludSistema(sender) {
        const salud = Utils.verificarSaludSistema();
        
        let saludText = `🔧 *ESTADO DEL SISTEMA*\n\n`;
        
        // Información básica
        saludText += `⏱️ *Tiempo activo:* ${Math.floor(salud.uptime / 3600)}h ${Math.floor((salud.uptime % 3600) / 60)}m\n`;
        saludText += `🖥️ *Plataforma:* ${salud.plataforma}\n`;
        saludText += `📦 *Node.js:* ${salud.version}\n\n`;
        
        // Memoria
        const memMB = (bytes) => Math.round(bytes / 1024 / 1024);
        saludText += `💾 *Memoria:*\n`;
        saludText += `• Usada: ${memMB(salud.memoria.used)} MB\n`;
        saludText += `• Total: ${memMB(salud.memoria.rss)} MB\n\n`;
        
        // Archivos
        saludText += `📁 *Archivos del sistema:*\n`;
        Object.entries(salud.archivosExisten).forEach(([archivo, existe]) => {
            saludText += `• ${archivo}: ${existe ? '✅' : '❌'}\n`;
        });
        
        saludText += `\n📊 *Estadísticas de datos:*\n`;
        saludText += `• Pedidos totales: ${this.pedidos.length}\n`;
        saludText += `• Clientes registrados: ${Object.keys(this.clientes).length}\n`;
        saludText += `• Pedidos pendientes: ${this.pedidos.filter(p => p.estado === 'pendiente').length}\n`;
        
        const totalVentas = this.pedidos.reduce((sum, p) => sum + p.total, 0);
        saludText += `• Ventas acumuladas: ${Utils.formatearMoneda(totalVentas)}\n\n`;
        
        saludText += `🕒 *Última actualización:* ${new Date().toLocaleString('es-ES')}`;
        
        await this.sock.sendMessage(sender, { text: saludText });
    }

    // Buscar cliente por número o nombre
    async buscarCliente(sender, termino) {
        const clientesEncontrados = [];
        
        Object.entries(this.clientes).forEach(([numero, cliente]) => {
            if (numero.includes(termino) || 
                cliente.nombre.toLowerCase().includes(termino.toLowerCase()) ||
                cliente.telefono.includes(termino)) {
                clientesEncontrados.push({ numero, ...cliente });
            }
        });
        
        if (clientesEncontrados.length === 0) {
            await this.sock.sendMessage(sender, { 
                text: `❌ No se encontraron clientes con: "${termino}"` 
            });
            return;
        }
        
        let resultadoText = `🔍 *CLIENTES ENCONTRADOS:*\n\n`;
        clientesEncontrados.slice(0, 10).forEach(cliente => { // Limitar a 10 resultados
            resultadoText += `👤 *${cliente.nombre}*\n`;
            resultadoText += `   📱 ${cliente.telefono}\n`;
            resultadoText += `   📦 Pedidos: ${cliente.pedidos.length}\n`;
            resultadoText += `   💰 Total compras: ${Utils.formatearMoneda(cliente.totalCompras)}\n\n`;
        });
        
        if (clientesEncontrados.length > 10) {
            resultadoText += `... y ${clientesEncontrados.length - 10} más`;
        }
        
        await this.sock.sendMessage(sender, { text: resultadoText });
    }

    // Recordatorio de pedidos vencidos
    async verificarPedidosVencidos() {
        const hoy = new Date();
        const hace7Dias = new Date(hoy.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        const pedidosVencidos = this.pedidos.filter(pedido => {
            const fechaPedido = new Date(pedido.fecha);
            return fechaPedido < hace7Dias && 
                   (pedido.estado === 'pendiente' || pedido.estado === 'confirmado');
        });
        
        if (pedidosVencidos.length === 0) return;
        
        // Notificar a administradores
        for (const adminNumber of config.adminNumbers) {
            let notificacionText = `⚠️ *PEDIDOS VENCIDOS* ⚠️\n\n`;
            notificacionText += `Hay ${pedidosVencidos.length} pedidos con más de 7 días pendientes:\n\n`;
            
            pedidosVencidos.slice(0, 5).forEach(pedido => {
                const diasVencidos = Math.floor(
                    (hoy - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)
                );
                notificacionText += `🔴 ${pedido.id} - ${pedido.nombreCliente}\n`;
                notificacionText += `   ${diasVencidos} días vencido\n`;
                notificacionText += `   ${Utils.formatearMoneda(pedido.total)}\n\n`;
            });
            
            if (pedidosVencidos.length > 5) {
                notificacionText += `... y ${pedidosVencidos.length - 5} más`;
            }
            
            try {
                const adminJid = adminNumber.includes('@') ? adminNumber : `${adminNumber}@s.whatsapp.net`;
                await this.sock.sendMessage(adminJid, { text: notificacionText });
            } catch (error) {
                Utils.log('error', 'Error enviando notificación de vencidos', error);
            }
        }
    }

    // Estadísticas detalladas del cliente
    async mostrarEstadisticasCliente(sender, senderNumber) {
        const cliente = this.clientes[senderNumber];
        if (!cliente) {
            await this.sock.sendMessage(sender, { 
                text: '❌ No tienes historial de pedidos registrado.' 
            });
            return;
        }
        
        const pedidosCliente = this.pedidos.filter(p => p.cliente === senderNumber);
        const pedidosCompletados = pedidosCliente.filter(p => p.estado === 'entregado' || p.estado === 'completado');
        
        let statsText = `📊 *TUS ESTADÍSTICAS*\n\n`;
        statsText += `👤 *Cliente:* ${cliente.nombre}\n`;
        statsText += `📱 *Teléfono:* ${cliente.telefono}\n\n`;
        
        statsText += `📦 *Resumen de pedidos:*\n`;
        statsText += `• Total pedidos: ${pedidosCliente.length}\n`;
        statsText += `• Completados: ${pedidosCompletados.length}\n`;
        statsText += `• En proceso: ${pedidosCliente.filter(p => 
            p.estado === 'pendiente' || p.estado === 'confirmado' || p.estado === 'en_proceso'
        ).length}\n\n`;
        
        statsText += `💰 *Información financiera:*\n`;
        statsText += `• Total invertido: ${Utils.formatearMoneda(cliente.totalCompras)}\n`;
        if (pedidosCliente.length > 0) {
            const promedioCompra = cliente.totalCompras / pedidosCliente.length;
            statsText += `• Promedio por pedido: ${Utils.formatearMoneda(promedioCompra)}\n`;
        }
        
        // Productos más pedidos
        const productosCliente = {};
        pedidosCliente.forEach(pedido => {
            pedido.items.forEach(item => {
                const producto = item.producto.toLowerCase();
                productosCliente[producto] = (productosCliente[producto] || 0) + item.cantidad;
            });
        });
        
        const topProductos = Object.entries(productosCliente)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
            
        if (topProductos.length > 0) {
            statsText += `\n🏆 *Tus productos favoritos:*\n`;
            topProductos.forEach(([producto, cantidad], index) => {
                statsText += `${index + 1}. ${producto}: ${cantidad} unidades\n`;
            });
        }
        
        // Fecha del primer y último pedido
        if (pedidosCliente.length > 0) {
            const fechas = pedidosCliente.map(p => new Date(p.fecha)).sort((a, b) => a - b);
            const primerPedido = fechas[0].toLocaleDateString('es-ES');
            const ultimoPedido = fechas[fechas.length - 1].toLocaleDateString('es-ES');
            
            statsText += `\n📅 *Historial:*\n`;
            statsText += `• Cliente desde: ${primerPedido}\n`;
            statsText += `• Último pedido: ${ultimoPedido}\n`;
        }
        
        await this.sock.sendMessage(sender, { text: statsText });
    }

    // Programar recordatorio para cliente
    async programarRecordatorio(pedidoId, dias = 1) {
        setTimeout(async () => {
            const pedido = this.pedidos.find(p => p.id === pedidoId);
            if (!pedido || pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
                return;
            }
            
            const clienteJid = pedido.cliente.includes('@') ? pedido.cliente : `${pedido.cliente}@s.whatsapp.net`;
            const recordatorioText = `🔔 *RECORDATORIO DE PEDIDO*\n\n` +
                `Tu pedido ${pedido.id} sigue en proceso.\n` +
                `Estado actual: ${pedido.estado.toUpperCase()}\n\n` +
                `Si tienes dudas, usa !estado ${pedido.id} para más detalles.`;
                
            try {
                await this.sock.sendMessage(clienteJid, { text: recordatorioText });
                Utils.log('info', `Recordatorio enviado para pedido ${pedidoId}`);
            } catch (error) {
                Utils.log('error', 'Error enviando recordatorio', { pedidoId, error });
            }
        }, dias * 24 * 60 * 60 * 1000); // Convertir días a milisegundos
    }

    // Validar y sugerir mejoras en pedido
    validarPedido(texto) {
        const validacion = Utils.validarFormatoPedido(texto);
        
        let respuesta = {
            esValido: validacion.valido,
            mensaje: '',
            sugerencias: validacion.sugerencias
        };
        
        if (validacion.valido) {
            respuesta.mensaje = '✅ Formato de pedido correcto';
        } else {
            respuesta.mensaje = '❌ Formato incompleto. ';
            respuesta.mensaje += `Tienes ${validacion.camposEncontrados}/${validacion.camposRequeridos} campos requeridos.\n\n`;
            respuesta.mensaje += 'Sugerencias:\n';
            respuesta.mensaje += validacion.sugerencias.map(s => `• ${s}`).join('\n');
            respuesta.mensaje += '\n\nUsa !ayuda para ver el formato correcto.';
        }
        
        return respuesta;
    }

    // Generar código QR para pedido (simulado)
    generarCodigoSeguimiento(pedidoId) {
        // En un entorno real, esto generaría un QR real
        const url = `https://daatcs.com/tracking/${pedidoId}`;
        return {
            url: url,
            mensaje: `🔍 *CÓDIGO DE SEGUIMIENTO*\n\nPedido: ${pedidoId}\nURL de seguimiento: ${url}\n\n(Funcionalidad de QR próximamente)`
        };
    }
}

module.exports = ComandosBot;
