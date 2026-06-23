// Para guardar datos
let database = {
    sensor_name: "temperatura_y_humedad",
    records: []
};

const max_puntos_grafica = 50;
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
function agregarPunto(timestamp, temperatura, humedad) {
    
    tempChart.data.labels.push(timestamp);
    tempChart.data.datasets[0].data.push(temperatura);

    humChart.data.labels.push(timestamp);
    humChart.data.datasets[0].data.push(humedad);

    if (tempChart.data.labels.length > max_puntos_grafica) {
        tempChart.data.labels.shift();
        tempChart.data.datasets[0].data.shift();
        humChart.data.datasets[0].data.shift();
    }

    tempChart.update('none');
    humChart.update('none');
}

function actualizarStats() {
    if (database.records.length === 0) return;

    const arrayTemp = database.records.map(r => r.temperatura).filter(v => v!== undefined);
    const arrayHum = database.records.map(r => r.humedad).filter(v => v !== undefined);

    if (arrayTemp.length > 0) {
        const sumTemp = arrayTemp.reduce((a, b) => a + b , 0);
        document.getElementById('temp-max').innerText = Math.max(...arrayTemp).toFixed(2);
        document.getElementById('temp-min').innerText = Math.min(...arrayTemp).toFixed(2);
        document.getElementById('temp-prom').innerText = (sumTemp / arrayTemp.length).toFixed(2);
    }

    if (arrayHum.length > 0) {
        const sumHum = arrayHum.reduce((a, b) => a + b , 0);
        document.getElementById('hum-max').innerText = Math.max(...arrayHum).toFixed(2);
        document.getElementById('hum-min').innerText = Math.min(...arrayHum).toFixed(2);
        document.getElementById('hum-prom').innerText = (sumHum / arrayHum.length).toFixed(2);
    }
}

function limpiarTodo() {
    if (confirm("¿Estás seguro de que deseas vaciar la base de datos actual?")) {
        database.records = [];
        
        tempChart.data.labels = [];
        tempChart.data.datasets[0].data = [];
        humChart.data.labels = [];
        humChart.data.datasets[0].data = [];
        tempChart.update();
        humChart.update();

        const indicadores = ['temp-max', 'temp-min', 'temp-prom', 'hum-max', 'hum-min', 'hum-prom'];
        indicadores.forEach(id => document.getElementById(id).innerText = "--");
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
            actualizarDatos();
        };
 
        socket.onmessage = (event) => {
            try {
                const dataJson = JSON.parse(event.data);
                const ahora = new Date();
                const timestamp = ahora.toLocaleDateString() + ' ' + ahora.toLocaleDateString();

                if (dataJson.temperatura !== undefined && dataJson.humedad !== undefined) {
                    const temp = parseFloat(dataJson.temperatura);
                    const hum = parseFloat(dataJson.humedad);

                    database.records.push({
                        timestamp: timestamp,
                        temperatura: temp,
                        humedad: hum
                        });
                    agregarPunto(timestamp, temp, hum);
                    actualizarStats();
                    }
                } catch(jsonErr) {
                    console.error("Error de parse del JSON recibido: ", jsonErr);
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
        console.log("Solicitando datos nuevos al ESP32.");
    } else {
        console.log("Socket no conectado. Reintentando conexion.");
        conectarSocket();
    }
}

conectarSocket();

setInterval(actualizarDatos, 30000);