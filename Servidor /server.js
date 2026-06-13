// Este código roda no aplicativo e conecta ele ao nosso servidor do Render
async function conectarAppAoServidor() {
  try {
    // O App faz um pedido 'GET' direcionado à rota de status atual da nossa API no Render
    const resposta = await fetch('https://irriga-o-servidor-2.onrender.com');
    const dadosCampo = await resposta.json(); // Recebe o JSON do servidor

    // Injeta os dados recebidos direto nos componentes visuais do aplicativo
    document.getElementById('status-solo').innerText = dadosCampo.umidadeStatus; // "Seco" ou "Úmido"
    document.getElementById('status-bomba').innerText = dadosCampo.bombaStatus ? "Ligada" : "Desligada";
    document.getElementById('status-chuva').innerText = dadosCampo.chuva ? "Chovendo" : "Sem Chuva";

  } catch (erro) {
    console.error("Erro ao puxar dados do Render para o App:", erro);
  }
}

// Faz o aplicativo atualizar os dados na tela sozinho a cada 5 segundos
setInterval(conectarAppAoServidor, 5000);
