document.addEventListener('DOMContentLoaded', function () {

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
    PlayIndexAudioSource: "play_index_audio_source" // il messaggio indica che il client partecipante deve riprodurre la traccia di un certo index
  }

  // rappresenta il tipo di messaggio che può ottenere il Client(unico) TouchDesign
  const MessageToTouchDesignerType = {
    ChangedSlider: "changed_slider"
  }
  // rappresenta il tipo di messaggio che può ottenere il server TouchDesign
  const MessageToServerType = {
    ClientReady: "client_ready"
  }

  const ws = new WebSocket('wss://smart-perf-7d930c61dbd0.herokuapp.com:443');
  let clientUniqueId = null;

  // array dei buffer audio
  const audioBuffers = [];
  let audioContext;

  //////////////// HTML INPUT EVENTS ////////////////////////

  let controlTD = document.querySelector('.controlTD');
  let controlTD2 = document.querySelector('.controlTD2');

  let allowMediaContentButtonAndDownload = document.querySelector('.allowAudioSourceAndDownload');
  
  // debug input
  //let debugReadyButton = document.querySelector('.debugReadyButton');


  //Slider 1, Ogni volta che cambio un valore allo slider, invia la modifica
  controlTD.addEventListener('input', (event) => {
    console.log(controlTD.value);
    sliderChanged();
  });
  //Slider 2, Ogni volta che cambio un valore allo slider, invia la modifica
  controlTD2.addEventListener('input', (event) => {
    console.log(controlTD2.value);
    sliderChanged();
  });

  
  // debug ready
  /*debugReadyButton.addEventListener('click', function () {
  });*/

  allowMediaContentButtonAndDownload.addEventListener('click', function () {

    allowAudioContextAndDownloadAudioBuffers();
  });









  //////////////// HTML OUTPUT EVENTS ////////////////////////


  const clienIdLabel = document.getElementById('labelIdVisualization');
  const mp3LabelStatus = document.getElementById('mp3DownloadStatus');















  //////////////// WEB SOCKET EVENTS ////////////////////////

  // evento quando il client riceve un messaggio
  ws.addEventListener("message", (event) => {

    handleServerMessage(event.data);
  });

  // evento errore connessione
  ws.addEventListener("error", (error) => {
    window.alert('websocket closed');
    console.log('websocket closed');
  });

  // evento chiusura connessione
  ws.addEventListener("close", (event) => {
    window.alert('websocket closed');
    console.log('websocket closed');
  });


  //////////////// CLIENT DATA SENDER FUNCTION ////////////////////////
  function sliderChanged() {

    const data = {
      'slider1': controlTD.value,
      'slider2': controlTD2.value
    }

    clientMessageSender(
      MessageTarget.TouchDesignerClient,
      MessageToTouchDesignerType.ChangedSlider,
      data
    );
  }

  // Send a notification to server of the ready status of the client
  function sendReadyToServer() {
  
    const data = {
      client_ready: true,
    };
    
    clientMessageSender(
      MessageTarget.Server,
      MessageToServerType.ClientReady,
      data
    );
  }


  function clientMessageSender(MessageTarget, MessageType, data) {

    const clientMessage = {
      server_message_target: MessageTarget,
      message_type: MessageType,
      message_data: data
    };
  
    const clientMessageString = JSON.stringify(clientMessage);
    ws.send(audioBuffers, clientMessageString);
  }
  


  //////////////// HANDLE SERVER MESSAGES ////////////////////////

  // gestisci il messaggio ricevuto dal server
  function handleServerMessage(data) {

    // Verifica se il messaggio non è JSON (ad esempio, "ping" serve a tenere il server attivo)
    if (data === 'ping') {
      console.log('Ricevuto messaggio ping');
      return;
    } else {

      // gestici tipo messaggio ricevuto dal server
      try {
        const receivedData = JSON.parse(data);
        console.log(receivedData);


        // verifica se il contenuto del messaggio è di interesse per il client partecipante
        if (receivedData.server_message_target == MessageTarget.PartecipantClient) {

          // messaggio di tipo configurazione dell'esperienza
          if (receivedData.message_type == MessageToPartecipantType.ExperienceConfigurator) {

            // configura esperienza 
            configureExperience(receivedData.message_data);

          } else if (receivedData.message_type == MessageToPartecipantType.ClientIdConfigurator) {

            // configura id client
            configureClientId(receivedData.message_data);
          } else if (receivedData.message_type == MessageToPartecipantType.PlayIndexAudioSource) {
            
            
            //console.log("indext to play: " + receivedData.message_data.track_index);
            playMP3(receivedData.message_data.track_index)
          }

        }



      } catch (error) {
        console.error('Errore durante l\'analisi del JSON:', error);
      }
    }
  }

  //////////////// CLIENT FUNCTION ////////////////////////
  function configureExperience(data) {
    // dati ricevuti
    if (data.track) {
      console.log(`Nome della traccia: ${data.track}`);
    }
    if (data.artist) {
      console.log(`Nome dell'artista: ${data.artist}`);
    }

  }
  function configureClientId(data) {
    // dati ricevuti
    clientUniqueId = data.clientId;

    // Aggiorna il contenuto della label
    clienIdLabel.textContent = "id: " + clientUniqueId;
  }

  async function allowAudioContextAndDownloadAudioBuffers() {

    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    /// DEBUG ///
    try {
      // download delle tracce audio contenute nel json
      // per adesso sto usando un link statico ma i
      // link delle tracce devono arrivare dal messaggio json
      const audioBuffer = await downloadMP3('https://smart-perf-7d930c61dbd0.herokuapp.com/mp3?url=https://www.stefanoromanelli.it/remoteAssets/sample.mp3');
      audioBuffers.push(audioBuffer);

      const audioBuffer2 = await downloadMP3('https://smart-perf-7d930c61dbd0.herokuapp.com/mp3?url=https://www.stefanoromanelli.it/remoteAssets/NeverGonnaGiveYouUp.mp3');
      audioBuffers.push(audioBuffer2);


      // Aggiorna lo stato notificando che tutti
      // i media dell'esperienza sono stati scaricati
      mp3LabelStatus.textContent = "track: " + 'done, ready to play mp3';
      sendReadyToServer();

    } catch (error) {
      console.error('Error while downloading and decoding the MP3 file:', error);
      mp3LabelStatus.textContent = "track error: " + error;
    }
  }


  // Funzione scarica e restituisce il buffer MP3  
  async function downloadMP3(mp3Url) {
    try {
      mp3LabelStatus.textContent = "track: " + 'downloading';

      // Effettua una richiesta per ottenere il file MP3
      const response = await fetch(mp3Url);

      // Ottieni i dati audio come array di byte
      const audioData = await response.arrayBuffer();

      // Decodifica i dati audio
      const audioBuffer = await audioContext.decodeAudioData(audioData);

      // Restituisci il buffer audio decodificato
      return audioBuffer;
    } catch (error) {
      console.error('Error while downloading the MP3 file:', error);
      mp3LabelStatus.textContent = "track error: " + error;
      throw error; // Puoi scegliere di gestire l'errore in modo diverso se necessario
    }
  }

  

  // play an audio buffer from audioBuffers by index
  function playMP3(audioBuffers, index) {
    try {


      // Crea un buffer source node
      audioSource = audioContext.createBufferSource();

      // Collega il buffer al buffer source
      source.buffer = audioBuffers[index];

      // Collega il buffer source al contesto audio
      source.connect(audioContext.destination);

      // Riproduci il suono
      source.start();


      mp3LabelStatus.textContent = "track: " + 'playing';

    } catch (error) {
      console.error('Error while playing the MP3 file:', error);
      mp3LabelStatus.textContent = "track error: " + error;
    }
  }

});
