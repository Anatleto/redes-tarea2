// 1. ESTRUCTURA DE LA BASE DE DATOS
let database = {
    sensor_name: "Sensor_Local_01",
    records: []
};

// 2. INICIALIZACIÓN DE GRÁFICOS (CHART.JS)
const ctxTemp = document.getElementById('tempChart').getContext('2d');
const tempChart = new Chart(ctxTemp, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [{
            label: 'Temperatura (°C)',
            data: [], 
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderWidth: 2.5, tension: 0.2, fill: true
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

const ctxHum = document.getElementById('humChart').getContext('2d');
const humChart = new Chart(ctxHum, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [{
            label: 'Humedad (%)',
            data: [], 
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderWidth: 2.5, tension: 0.2, fill: true
        }]
    },
    options: { responsive: true, maintainAspectRatio: false }
});

// 3. FUNCIÓN PARA AGREGAR DATOS (Botón "Registrar Dato")
function agregarDato() {
    const inputTemp = document.getElementById('tempValue');
    const inputHum = document.getElementById('humValue');
    
    const valorTemp = parseFloat(inputTemp.value);
    const valorHum = parseFloat(inputHum.value);

    if (isNaN(valorTemp) || isNaN(valorHum)) {
        alert("Por favor, ingresa números válidos en ambos campos.");
        return;
    }

    const ahora = new Date();
    const timestamp = ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString();

    // Guardar en la base de datos
    database.records.push({
        timestamp: timestamp,
        temperatura: valorTemp,
        humedad: valorHum
    });

    actualizarInterfaz();
    
    // Limpiar inputs
    inputTemp.value = '';
    inputHum.value = '';
    inputTemp.focus();
}

// 4. ACTUALIZAR GRÁFICOS Y ESTADÍSTICAS
function actualizarInterfaz() {
    // Vaciar datos actuales de los gráficos
    tempChart.data.labels = [];
    tempChart.data.datasets[0].data = [];
    humChart.data.labels = [];
    humChart.data.datasets[0].data = [];

    let arrayTemp = [];
    let arrayHum = [];

    // Recorrer la base de datos y llenar los gráficos
    database.records.forEach(registro => {
        if (registro.temperatura !== undefined) {
            tempChart.data.labels.push(registro.timestamp);
            tempChart.data.datasets[0].data.push(registro.temperatura);
            arrayTemp.push(registro.temperatura);
        }
        if (registro.humedad !== undefined) {
            humChart.data.labels.push(registro.timestamp);
            humChart.data.datasets[0].data.push(registro.humedad);
            arrayHum.push(registro.humedad);
        }
    });

    tempChart.update();
    humChart.update();

    // Matemáticas de Temperatura
    if (arrayTemp.length > 0) {
        const sumT = arrayTemp.reduce((a, b) => a + b, 0);
        document.getElementById('temp-max').innerText = Math.max(...arrayTemp).toFixed(2);
        document.getElementById('temp-min').innerText = Math.min(...arrayTemp).toFixed(2);
        document.getElementById('temp-prom').innerText = (sumT / arrayTemp.length).toFixed(2);
    }

    // Matemáticas de Humedad
    if (arrayHum.length > 0) {
        const sumH = arrayHum.reduce((a, b) => a + b, 0);
        document.getElementById('hum-max').innerText = Math.max(...arrayHum).toFixed(2);
        document.getElementById('hum-min').innerText = Math.min(...arrayHum).toFixed(2);
        document.getElementById('hum-prom').innerText = (sumH / arrayHum.length).toFixed(2);
    }
}

// 5. FUNCIONES DE LIMPIEZA Y DESCARGA JSON
function limpiarTodo() {
    if (confirm("¿Estás seguro de que deseas vaciar la base de datos actual?")) {
        database.records = [];
        document.getElementById('temp-max').innerText = "--";
        document.getElementById('temp-min').innerText = "--";
        document.getElementById('temp-prom').innerText = "--";
        document.getElementById('hum-max').innerText = "--";
        document.getElementById('hum-min').innerText = "--";
        document.getElementById('hum-prom').innerText = "--";
        actualizarInterfaz();
    }
}

function guardarYDescargarJSON() {
    if (database.records.length === 0) {
        alert("No hay registros para guardar.");
        return;
    }
    const jsonString = JSON.stringify(database, null, 4);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bd_sensor_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
}

function cargarJSON(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(e) {
        try {
            const jsonParseado = JSON.parse(e.target.result);
            if (jsonParseado && Array.isArray(jsonParseado.records)) {
                database = jsonParseado;
                actualizarInterfaz();
                alert(`Base cargada. ${database.records.length} registros.`);
            }
        } catch (err) { alert("Error al leer el archivo JSON."); }
    };
    lector.readAsText(archivo);
}

// 6. CONEXIÓN ESP32 (WEBSOCKETS)
// Pon la IP real de tu ESP32 aquí
const socketUrl = 'ws://192.168.1.100:81'; 
try {
    const socket = new WebSocket(socketUrl);
    socket.onopen = () => { console.log("ESP32 Conectado"); socket.send("GET_DATA"); };
    socket.onmessage = (event) => {
        const dataJson = JSON.parse(event.data);
        const ahora = new Date();
        if (dataJson.temperatura !== undefined && dataJson.humedad !== undefined) {
            database.records.push({
                timestamp: ahora.toLocaleDateString() + ' ' + ahora.toLocaleTimeString(),
                temperatura: parseFloat(dataJson.temperatura),
                humedad: parseFloat(dataJson.humedad)
            });
            actualizarInterfaz();
        }
    };
} catch(e) { console.log("WebSocket no iniciado aún."); }