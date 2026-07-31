#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// Configurações do Wi-Fi
const char* ssid = "NOME_DO_WIFI";
const char* password = "SENHA_DO_WIFI";

// URL da API real, confirmada no dashboard do Render (servico "irriga-o-servidor")
// ATENÇÃO: este endereço precisa ser IDÊNTICO ao usado em html/index.html (API_URL)
const char* serverUrl = "https://irriga-o-servidor.onrender.com/api/sensor-data";

// Definição exata dos pinos para o ESP-01
const int pinoUmidade = 3; // Usando o pino RX (GPIO 3) como entrada digital
const int pinoChuva = 1; // Usando o pino TX (GPIO 1) como entrada digital
const int pinoRele = 2; // Usando o GPIO 2 para controlar o Relé

void setup() {
  // ATENÇÃO: Desativamos o Serial Monitor padrão porque os pinos TX/RX
  // estão sendo usados pelos sensores físicos.
  Serial.begin(115200);
  Serial.end();

  pinMode(pinoUmidade, INPUT);
  pinMode(pinoChuva, INPUT);
  pinMode(pinoRele, OUTPUT);
  digitalWrite(pinoRele, LOW); // Inicia com a bomba desligada

  // Conecta ao Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void loop() {
  // Leituras digitais (0 = Ativado/Detectado, 1 = Desativado/Seco na maioria dos sensores)
  int soloSeco = digitalRead(pinoUmidade);
  int temChuva = digitalRead(pinoChuva);
  bool bombaStatus = false;

  // Lógica de Automação Local baseada em estados digitais
  // Se o solo estiver seco (1) E não estiver chovendo (1)
  if (soloSeco == 1 && temChuva == 1) {
    digitalWrite(pinoRele, HIGH); // Liga a bomba
    bombaStatus = true;
  }
  // Se o solo já molhou (0) OU se começou a chover (0)
  else if (soloSeco == 0 || temChuva == 0) {
    digitalWrite(pinoRele, LOW); // Desliga a bomba imediatamente
    bombaStatus = false;
  }

  // Envia os dados para a API se houver conexão
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Permite conectar ao HTTPS do Render sem carregar certificados pesados

    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Como a leitura é digital (0 ou 1), convertemos para texto amigável para o App
    String soloStatusTexto = (soloSeco == 1) ? "Seco" : "Umido";

    // NUMERO DE UMIDADE (0-100%) PARA O PAINEL
    // O ESP-01 nao tem pino analogico (A0) disponivel nos seus 4 GPIOs,
    // entao nao da pra fazer uma leitura analogica real de 0-100%.
    // Por enquanto mapeamos o estado digital para um numero representativo,
    // usando a mesma convencao ja adotada no servidor (30% seco / 75% umido).
    int umidadeNumero = (soloSeco == 1) ? 30 : 75;

    // -- Se um dia trocar para uma placa com pino analogico (ex: NodeMCU/Wemos D1 mini),
    //    troque as linhas acima por uma leitura analogica real, por exemplo:
    //    int leituraAnalogica = analogRead(A0);           // 0 a 1023
    //    int umidadeNumero = map(leituraAnalogica, 1023, 0, 0, 100); // ajuste os limites calibrando no solo seco/molhado

    // Monta o JSON perfeitamente para o servidor Node.js ler
    String jsonPayload = "{\"umidadeStatus\":\"" + soloStatusTexto + "\"" + ",\"umidade\":" + String(umidadeNumero) + ",\"chuva\":" + (temChuva == 0 ? "true" : "false") + ",\"bombaStatus\":" + (bombaStatus ? "true" : "false") + "}";

    int httpResponseCode = http.POST(jsonPayload);
    http.end();
  }
  delay(30000); // Aguarda 30 segundos para a próxima checagem
}
