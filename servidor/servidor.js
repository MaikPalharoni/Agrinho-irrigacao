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
  umidadeStatus: "Sem dados", // Receberá "Seco" ou "Umido"
  chuva: false,
  bombaStatus: false,
  ultimaAtualizacao: "Aguardando conexão..."
};

// 2. Array que armazena o histórico das últimas leituras para alimentar o gráfico
let historicoLeituras = [];

// ==========================================
// ROTAS DA API
// ==========================================

// ROTA EXTRA: Rota raiz para conferir no navegador se o servidor subiu com sucesso
app.get('/', (req, res) => {
  return res.status(200).send("Servidor do Agrinho Rodando com Sucesso!");
});

// ROTA 1: O ESP-01 chama essa rota via POST para enviar os dados do campo
app.post('/api/sensor-data', (req, res) => {
  const umidadeStatus = req.body.umidadeStatus;
  const chuva = req.body.chuva;
  const bombaStatus = req.body.bombaStatus;
  const horarioAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Atualiza o estado atual do sistema
  dadosLavouraAtual = {
    umidadeStatus: umidadeStatus, // "Seco" ou "Umido"
    chuva: chuva, // true ou false
    bombaStatus: bombaStatus, // true ou false
    ultimaAtualizacao: horarioAtual
  };

  // Salva no histórico (guarda no máximo as últimas 20 leituras para não lotar a memória)
  historicoLeituras.push({
    hora: horarioAtual,
    // Converte o status de texto em um número fictício para o gráfico do app conseguir desenhar a linha
    umidadeGrafico: umidadeStatus === "Umido" ? 75 : 30
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
