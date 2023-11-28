const WebSocket = require("ws");
const { v4: uuidv4 } = require('uuid'); // Importa la libreria UUID per generare id univoci

let keepAliveId;
let wss;  

// Dichiarazione della lista dei client pronti a partecipare all'esperienza
const readyClients = [];

const createWebSocketServer = (server) => {
    wss =
      process.env.NODE_ENV === "production"
        ? new WebSocket.Server({ server })
        : new WebSocket.Server({ port: 5001 });
    
    
  wss.on("connection", function (ws, req) {
    // Genera un id univoco per il client appena connesso
    const clientId = uuidv4();
      
    console.log(`Connection Opened for Client ${clientId}`);
    console.log("Client size: ", wss.clients.size);
    

    sendInitialData(ws); // send Json to device
  
    if (wss.clients.size === 1) {
      console.log("first connection. starting keepalive");
      keepServerAlive(wss);
    }

    // on message from client
    ws.on("message", (data) => {
      let stringifiedData = data.toString();
      if (stringifiedData === 'pong') {
        console.log('keepAlive');
        return;
      } else {
        try {
          const receivedData = JSON.parse(stringifiedData);
    
          if (receivedData.type === 'ready') {
            // Il client è pronto, esegui le azioni necessarie
            console.log(`Client ${clientId} is ready`);

            // Aggiungi il client alla lista dei client pronti
            readyClients.push({ id: clientId, ws });
          } else {
            // Altri tipi di messaggi, gestiscili come desideri
            console.log('Messaggio non riconosciuto:', receivedData);
          }
        } catch (error) {
          console.error('Errore durante l\'analisi del JSON:', error);
        }
      }
      broadcast(ws, stringifiedData, false);
    });

    // on client close
    ws.on("close", (data) => {
      console.log("closing connection");
      
      // Rimuovi il client dalla lista dei client pronti, se presente
    const index = readyClients.findIndex(client => client.id === clientId);
    if (index !== -1) {
      readyClients.splice(index, 1);
      console.log(`Client ${clientId} removed from ready list`);
    }

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