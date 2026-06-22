#include <WiFi.h>
#include <WebSocketsServer.h>

const char* ssid     = "Ramon-01";
const char* password = "Akira165";

WebSocketsServer webSocket = WebSocketsServer(81);

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            break;
        case WStype_CONNECTED: {
            webSocket.sendTXT(num, "Conectado al ESP32");
            break;
        }
        case WStype_TEXT:
            if(strcmp((char*)payload, "GET_DATA") == 0) {
                enviar_datos_json();
            }
            break;
    }
}

String obtener_humedad() {
    return String(random(60, 85));
}

String obtener_temperatura() {
    return String(random(5, 20));
}

void enviar_datos_json(){
    String temp = obtener_temperatura();
    String hum = obtener_humedad();
    String jsonString = "{\"temperatura\":\"" + temp + "\",\"humedad\":\"" + hum + "\"}";
    webSocket.broadcastTXT(jsonString);
}

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    
    while(WiFi.status() != WL_CONNECTED) {
        delay(500);
    }
    
    Serial.println(WiFi.localIP()); 

    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
}

void loop() {
    webSocket.loop();
} 
