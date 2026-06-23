#include <WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "Ramon-01";
const char* password = "Akira165";

WebSocketsServer webSocket = WebSocketsServer(81);

void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[SOCKET] Desconexion. Cliente [%d] se ha desconectado.\n", num);
      break;

    case WStype_CONNECTED:
      {
        IPAddress ip = webSocket.remoteIP(num);
        Serial.println("---------------------------------------------------------");
        Serial.printf("[SOCKET] Handshake HTTP completado con éxito.\n");
        Serial.printf("[SOCKET] Protocolo cambiado de HTTP a WebSocket de forma permanente.\n");
        Serial.printf("[SOCKET] Cliente asignado ID: [%d] desde la IP: %d.%d.%d.%d\n",
                      num, ip[0], ip[1], ip[2], ip[3]);
        Serial.println("---------------------------------------------------------");
        break;
      }

    case WStype_TEXT:
      Serial.printf("[SOCKET] Datos Recibidos de cliente [%d]. Longitud: %d bytes\n", num, length);
      Serial.printf("[SOCKET] Contenido del paquete recibido: \"%s\"\n", (char*)payload);

      if (strcmp((char*)payload, "GET_DATA") == 0) {
        Serial.printf("[LOG] El cliente [%d] solicito actualizacion de variables.\n", num);
        enviar_datos_json(num);
      } else {
        Serial.printf("[WARN] Comando desconocido de cliente [%d]: \"%s\"\n", num, (char*)payload);
      }
      break;

    case WStype_BIN:
      Serial.printf("[SOCKET] Datos Binarios recibidos de cliente [%d]. Longitud: %d\n", num, length);
      break;

    case WStype_ERROR:
      Serial.printf("[ERROR] Ocurrió un error en la conexion con el cliente [%d]\n", num);
      break;

    default:
      break;
  }
}

String obtener_humedad() {
  return String(random(60, 85));
}

String obtener_temperatura() {
  return String(random(5, 20));
}

void enviar_datos_json(uint8_t num) {
  String temp = obtener_temperatura();
  String hum = obtener_humedad();
  String jsonString = "{\"temperatura\":\"" + temp + "\",\"humedad\":\"" + hum + "\"}";
  webSocket.sendTXT(num, jsonString);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  Serial.println(WiFi.localIP());

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
}
