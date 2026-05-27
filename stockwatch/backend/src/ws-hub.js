const { WebSocketServer } = require('ws');

function createWsHub({ server, path, quoteService, pollMs }) {
  const wss = new WebSocketServer({ server, path });

  function sendJson(ws, payload) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  function broadcast(payload) {
    const data = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    });
  }

  wss.on('connection', (ws) => {
    sendJson(ws, {
      type: 'hello',
      message: 'Quote WebSocket connected',
      pollMs,
    });

    sendJson(ws, {
      type: 'snapshot',
      data: quoteService.getCachedSnapshot(),
      ts: Date.now(),
    });

    ws.on('message', (raw) => {
      if (String(raw) === 'ping') {
        sendJson(ws, { type: 'pong', ts: Date.now() });
      }
    });
  });

  return { wss, broadcast };
}

module.exports = {
  createWsHub,
};
