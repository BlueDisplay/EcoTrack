/*
 * HydroFlujo - Historical Data Manager
 * Manejo de datos históricos de precipitación
 */

// ==========================================================================
// Historical Data Manager
// ==========================================================================

const HistoricalDataManager = {
    historicalData: [],
    monthlyStats: {},
    annualStats: {},
    extremeEvents: [],

    // Initialize historical data loading
    async init() {
        try {
            console.log('📊 Cargando datos históricos...');
            await this.loadHistoricalData();
            this.processStatistics();
            this.updateUI();
            this.initializeCharts();
            console.log('✅ Datos históricos cargados exitosamente');
        } catch (error) {
            console.error('❌ Error cargando datos históricos:', error);
            this.showErrorState();
        }
    },

    // Load historical rainfall data
    async loadHistoricalData() {
        const response = await fetch('assets/data/hermosillo_lluvias_historicas.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        this.historicalData = this.parseCSV(csvText);
        
        console.log(`📈 Cargados ${this.historicalData.length} eventos históricos`);
    },

    // Parse CSV data
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const record = {};
                
                headers.forEach((header, index) => {
                    let value = values[index]?.trim();
                    
                    // Clean header name
                    const cleanHeader = header.trim();
                    
                    // Convert specific fields
                    if (cleanHeader === 'fecha') {
                        record[cleanHeader] = new Date(value);
                    } else if (cleanHeader === 'precipitacion_mm' || 
                              cleanHeader === 'temp_max_c' || 
                              cleanHeader === 'temp_min_c') {
                        record[cleanHeader] = parseFloat(value) || 0;
                    } else if (cleanHeader === 'latitud' || cleanHeader === 'longitud') {
                        record[cleanHeader] = parseFloat(value);
                    } else if (cleanHeader === 'altitud_msnm' || cleanHeader === 'estacion_id') {
                        record[cleanHeader] = parseInt(value);
                    } else {
                        record[cleanHeader] = value;
                    }
                });
                
                data.push(record);
            }
        }

        return data;
    },

    // Process statistics from historical data
    processStatistics() {
        // Monthly statistics
        this.monthlyStats = this.calculateMonthlyStats();
        
        // Annual statistics  
        this.annualStats = this.calculateAnnualStats();
        
        // Extreme events (≥50mm)
        this.extremeEvents = this.historicalData
            .filter(event => event.precipitacion_mm >= 50)
            .sort((a, b) => b.precipitacion_mm - a.precipitacion_mm)
            .slice(0, 10); // Top 10 extreme events
    },

    // Calculate monthly statistics
    calculateMonthlyStats() {
        const monthlyData = {};
        
        // Initialize months
        for (let month = 0; month < 12; month++) {
            monthlyData[month] = {
                total: 0,
                events: 0,
                average: 0,
                max: 0
            };
        }

        // Process each event
        this.historicalData.forEach(event => {
            const month = event.fecha.getMonth();
            const precip = event.precipitacion_mm;
            
            monthlyData[month].total += precip;
            monthlyData[month].events += 1;
            monthlyData[month].max = Math.max(monthlyData[month].max, precip);
        });

        // Calculate averages
        Object.keys(monthlyData).forEach(month => {
            const data = monthlyData[month];
            data.average = data.events > 0 ? data.total / data.events : 0;
        });

        return monthlyData;
    },

    // Calculate annual statistics
    calculateAnnualStats() {
        const annualData = {};
        
        this.historicalData.forEach(event => {
            const year = event.fecha.getFullYear();
            
            if (!annualData[year]) {
                annualData[year] = {
                    total: 0,
                    events: 0,
                    maxDaily: 0,
                    extremeEvents: 0
                };
            }
            
            const precip = event.precipitacion_mm;
            annualData[year].total += precip;
            annualData[year].events += 1;
            annualData[year].maxDaily = Math.max(annualData[year].maxDaily, precip);
            
            if (precip >= 50) {
                annualData[year].extremeEvents += 1;
            }
        });

        return annualData;
    },

    // Update UI with statistics
    updateUI() {
        // Update summary statistics
        const totalYears = Object.keys(this.annualStats).length;
        const totalEvents = this.historicalData.length;
        const totalPrecip = this.historicalData.reduce((sum, event) => sum + event.precipitacion_mm, 0);
        const extremeEventsCount = this.extremeEvents.length;

        // Update DOM elements
        this.updateElement('hist-years', `${totalYears}+`);
        this.updateElement('hist-total-events', totalEvents.toLocaleString());
        this.updateElement('hist-total-precip', Math.round(totalPrecip).toLocaleString());
        this.updateElement('hist-extreme-events', extremeEventsCount);

        // Update extreme events timeline
        this.updateExtremeEventsTimeline();
    },

    // Update DOM element safely
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    },

    // Update extreme events timeline
    updateExtremeEventsTimeline() {
        const timeline = document.getElementById('extreme-events-timeline');
        if (!timeline) return;

        timeline.innerHTML = this.extremeEvents.slice(0, 5).map(event => `
            <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100 hover:shadow-md transition-shadow">
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-cloud-rain text-red-600"></i>
                    </div>
                </div>
                <div class="flex-grow">
                    <div class="flex items-center gap-2 mb-1">
                        <h4 class="font-semibold text-slate-800">${event.precipitacion_mm} mm</h4>
                        <span class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">${event.severidad}</span>
                    </div>
                    <p class="text-sm text-slate-600">
                        ${this.formatDate(event.fecha)} • ${event.estacion}
                    </p>
                </div>
                <div class="text-right">
                    <div class="text-xs text-slate-500">
                        ${event.temp_max_c ? `${event.temp_max_c}°C max` : 'T° no disponible'}
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Initialize charts
    initializeCharts() {
        this.initAnnualPrecipChart();
        this.initMonthlyDistChart();
    },

    // Initialize annual precipitation chart
    initAnnualPrecipChart() {
        const canvas = document.getElementById('annual-precip-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Get last 20 years of data
        const currentYear = new Date().getFullYear();
        const years = [];
        const precipData = [];
        
        for (let year = currentYear - 19; year <= currentYear; year++) {
            if (this.annualStats[year]) {
                years.push(year.toString());
                precipData.push(Math.round(this.annualStats[year].total));
            }
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Precipitación Anual (mm)',
                    data: precipData,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    // Initialize monthly distribution chart
    initMonthlyDistChart() {
        const canvas = document.getElementById('monthly-dist-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const monthlyTotals = [];
        for (let month = 0; month < 12; month++) {
            const yearCount = Object.keys(this.annualStats).length;
            const monthTotal = this.monthlyStats[month].total;
            monthlyTotals.push(Math.round(monthTotal / yearCount)); // Average per month
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [{
                    label: 'Precipitación Promedio (mm)',
                    data: monthlyTotals,
                    backgroundColor: [
                        '#3b82f6', '#06b6d4', '#10b981', '#22c55e',
                        '#84cc16', '#eab308', '#f59e0b', '#ef4444',
                        '#ec4899', '#a855f7', '#8b5cf6', '#6366f1'
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    // Format date for display
    formatDate(date) {
        return date.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    },

    // Show error state
    showErrorState() {
        const elements = [
            'hist-years', 'hist-total-events', 
            'hist-total-precip', 'hist-extreme-events'
        ];
        
        elements.forEach(id => {
            this.updateElement(id, '--');
        });

        const timeline = document.getElementById('extreme-events-timeline');
        if (timeline) {
            timeline.innerHTML = `
                <div class="text-center py-8 text-slate-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Error al cargar datos históricos</p>
                </div>
            `;
        }
    },

    // Get statistics for external use
    getStats() {
        return {
            totalEvents: this.historicalData.length,
            totalYears: Object.keys(this.annualStats).length,
            totalPrecipitation: this.historicalData.reduce((sum, event) => sum + event.precipitacion_mm, 0),
            extremeEvents: this.extremeEvents.length,
            monthlyStats: this.monthlyStats,
            annualStats: this.annualStats
        };
    }
};

// Export for use in other modules
window.HistoricalDataManager = HistoricalDataManager;