#!/usr/bin/env python3
"""
Script para procesar datos históricos de CONAGUA
Convierte el archivo de texto de la estación 26139 (Hermosillo II) a formato CSV
"""

import re
import csv
import urllib.request
from datetime import datetime, date

def download_and_process_conagua_data():
    """
    Descarga y procesa los datos de CONAGUA
    """
    url = "https://smn.conagua.gob.mx/tools/RESOURCES/Normales_Climatologicas/Diarios/son/dia26139.txt"
    
    try:
        print("📡 Descargando datos de CONAGUA...")
        with urllib.request.urlopen(url) as response:
            text_data = response.read().decode('utf-8')
        
        print("✅ Datos descargados exitosamente")
        
        # Procesar los datos
        processed_data = parse_conagua_data(text_data)
        
        # Crear CSV
        create_csv_files(processed_data)
        
        return processed_data
        
    except Exception as e:
        print(f"❌ Error al procesar datos: {e}")
        return None

def parse_conagua_data(text_data):
    """
    Parsea el texto crudo de CONAGUA y extrae los datos meteorológicos
    """
    print("🔄 Procesando datos meteorológicos...")
    
    lines = text_data.split('\n')
    data_records = []
    
    # Patrón para encontrar líneas de datos
    # Formato: YYYY-MM-DD\tPRECIP\tEVAP\tTMAX\tTMIN
    data_pattern = r'^(\d{4}-\d{2}-\d{2})\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)'
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('COMISIÓN') or 'FECHA' in line:
            continue
            
        match = re.match(data_pattern, line)
        if match:
            try:
                fecha_str = match.group(1)
                precip_str = match.group(2)
                evap_str = match.group(3)
                tmax_str = match.group(4)
                tmin_str = match.group(5)
                
                # Parsear fecha
                try:
                    fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
                except ValueError:
                    continue
                
                # Limpiar y convertir valores
                precip = clean_numeric_value(precip_str)
                evap = clean_numeric_value(evap_str)
                tmax = clean_numeric_value(tmax_str)
                tmin = clean_numeric_value(tmin_str)
                
                # Solo incluir registros con precipitación válida
                if precip is not None:
                    record = {
                        'fecha': fecha,
                        'precipitacion_mm': precip,
                        'evaporacion_mm': evap,
                        'temp_max_c': tmax,
                        'temp_min_c': tmin,
                        'estacion': 'HERMOSILLO II (DGE)',
                        'estacion_id': '26139',
                        'latitud': 29.09888889,
                        'longitud': -110.9541667,
                        'altitud_msnm': 221
                    }
                    data_records.append(record)
                    
            except Exception as e:
                print(f"⚠️  Error procesando línea: {line[:50]}... - {e}")
                continue
    
    print(f"✅ Procesados {len(data_records)} registros meteorológicos")
    return data_records

def clean_numeric_value(value_str):
    """
    Limpia y convierte valores numéricos, maneja casos especiales
    """
    if not value_str or value_str.upper() in ['NULO', 'NULL', '', '--']:
        return None
    
    try:
        # Remover caracteres no numéricos excepto punto y signo negativo
        cleaned = re.sub(r'[^\d.-]', '', value_str)
        if cleaned:
            return float(cleaned)
    except (ValueError, TypeError):
        pass
    
    return None

