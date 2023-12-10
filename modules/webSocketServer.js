const WebSocket = require("ws");
const { v4: uuidv4 } = require('uuid'); // Importa la libreria UUID per generare id univoci

let keepAliveId;
let wss;


// indica a chi è rivolto il messaggio (partecipanti esperienza, se è per TouchDesigner o al server)
const MessageTarget = {
  PartecipantClient: "partecipant_client",
  TouchDesignerClient: "touch_tesigner_client",
  Server: "server"
}

// rappresenta il tipo di messaggio che può ottenere un Client Partecipante dell'esperienza
const MessageToPartecipantType = {
  ExperienceConfigurator: "experience_configurator", // indica che il messaggio contiene dati per la configurazione dell'esperienza
  ClientIdConfigurator: "client_id_configurator", // indica che il messaggio contiene l'id che client dovrà assumere
  PlayIndexAudioBuffer: "play_index_audio_buffer", // il messaggio indica che il client partecipante deve riprodurre la traccia di un certo index
  PlayIndexGlobalAudioBuffer: "play_index_global_audio_buffer" // il messaggio indica che il client(tutti essendo global) partecipante deve riprodurre la traccia globale di un certo index
}

// rappresenta il tipo di messaggio che può ottenere il Client(unico) TouchDesign
const MessageToTouchDesignerType = {
  ChangedSlider: "changed_slider"
}

// rappresenta il tipo di messaggio che può ottenere il server TouchDesign
const MessageToServerType = {
  ClientReady: "client_ready"
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

        // handle server message
        try {
          handleReceivedServerMessage(stringifiedData, clientId, ws);

        } catch (error) {
          console.error('Errore durante l\'analisi del JSON:', error);
        }
      }

    });

    // on client close
    ws.on("close", (data) => {
      console.log("closing connection");

      // Rimuovi il client dalla lista dei client pronti, se presente
      const index = readyClients.findIndex(client => client.id === clientId);
      if (index !== -1) {
        readyClients.splice(index, 1);
        console.log(`Client ${clientId} removed from ready list`);
        console.log(`Client ready list size: ${readyClients.length}`);
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


// handle messages related to the server
// [receivedData] dati json ricevuti
// [clientId] id client che ha inviato il messaggio
// [ws] web socket del client che ha inviato il messaggio
function handleReceivedServerMessage(stringifiedData, clientId, ws) {
  const receivedData = JSON.parse(stringifiedData);

  if (receivedData.server_message_target === MessageTarget.Server) {


    // messaggio in cui il client dice di essere pronto
    if (receivedData.message_type == MessageToServerType.ClientReady) {
      console.log(`Client ${clientId} is ready`);

      // Verifica se il client è già presente nella lista
      const isClientAlreadyReady = readyClients.some(client => client.id === clientId);

      if (!isClientAlreadyReady) {
        // Aggiungi il client alla lista dei client pronti
        readyClients.push({ id: clientId, ws });
        console.log(`Client ready list size: ${readyClients.length}`);

        // notifica client partecipante del suo id
        sendClientIdConfiguratorToClient(ws, clientId);
      } else {
        console.log(`Client ${clientId} is already in the ready list.`);
      }
    } else {
      console.log(`messaggio server non riconosciuto`);
    }

  } else if (receivedData.server_message_target === MessageTarget.PartecipantClient) {
    // messaggio ricevuto dai client(partecipante o touchdesign)


    // il tipo di messaggio chiede di fare play di una traccia audio su un dispositivo nel readyClients specifico
    if (receivedData.message_type == MessageToPartecipantType.PlayIndexAudioBuffer) {
      if (readyClients.length > 0) {
        const firstClientWs = readyClients[0].ws; // dispositivo specifico

        const data = receivedData.message_data;
        
        serverMessageSender(
          receivedData.server_message_target,
          receivedData.message_type,
          data,
          firstClientWs)
      }

      // qui il tipo di messaggio richiede di fare play su ogni dispositivo in readyClients
    } else if (receivedData.message_type == MessageToPartecipantType.PlayIndexGlobalAudioBuffer) {
      
      if (readyClients.length > 0) {

        const data = receivedData.message_data;

        readyClients.forEach((client) => {
          const clientWs = client.ws;
          
          serverMessageSender(
            receivedData.server_message_target,
            receivedData.message_type,
            data,
            clientWs
          );
        });
      }
    } else {
      broadcast(ws, stringifiedData, false);
    }
    
    console.log(stringifiedData);
  } else if (receivedData.server_message_target === MessageTarget.TouchDesignerClient) {
    broadcast(ws, stringifiedData, false);
  } else {
    
    // other message
    console.log("messaggio ricevuto non supportato: " + stringifiedData);
  }

}


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
    MessageTarget.PartecipantClient,
    MessageToPartecipantType.ExperienceConfigurator,
    data,
    ws
  );
}

/**
 * Sends the json with client id to the client 
 */
let clientTracksConfiguratorUrl = {
  'randomic': [],
  'global': []
};


const setRandomicClientTracksConfiguratorUrl = (configuration) => {
  clientTracksConfiguratorUrl['randomic'] = configuration;
}
const setGlobalClientTracksConfiguratorUrl = (configuration) => {
  clientTracksConfiguratorUrl['global'] = configuration;
}

function sendClientIdConfiguratorToClient(ws, id) {

  const data = {
    experienceConfiguration: clientTracksConfiguratorUrl,
  };
  serverMessageSender(
    MessageTarget.PartecipantClient,
    MessageToPartecipantType.ClientIdConfigurator,
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
function serverMessageSender(MessageTarget, MessageType, data, ws) {
  const serverMessage = {
    server_message_target: MessageTarget,
    message_type: MessageType,
    message_data: data
  };

  // Converte il JSON in una stringa
  const serverMessageString = JSON.stringify(serverMessage);

  ws.send(serverMessageString);
}

module.exports = {
  createWebSocketServer,
  setRandomicClientTracksConfiguratorUrl,
  setGlobalClientTracksConfiguratorUrl
};