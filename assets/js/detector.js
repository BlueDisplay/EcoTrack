/**
 * EcoScan - VERSIÓN QUE SÍ FUNCIONA
 * Simplicidad extrema para asegurar funcionamiento
 */

console.log('🚀 EcoScan iniciando...');

// ⚙️ CONFIGURACIÓN
const CONFIG = {
    API_KEY: "5DhCtO8u8D7lzplKgnkA",
    ROBOFLOW_URL: "https://detect.roboflow.com/visual-pollution-detection-04jk5/3"
};

// 📦 VARIABLES GLOBALES
let currentFile = null;
let detections = [];
let detectionMap = null;

// 🎯 ESPERAR A QUE EL DOM ESTÉ LISTO
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado, inicializando...');
    init();
});

// 🚀 FUNCIÓN DE INICIALIZACIÓN
function init() {
    console.log('🔧 Configurando eventos...');
    
    // Verificar dependencias críticas
    if (typeof fetch === 'undefined') {
        console.error('❌ fetch no está disponible');
        updateStatus('Error: Navegador no compatible', 'error');
        return;
    }
    
    // Input de imagen
    const input = document.getElementById('imageInput');
    if (input) {
        input.addEventListener('change', handleImageSelect);
        console.log('✅ Input de imagen configurado');
    } else {
        console.error('❌ No se encontró el input de imagen');
        updateStatus('Error: Elemento imageInput no encontrado', 'error');
        return;
    }
    
    // Botón detectar
    const detectBtn = document.getElementById('detectBtn');
    if (detectBtn) {
        detectBtn.addEventListener('click', runDetection);
        detectBtn.disabled = true;
        console.log('✅ Botón detectar configurado');
    } else {
        console.error('❌ No se encontró el botón detectar');
        updateStatus('Error: Elemento detectBtn no encontrado', 'error');
        return;
    }
    
    // Botón PDF
    const pdfBtn = document.getElementById('generatePdfBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', generateReport);
        console.log('✅ Botón PDF configurado');
    }
    
    // Verificar imagen
    const img = document.getElementById('currentImage');
    if (!img) {
        console.error('❌ No se encontró la imagen');
        updateStatus('Error: Elemento currentImage no encontrado', 'error');
        return;
    }
    
    // Inicializar mapa
    initializeMap();
    
    updateStatus('Sistema listo - Selecciona una imagen', 'success');
    console.log('🎯 Inicialización completada exitosamente');
}

// 🗺️ INICIALIZAR MAPA
function initializeMap() {
    try {
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer && typeof L !== 'undefined') {
            // Crear contenedor del mapa
            mapContainer.innerHTML = '<div id="detectionMap" style="height: 100%; width: 100%; border-radius: 0.75rem;"></div>';
            
            // Inicializar mapa centrado en Hermosillo
            detectionMap = L.map('detectionMap').setView([29.0892, -110.9608], 12);
            
            // Agregar tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(detectionMap);
            
            // Agregar marcador por defecto
            L.marker([29.0892, -110.9608])
                .addTo(detectionMap)
                .bindPopup('Hermosillo, Sonora<br>Ubicación por defecto')
                .openPopup();
                
            console.log('✅ Mapa inicializado correctamente');
        }
    } catch (error) {
        console.error('❌ Error inicializando mapa:', error);
    }
}

// 📁 MANEJAR SELECCIÓN DE IMAGEN
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📁 Archivo seleccionado:', file.name);
    currentFile = file;
    
    updateStatus('Cargando imagen...', 'loading');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('currentImage');
        const placeholder = document.getElementById('imagePlaceholder');
        
        if (img && placeholder) {
            img.src = e.target.result;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            
            img.onload = function() {
                updateStatus('Imagen cargada - Presiona Analizar con IA', 'success');
                enableDetectButton();
                extractEXIFLocation(file);
            };
        }
    };
    reader.readAsDataURL(file);
    
    // Actualizar información del archivo
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('currentFileName');
    if (fileInfo && fileName) {
        fileName.textContent = file.name;
        fileInfo.classList.remove('hidden');
    }
}

// 📍 EXTRAER UBICACIÓN EXIF
function extractEXIFLocation(file) {
    try {
        // Esta función simula la extracción de EXIF
        // En una implementación real, usarías una librería como EXIF.js
        console.log('📍 Intentando extraer datos EXIF...');
        
        // Por ahora, usar ubicación por defecto de Hermosillo
        updateMapLocation(29.0892, -110.9608, 'Ubicación por defecto - Hermosillo, Sonora');
        
    } catch (error) {
        console.error('❌ Error extrayendo EXIF:', error);
        updateMapLocation(29.0892, -110.9608, 'Ubicación por defecto - Sin datos GPS');
    }
}

