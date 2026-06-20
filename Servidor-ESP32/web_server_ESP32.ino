#include <WiFi.h>
#include <WebSocketsServer.h>

const char* ssid     = NULL;
const char* password = NULL;

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
                String data = "{\"sensor_id\":1,\"value\":" + obtener_datos() + "}";
                webSocket.sendTXT(num, data);
            }
            break;
    }
}

String obtener_datos() {
    return String(random(100, 200));
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
    
    static unsigned long lastMsg = 0;
    if(millis() - lastMsg > 2000) {
        lastMsg = millis();
        String broadCastData = "{\"telemetry\":" + String(random(100, 200)) + "}";
        webSocket.broadcastTXT(broadCastData);
    }
} 
