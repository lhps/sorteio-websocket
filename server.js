const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

const APP_PORT = process.env.PORT || 3000;
const APP_URL = process.env.URL || `http://172.20.0.186:${APP_PORT}`;

const ACTIONS = {
  ADMIN: 'admin',
  DRAW: 'draw',
  CLIENT_COUNT_UPDATE: 'clientCountUpdate',
};

app.use('/public', express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/public/index.html`);
});
app.get('/admin', (req, res) => {
  res.sendFile(`${__dirname}/public/admin.html`);
});

const httpServer = server.listen(APP_PORT, () =>
  console.log(`Servidor na localhost ouvindo a porta ${APP_PORT}!`)
);

const wss = new WebSocket.Server({ server: httpServer });

let clientsConnected = [];

function updateAdminClientCount() {
  const clientCount = Array.from(wss.clients).filter(
    (client) => !client?.isAdmin
  ).length;

  Array.from(wss.clients).forEach((client) => {
    if (client.isAdmin && client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          action: ACTIONS.CLIENT_COUNT_UPDATE,
          count: clientCount,
        })
      );
    }
  });
}

function handleDraw(confirmationCode) {
  const participants = Array.from(wss.clients).filter(
    (client) => !client.isAdmin
  );

  const winner = participants[Math.floor(Math.random() * participants.length)];

  participants.forEach((client) => {
    let result = JSON.stringify({
      status: 'youlose',
    });

    if (client === winner) {
      result = JSON.stringify({
        status: 'youwin',
        code: confirmationCode,
      });
    }

    client.send(result);
  });
}

function handleIncomingMessage(ws, msg) {
  const data = JSON.parse(msg);
  const { action } = data;

  switch (action) {
    case ACTIONS.ADMIN:
      ws.isAdmin = true;
      break;
    case ACTIONS.DRAW:
      handleDraw(data.code);
      break;
    default:
      console.warn('Ação desconhecida: ', action);
  }
}

wss.on('connection', (ws) => {
  clientsConnected.push(ws);
  updateAdminClientCount();

  ws.on('close', () => {
    clientsConnected = clientsConnected.filter((client) => client !== ws);
    updateAdminClientCount();
  });

  ws.on('message', handleIncomingMessage.bind(null, ws));
});