// 🗺️ ACTUALIZAR UBICACIÓN EN MAPA
function updateMapLocation(lat, lng, description) {
    if (detectionMap) {
        // Limpiar marcadores existentes
        detectionMap.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                detectionMap.removeLayer(layer);
            }
        });
        
        // Agregar nuevo marcador
        L.marker([lat, lng])
            .addTo(detectionMap)
            .bindPopup(description)
            .openPopup();
            
        // Centrar mapa
        detectionMap.setView([lat, lng], 15);
        
        // Ocultar placeholder
        const mapPlaceholder = document.getElementById('mapPlaceholder');
        if (mapPlaceholder) {
            mapPlaceholder.style.display = 'none';
        }
    }
}

// ✅ HABILITAR BOTÓN DETECTAR
function enableDetectButton() {
    const btn = document.getElementById('detectBtn');
    if (btn) {
        btn.disabled = false;
    }
}

// 🤖 EJECUTAR DETECCIÓN
async function runDetection() {
    if (!currentFile) {
        alert('Primero selecciona una imagen');
        return;
    }
    
    console.log('🤖 Iniciando detección...');
    updateStatus('Analizando con IA...', 'loading');
    
    const detectBtn = document.getElementById('detectBtn');
    if (detectBtn) detectBtn.disabled = true;
    
    try {
        // Preparar imagen
        const img = document.getElementById('currentImage');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Redimensionar si es necesario
        const maxSize = 1024;
        let { naturalWidth: w, naturalHeight: h } = img;
        
        if (w > maxSize || h > maxSize) {
            const ratio = Math.min(maxSize / w, maxSize / h);
            w = Math.floor(w * ratio);
            h = Math.floor(h * ratio);
        }
        
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        
        // Convertir a base64
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = imageData.split(',')[1];
        
        console.log('📡 Enviando a Roboflow...');
        
        // Llamar API
        const response = await fetch(CONFIG.ROBOFLOW_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `api_key=${CONFIG.API_KEY}&image=${encodeURIComponent(base64)}`
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Respuesta recibida:', result);
        
        // Mostrar JSON
        const jsonEl = document.getElementById('jsonResponse');
        if (jsonEl) {
            jsonEl.value = JSON.stringify(result, null, 2);
        }
        
        // Procesar detecciones
        if (result.predictions && result.predictions.length > 0) {
            detections = result.predictions;
            drawDetections(detections);
            updateStats(detections);
            updateStatus(`✅ ${detections.length} objetos detectados`, 'success');
            
            // Agregar marcadores al mapa
            addDetectionsToMap(detections);
        } else {
            detections = [];
            clearDetections();
            updateStats([]);
            updateStatus('No se detectaron objetos', 'info');
        }
        
    } catch (error) {
        console.error('❌ Error en detección:', error);
        updateStatus(`Error: ${error.message}`, 'error');
        
        const jsonEl = document.getElementById('jsonResponse');
        if (jsonEl) {
            jsonEl.value = `Error: ${error.message}`;
        }
    }
    
    if (detectBtn) detectBtn.disabled = false;
}

// 🗺️ AGREGAR DETECCIONES AL MAPA
function addDetectionsToMap(predictions) {
    if (!detectionMap || !predictions.length) return;
    
    // Por ahora, agregar un marcador genérico para las detecciones
    // En una implementación real, podrías usar coordenadas específicas por detección
    const lat = 29.0892 + (Math.random() - 0.5) * 0.01; // Pequeña variación aleatoria
    const lng = -110.9608 + (Math.random() - 0.5) * 0.01;
    
    const detectionMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                     <i class="fas fa-exclamation-triangle"></i> ${predictions.length} objetos
                   </div>`,
            iconSize: [120, 30],
            iconAnchor: [60, 15]
        })
    }).addTo(detectionMap);
    
    const popupContent = `
        <div style="font-family: system-ui; min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #dc2626; font-weight: bold;">
                <i class="fas fa-exclamation-triangle"></i> Contaminación Detectada
            </h4>
            <p style="margin: 0 0 8px 0; font-size: 14px;">
                <strong>${predictions.length}</strong> objetos de basura identificados
            </p>
            <div style="max-height: 150px; overflow-y: auto;">
                ${predictions.map((pred, i) => `
                    <div style="padding: 4px 0; border-bottom: 1px solid #e5e7eb;">
                        <span style="font-weight: 500;">${pred.class}</span>
                        <span style="color: #6b7280; font-size: 12px;"> (${Math.round(pred.confidence * 100)}%)</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    detectionMarker.bindPopup(popupContent);
}

// 🎨 DIBUJAR DETECCIONES
function drawDetections(predictions) {
    clearDetections();
    
    if (!predictions || predictions.length === 0) return;
    
    const img = document.getElementById('currentImage');
    const container = img.parentElement;
    
    if (!img || !container) return;
    
    // Asegurar que el contenedor tenga posición relativa
    container.style.position = 'relative';
    
    const scaleX = img.offsetWidth / img.naturalWidth;
    const scaleY = img.offsetHeight / img.naturalHeight;
    
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];
    
    predictions.forEach((pred, i) => {
        const { x, y, width, height, confidence, class: className } = pred;
        
        // Calcular posición en píxeles
        const centerX = x * scaleX;
        const centerY = y * scaleY;
        const boxW = width * scaleX;
        const boxH = height * scaleY;
        
        const left = centerX - (boxW / 2);
        const top = centerY - (boxH / 2);
        
        // Crear caja
        const box = document.createElement('div');
        box.className = 'detection-box';
        box.style.cssText = `
            position: absolute;
            left: ${left}px;
            top: ${top}px;
            width: ${boxW}px;
            height: ${boxH}px;
            border: 3px solid ${colors[i % colors.length]};
            background: ${colors[i % colors.length]}20;
            pointer-events: none;
            z-index: 1000;
            box-sizing: border-box;
            border-radius: 4px;
        `;
        
        // Crear etiqueta
        const label = document.createElement('div');
        label.textContent = `${className} ${Math.round(confidence * 100)}%`;
        label.style.cssText = `
            position: absolute;
            top: -28px;
            left: 0;
            background: ${colors[i % colors.length]};
            color: white;
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 4px;
            white-space: nowrap;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        box.appendChild(label);
        container.appendChild(box);
    });
    
    console.log(`✅ ${predictions.length} cajas de detección dibujadas`);
}

// 🧹 LIMPIAR DETECCIONES
function clearDetections() {
    const img = document.getElementById('currentImage');
    if (img && img.parentElement) {
        const boxes = img.parentElement.querySelectorAll('.detection-box');
        boxes.forEach(box => box.remove());
    }
}

// 📊 ACTUALIZAR ESTADÍSTICAS
function updateStats(predictions) {
    const total = predictions.length;
    
    let avgConf = 0;
    let contamination = 0;
    
    if (total > 0) {
        avgConf = predictions.reduce((sum, p) => sum + p.confidence, 0) / total;
        contamination = Math.min(total * 15, 100); // 15% por objeto, máximo 100%
    }
    
    setStat('totalObjects', total);
    setStat('avgConfidence', Math.round(avgConf * 100) + '%');
    setStat('contaminationIndex', contamination + '%');
}

// 📝 ESTABLECER ESTADÍSTICA
function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// 📄 GENERAR REPORTE PDF
function generateReport() {
    if (!currentFile || detections.length === 0) {
        alert('Primero carga una imagen y ejecuta una detección');
        return;
    }
    
    if (typeof window.jspdf === 'undefined') {
        alert('jsPDF no está disponible');
        return;
    }
    
    updateStatus('Generando PDF...', 'loading');
    
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        // Configurar fuentes y colores
        pdf.setTextColor(40, 40, 40);
        
        // Título principal
        pdf.setFontSize(24);
        pdf.setFont(undefined, 'bold');
        pdf.text('EcoTrack - Reporte de Análisis IA', 20, 30);
        
        // Línea decorativa
        pdf.setDrawColor(34, 197, 94);
        pdf.setLineWidth(2);
        pdf.line(20, 35, 190, 35);
        
        // Información básica
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Archivo analizado: ${currentFile.name}`, 20, 50);
        pdf.text(`Fecha y hora: ${new Date().toLocaleString('es-MX')}`, 20, 60);
        pdf.text(`Objetos detectados: ${detections.length}`, 20, 70);
        
        // Estadísticas
        const avgConf = detections.reduce((sum, p) => sum + p.confidence, 0) / detections.length;
        const contamination = Math.min(detections.length * 15, 100);
        
        pdf.text(`Confianza promedio: ${Math.round(avgConf * 100)}%`, 20, 80);
        pdf.text(`Índice de contaminación: ${contamination}%`, 20, 90);
        
        // Sección de detecciones
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text('Detalle de Objetos Identificados:', 20, 110);
        
        // Lista de detecciones
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        let y = 125;
        
        detections.forEach((det, i) => {
            const conf = Math.round(det.confidence * 100);
            const line = `${i + 1}. ${det.class} - Confianza: ${conf}% - Coordenadas: (${Math.round(det.x)}, ${Math.round(det.y)})`;
            pdf.text(line, 25, y);
            y += 8;
            
            // Nueva página si es necesario
            if (y > 270) {
                pdf.addPage();
                y = 20;
            }
        });
        
        // Pie de página
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Generado por EcoTrack - Sistema de Detección de Contaminación IA', 20, 285);
        
        // Guardar PDF
        const fileName = `ecoscan-reporte-${currentFile.name.split('.')[0]}-${Date.now()}.pdf`;
        pdf.save(fileName);
        
        updateStatus('PDF generado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        updateStatus('Error generando PDF', 'error');
    }
}

// 📊 ACTUALIZAR ESTADO
function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusIndicator');
    if (!statusEl) return;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        loading: 'fas fa-spinner fa-spin',
        info: 'fas fa-info-circle'
    };
    
    statusEl.innerHTML = `<i class="${icons[type]}"></i> ${message}`;
    statusEl.className = `status-badge ${type}`;
    
    console.log(`[${type.toUpperCase()}] ${message}`);
}

console.log('✅ EcoScan funcional cargado completamente');