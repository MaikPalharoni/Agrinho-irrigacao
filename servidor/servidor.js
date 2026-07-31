const express = require('express');
const cors = require('cors');
const app = express();

// O Render define a porta automaticamente através da variável de ambiente process.env.PORT.
const PORT = process.env.PORT || 3000;

// Permite que o app/Figma acesse a API sem bloqueios de segurança
app.use(cors());
app.use(express.json());

// 1. Objeto que guarda o status mais recente enviado pelo ESP-01
let dadosLavouraAtual = {
  umidadeStatus: "Seco",       // Valor inicial padrão
  bombaStatus: false,          // Valor inicial padrão
  chuva: false,                // Valor inicial padrão
  umidade: 42,                 // Valor numérico padrão (0 a 100)
  temperatura: 28,             // Grau Celsius padrão (opcional)
  vento: 12,                   // km/h padrão (opcional)
  ultimaAtualizacao: "Aguardando conexão..."
};

// 2. Array que armazena o histórico das últimas leituras para alimentar o gráfico
let historicoLeituras = [];

// ==========================================
// ROTAS DA API
// ==========================================

// ROTA RAIZ: Conferir no navegador se o servidor subiu com sucesso
app.get('/', (req, res) => {
  return res.status(200).send("Servidor do Agrinho Rodando com Sucesso!");
});

// NOVA ROTA: Rota de status integrada com as variáveis do sistema
app.get('/status', (req, res) => {
  return res.status(200).json({
    umidadeStatus: dadosLavouraAtual.umidadeStatus,
    bombaStatus: dadosLavouraAtual.bombaStatus,
    chuva: dadosLavouraAtual.chuva,
    umidade: dadosLavouraAtual.umidade,
    temperatura: dadosLavouraAtual.temperatura,
    vento: dadosLavouraAtual.vento
  });
});

// ROTA 1: O ESP-01 chama essa rota via POST para enviar os dados do campo
app.post('/api/sensor-data', (req, res) => {
  const umidadeStatus = req.body.umidadeStatus;
  const chuva = req.body.chuva;
  const bombaStatus = req.body.bombaStatus;
  
  // Captura dados numéricos se o ESP-01 enviar, senão mantém o padrão anterior
  const umidade = req.body.umidade !== undefined ? req.body.umidade : dadosLavouraAtual.umidade;
  const temperatura = req.body.temperatura !== undefined ? req.body.temperatura : dadosLavouraAtual.temperatura;
  const vento = req.body.vento !== undefined ? req.body.vento : dadosLavouraAtual.vento;
  
  const horarioAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Atualiza o estado atual do sistema dinamicamente
  dadosLavouraAtual = {
    umidadeStatus: umidadeStatus, // "Seco" ou "Umido"
    chuva: chuva,                 // true ou false
    bombaStatus: bombaStatus,     // true ou false
    umidade: umidade,             // número enviado pelo ESP
    temperatura: temperatura,     // número enviado pelo ESP
    vento: vento,                 // número enviado pelo ESP
    ultimaAtualizacao: horarioAtual
  };

  // Salva no histórico (guarda no máximo as últimas 20 leituras)
  historicoLeituras.push({
    hora: horarioAtual,
    // Usa a porcentagem real se disponível, senão usa o valor fictício baseado no texto
    umidadeGrafico: req.body.umidade !== undefined ? req.body.umidade : (umidadeStatus === "Umido" ? 75 : 30)
  });

  if (historicoLeituras.length > 20) {
    historicoLeituras.shift(); // Remove o registro mais antigo
  }

  console.log("=== Dados Recebidos do ESP-01 ===");
  console.log(dadosLavouraAtual);
 
  return res.status(200).json({ message: "Dados processados e salvos com sucesso!" });
});

// ROTA 2: O Aplicativo chama essa rota via GET para atualizar os cards principais da tela
app.get('/api/status-atual', (req, res) => {
  return res.status(200).json(dadosLavouraAtual);
});

// ROTA 3: O Aplicativo chama essa rota via GET para desenhar o gráfico de linha histórico
app.get('/api/historico', (req, res) => {
  return res.status(200).json(historicoLeituras);
});

// Inicializa o servidor na porta configurada dinamicamente
app.listen(PORT, () => {
  console.log(` Servidor IoT do Agrinho rodando com sucesso na porta ${PORT}`);
  console.log(`Aguardando conexões do ESP-01...`);
});
