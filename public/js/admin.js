let socket;

function handleSocketOpen() {
  console.log('Websocket conectado.');
  socket.send(
    JSON.stringify({
      action: ACTIONS.ADMIN,
    })
  );
}

const drawButton = document.getElementById('draw');
const messageDiv = document.getElementById('message');

function displayConfirmationCode(code) {
  messageDiv.innerText = code;
  messageDiv.classList.remove('hide-message');
  messageDiv.classList.add('show-message');
  messageDiv.innerText = `${code} foi sorteado!`;
}

function generateCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

function handleDrawClick() {
  const confirmationCode = generateCode(4);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        action: ACTIONS.DRAW,
        code: confirmationCode,
      })
    );
    displayConfirmationCode(confirmationCode);
  } else {
    console.warn(
      'Websocket não está mais aberto. Aguarde e tente novamenete  em instantes'
    );
  }
}

function updateClientCount(count) {
  document.getElementById('clientCount').innerText = count;
}

function handleSocketMessage(event) {
  const data = JSON.parse(event.data);

  if (data.action === ACTIONS.CLIENT_COUNT_UPDATE) {
    updateClientCount(data.count);
  }
}

function handleSocketError(error) {
  console.error('Erro no Websocket:', error);
}

function connectWebSocket() {
  socket = new WebSocket(WS_URL);

  socket.addEventListener('open', handleSocketOpen);
  socket.addEventListener('message', handleSocketMessage);
  socket.addEventListener('error', handleSocketError);
  socket.addEventListener('close', handleSocketClose);
}

function handleSocketClose() {
  console.log('Websocket fechado. Tentando reconectar em 5 segundos...');
  setTimeout(connectWebSocket(), 5000);
}

connectWebSocket();

drawButton.addEventListener('click', handleDrawClick);
