// Para guardar datos
let database = {
    sensor_name: "temperatura_y_humedad",
    records: []
};

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

// Graficos y estadisticas
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

    // Calculo de Temperatura
    if (arrayTemp.length > 0) {
        const sumT = arrayTemp.reduce((a, b) => a + b, 0);
        document.getElementById('temp-max').innerText = Math.max(...arrayTemp).toFixed(2);
        document.getElementById('temp-min').innerText = Math.min(...arrayTemp).toFixed(2);
        document.getElementById('temp-prom').innerText = (sumT / arrayTemp.length).toFixed(2);
    }

    // Calculo de Humedad
    if (arrayHum.length > 0) {
        const sumH = arrayHum.reduce((a, b) => a + b, 0);
        document.getElementById('hum-max').innerText = Math.max(...arrayHum).toFixed(2);
        document.getElementById('hum-min').innerText = Math.min(...arrayHum).toFixed(2);
        document.getElementById('hum-prom').innerText = (sumH / arrayHum.length).toFixed(2);
    }
}

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

// Conexion ESP32 (WEBSOCKETS)
const socketUrl = 'ws://201.239.52.240:82/'; // IP de la ESP32

let socket = null;

function conectarSocket() {
    try {
        socket = new WebSocket(socketUrl);
 
        socket.onopen = () => {
            console.log("ESP32 Conectado");
            socket.send("GET_DATA");
        };
 
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
 
        socket.onerror = (err) => {
            console.log("Error en el WebSocket:", err);
        };
 
        socket.onclose = () => {
            console.log("Conexión con el ESP32 cerrada.");
        };
 
    } catch (e) {
        console.log("WebSocket no iniciado aún.", e);
    }
}

function actualizarDatos() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send("GET_DATA");
        console.log("Solicitando datos nuevos al ESP32...");
    } else {
        console.log("Socket no conectado. Reintentando conexión...");
        conectarSocket();
    }
}

conectarSocket();