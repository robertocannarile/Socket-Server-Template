const WebSocket = require("ws");
const { v4: uuidv4 } = require('uuid'); // Importa la libreria UUID per generare id univoci

let keepAliveId;
let wss;  


// indica a quali client è rivolto il messaggio (partecipanti esperienza o se è per TouchDesigner)
const ServerMessageTarget = {
  PartecipantClient: partecipant_client,
  TouchDesignerClient: touch_tesigner_client
}

// rappresenta il tipo di messaggio che può ottenere un Client Partecipante dell'esperienza
const ServerMessagePartecipantType = {
	ExperienceConfigurator: experience_configurator, // indica che il messaggio contiene dati per la configurazione dell'esperienza
  ClientIdConfigurator: clientIdconfigurator, // indica che il messaggio contiene l'id che client dovrà assumere
}

// rappresenta il tipo di messaggio che può ottenere il Client(unico) TouchDesign
const ServerMessageTouchDesignerType = {

}

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
            // notifica client partecipante del suo id
            sendClientIdConfiguratorToClient(ws, clientId);
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
  // Costruzione del json con i dati per configurare
  // l'esperienza sui client partecipanti
  const data = {
    track: "Nome della traccia",
    artist: "Nome dell'artista",
  };

  // Invia il JSON della configurazione dell'esperienza
  // al dispositivo appena connesso
  serverMessageSender(
    ServerMessageTarget.PartecipantClient,
    ServerMessagePartecipantType.ExperienceConfigurator,
    data,
    ws
  );
}

/**
 * Sends the json with client id to the client 
 */
function sendClientIdConfiguratorToClient(ws, id) {

    const data = {
      clientId: id,
    };
    serverMessageSender(
      ServerMessageTarget.PartecipantClient,
      ServerMessagePartecipantType.ClientIdConfigurator,
      data,
      ws
    );

}


/*
  [ServerMessageTarget] indica il tipo di client che 
  deve ricevere il messaggio (PartecipantClient o TouchDesignerClient)

  [MessageType] indica il tipo di messaggio. Questo serve
  al client per interpretare il contenuto

  [data] contiene il json dei dati da inviare

  [ws] web socket del dispositivo a cui inviare il server message
*/
function serverMessageSender(ServerMessageTarget, MessageType, data, ws) {
  const serverMessage = {
    server_message_target: ServerMessageTarget,
    message_type: MessageType,
    message_data: data
  };

  // Converte il JSON in una stringa
  const serverMessageString = JSON.stringify(serverMessage);

  ws.send(serverMessage);
}

module.exports = createWebSocketServer;