def create_csv_files(data_records):
    """
    Crea archivos CSV con los datos procesados
    """
    if not data_records:
        print("❌ No hay datos para crear CSV")
        return
    
    # Ordenar por fecha
    data_records.sort(key=lambda x: x['fecha'])
    
    # Archivo principal con todos los datos
    csv_path_completo = '/Users/juangamez/Documents/GitHub/EcoTrack/assets/data/hermosillo_historico_completo.csv'
    
    with open(csv_path_completo, 'w', newline='', encoding='utf-8') as csvfile:
        if data_records:
            fieldnames = data_records[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for record in data_records:
                # Convertir fecha a string para CSV
                record_copy = record.copy()
                record_copy['fecha'] = record['fecha'].strftime('%Y-%m-%d')
                writer.writerow(record_copy)
    
    print(f"✅ Archivo completo creado: {csv_path_completo}")
    
    # Filtrar solo eventos significativos de lluvia (≥ 1mm)
    lluvia_records = [r for r in data_records if r['precipitacion_mm'] and r['precipitacion_mm'] >= 1.0]
    
    if lluvia_records:
        # Agregar clasificación de severidad
        for record in lluvia_records:
            record['severidad'] = classify_rainfall(record['precipitacion_mm'])
            record['tipo_evento'] = 'precipitacion'
        
        # Archivo para eventos de lluvia significativos
        csv_path_lluvias = '/Users/juangamez/Documents/GitHub/EcoTrack/assets/data/hermosillo_lluvias_historicas.csv'
        
        with open(csv_path_lluvias, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = lluvia_records[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for record in lluvia_records:
                record_copy = record.copy()
                record_copy['fecha'] = record['fecha'].strftime('%Y-%m-%d')
                writer.writerow(record_copy)
        
        print(f"✅ Archivo de lluvias creado: {csv_path_lluvias}")
        
        # Estadísticas
        print_statistics(data_records, lluvia_records)
    
    return data_records, lluvia_records

def classify_rainfall(precip_mm):
    """
    Clasifica la precipitación según su intensidad
    """
    if precip_mm >= 50:
        return 'muy_alta'
    elif precip_mm >= 20:
        return 'alta'
    elif precip_mm >= 10:
        return 'moderada'
    elif precip_mm >= 1:
        return 'baja'
    else:
        return 'minima'

def print_statistics(data_completo, data_lluvia):
    """
    Imprime estadísticas del dataset
    """
    print("\n📊 ESTADÍSTICAS DEL DATASET")
    print("=" * 50)
    
    # Período de datos
    fechas = [r['fecha'] for r in data_completo if r['fecha']]
    fecha_inicio = min(fechas)
    fecha_fin = max(fechas)
    print(f"📅 Período: {fecha_inicio} a {fecha_fin}")
    print(f"📊 Total de registros: {len(data_completo):,}")
    print(f"🌧️  Días con lluvia (≥1mm): {len(data_lluvia):,}")
    
    # Estadísticas de precipitación
    precipitaciones = [r['precipitacion_mm'] for r in data_completo if r['precipitacion_mm'] is not None]
    total_precip = sum(precipitaciones)
    max_precip = max(precipitaciones) if precipitaciones else 0
    
    print(f"\n💧 PRECIPITACIÓN:")
    print(f"   • Total acumulada: {total_precip:.2f} mm")
    
    # Calcular años
    dias_total = (fecha_fin - fecha_inicio).days
    años = dias_total / 365.25
    print(f"   • Promedio anual: {total_precip / años:.2f} mm")
    print(f"   • Máxima en 24h: {max_precip:.2f} mm")
    
    # Eventos extremos
    eventos_extremos = [r for r in data_lluvia if r['precipitacion_mm'] >= 50]
    print(f"   • Eventos extremos (≥50mm): {len(eventos_extremos)}")
    
    if eventos_extremos:
        max_evento = max(eventos_extremos, key=lambda x: x['precipitacion_mm'])
        print(f"   • Evento más intenso: {max_evento['precipitacion_mm']:.2f} mm el {max_evento['fecha']}")
    
    # Distribución por severidad
    print(f"\n🔍 DISTRIBUCIÓN POR SEVERIDAD:")
    severidad_counts = {}
    for record in data_lluvia:
        sev = record.get('severidad', 'desconocida')
        severidad_counts[sev] = severidad_counts.get(sev, 0) + 1
    
    for severidad, count in severidad_counts.items():
        print(f"   • {severidad}: {count:,} eventos")

if __name__ == "__main__":
    print("🌊 HydroFlujo - Procesador de Datos Históricos CONAGUA")
    print("=" * 60)
    
    try:
        data = download_and_process_conagua_data()
        if data:
            print("\n✅ ¡Procesamiento completado exitosamente!")
            print("📁 Archivos CSV listos para integrar a la plataforma")
        else:
            print("\n❌ Error en el procesamiento")
            
    except KeyboardInterrupt:
        print("\n⚠️  Procesamiento interrumpido por el usuario")
    except Exception as e:
        print(f"\n❌ Error general: {e}")