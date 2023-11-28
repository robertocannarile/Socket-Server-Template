const WebSocket = require("ws");
let keepAliveId;
let wss;  

const createWebSocketServer = (server) => {
    wss =
      process.env.NODE_ENV === "production"
        ? new WebSocket.Server({ server })
        : new WebSocket.Server({ port: 5001 });
    
    
  wss.on("connection", function (ws, req) {

    console.log("Connection Opened");
    console.log("Client size: ", wss.clients.size);
    

    sendInitialData(ws); // send Json to device
  
    if (wss.clients.size === 1) {
      console.log("first connection. starting keepalive");
      keepServerAlive(wss);
    }

    ws.on("message", (data) => {
      let stringifiedData = data.toString();
      if (stringifiedData === 'pong') {
        console.log('keepAlive');
        return;
      }
      broadcast(ws, stringifiedData, false);
    });

    ws.on("close", (data) => {
      console.log("closing connection");

      if (wss.clients.size === 0) {
        console.log("last client disconnected, stopping keepAlive interval");
        clearInterval(keepAliveId);
      }
    });
  });

  return wss;
};
  
  // Implement broadcast function because of ws doesn't have it
  const broadcast = (ws, message, includeSelf) => {
    if (includeSelf) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            }
        });
    } else {
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
            }
        });
    }
  };
  
  /**
   * Sends a ping message to all connected clients every 50 seconds
   */
  const keepServerAlive = (wss) => {
    keepAliveId = setInterval(() => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('ping');
        }
      });
    }, 50000);
  };
  
  /**
   * Sends the json with experience initial data 
   */
  function sendInitialData(ws) {
    // Costruisci il JSON con i dati da inviare a tutti i dispositivi
    const initialData = {
      track: "Nome della traccia",
      artist: "Nome dell'artista",
      // Altri dati...
    };
  
    // Converte il JSON in una stringa
    const initialDataString = JSON.stringify(initialData);
  
    // Invia il JSON al dispositivo appena connesso
    ws.send(initialDataString);
  }

  module.exports = createWebSocketServer;