// Estructura de nuestra "Base de Datos" en memoria RAM
let database = {
    sensor_name: "Sensor_Local_01",
    records: []
};

// Inicializar el gráfico de Chart.js
const ctx = document.getElementById('sensorChart').getContext('2d');
const sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Eje X: Tiempos
        datasets: [{
            label: 'Lecturas de Sensor',
            data: [], // Eje Y: Valores
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderWidth: 2.5,
            tension: 0.2,
            fill: true,
            pointBackgroundColor: '#2563eb'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Magnitud' } },
            x: { title: { display: true, text: 'Marca de Tiempo' } }
        }
    }
});

// 1. FUNCIÓN PARA AGREGAR DATO MANUALMENTE
function agregarDato() {
    const input = document.getElementById('sensorValue');
    const valor = parseFloat(input.value);

    if (isNaN(valor)) {
        alert("Por favor, ingresa un número válido.");
        return;
    }

    const ahora = new Date();
    const timestamp = ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString();

    // Guardamos en nuestro objeto JSON estructurado
    database.records.push({
        timestamp: timestamp,
        value: valor
    });

    actualizarInterfaz();
    
    input.value = '';
    input.focus();
}

// 2. FUNCIÓN PARA CARGAR UN ARCHIVO JSON EXISTENTE
function cargarJSON(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            const jsonParseado = JSON.parse(e.target.result);
            
            // Validación básica de la estructura
            if (jsonParseado && Array.isArray(jsonParseado.records)) {
                database = jsonParseado;
                actualizarInterfaz();
                alert(`¡Base de datos cargada con éxito! Se encontraron ${database.records.length} registros.`);
            } else {
                alert("El archivo JSON no tiene el formato correcto (debe contener un arreglo llamado 'records').");
            }
        } catch (err) {
            alert("Error al leer el archivo JSON. Asegúrate de que esté bien escrito.");
        }
    };
    lector.readAsText(archivo);
}

// 3. FUNCIÓN PARA GENERAR Y DESCARGAR EL ARCHIVO JSON
function guardarYDescargarJSON() {
    if (database.records.length === 0) {
        alert("No hay registros en la base de datos para guardar.");
        return;
    }

    // Convertimos el objeto de JavaScript a una cadena de texto JSON bien formateada
    const jsonString = JSON.stringify(database, null, 4);
    
    // Creamos un archivo temporal (Blob) en el navegador
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Simulación de descarga por software
    const linkTemporal = document.createElement("a");
    linkTemporal.href = url;
    linkTemporal.download = `bd_sensor_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(linkTemporal);
    linkTemporal.click();
    document.body.removeChild(linkTemporal);
}

// 4. ACTUALIZAR EL GRÁFICO Y LAS MÉTRICAS
function actualizarInterfaz() {
    // Limpiamos los datos anteriores del gráfico
    sensorChart.data.labels = [];
    sensorChart.data.datasets[0].data = [];

    let valores = [];
    let suma = 0;

    // Poblamos el gráfico con el contenido actual de la base de datos
    database.records.forEach(registro => {
        sensorChart.data.labels.push(registro.timestamp);
        sensorChart.data.datasets[0].data.push(registro.value);
        valores.push(registro.value);
        suma += registro.value;
    });

    sensorChart.update();

    // Calcular estadísticas en tiempo real
    if (valores.length > 0) {
        const max = Math.max(...valores);
        const min = Math.min(...valores);
        const prom = suma / valores.length;

        document.getElementById('stat-max').innerText = max.toFixed(2);
        document.getElementById('stat-min').innerText = min.toFixed(2);
        document.getElementById('stat-prom').innerText = prom.toFixed(2);
    } else {
        document.getElementById('stat-max').innerText = "--";
        document.getElementById('stat-min').innerText = "--";
        document.getElementById('stat-prom').innerText = "--";
    }
}

// 5. LIMPIAR MEMORIA
function limpiarTodo() {
    if (confirm("¿Estás seguro de que deseas vaciar la base de datos actual? (Perderás los cambios no guardados)")) {
        database.records = [];
        actualizarInterfaz();
        document.getElementById('jsonFile').value = '';
    }
}