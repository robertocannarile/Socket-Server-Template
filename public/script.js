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

  const ws = new WebSocket('wss://smart-perf-7d930c61dbd0.herokuapp.com:443');
  let clientUniqueId = null;

  // array dei buffer audio
  const audioBuffers = [];
  const globalAudioBuffers = [];

  let audioContext;

  let audioSource;
  let globalAudioSource;
  let currentAudioSource = null;
  let currentGlobalAudioSource = null;

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
    ws.send(clientMessageString);
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

          } else if (receivedData.message_type == MessageToPartecipantType.PlayIndexAudioBuffer) {
            console.log("indext track to play: " + receivedData.message_data.track_index);
            playIndexTrackMP3(audioBuffers, receivedData.message_data.track_index)

          } else if (receivedData.message_type == MessageToPartecipantType.PlayIndexGlobalAudioBuffer) {
            console.log("global indext track to play: " + receivedData.message_data.track_index);
            playGlobalIndexTrackMP3(globalAudioBuffers, receivedData.message_data.track_index)

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
  
  
  // questo metodo permette di dare il consenso all'utente di scaricare le
  // tracce audio per dell'intera esperienza e di preparare gli audio source
  // su cui riprodurre le tracce(global track o playIndexTrackMP3)
  // questa procedura permette l'auto riproduzione delle 
  // tracce(rispetto ai messaggi ricevuti dal server) senza
  // che il browser le blocchi
  async function allowAudioContextAndDownloadAudioBuffers() {
    allowMediaContentButtonAndDownload.disabled = true;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    /// DEBUG ///
    try {
      // download di tutte tracce audio contenute nel json
      // link delle tracce devono arrivare dal messaggio json
      const audioBuffer1 = await downloadMP3('https://smart-perf-7d930c61dbd0.herokuapp.com/mp3?url=https://www.stefanoromanelli.it/remoteAssets/sample.mp3');
      audioBuffers.push(audioBuffer1);

      const audioBuffer2 = await downloadMP3('https://smart-perf-7d930c61dbd0.herokuapp.com/mp3?url=https://www.stefanoromanelli.it/remoteAssets/NeverGonnaGiveYouUp.mp3');
      audioBuffers.push(audioBuffer2);


      // queste sono le tracce globali(quelle che vengono riprodotte da tutti i dispositivi)
      const globalaudioBuffer1 = await downloadMP3('https://smart-perf-7d930c61dbd0.herokuapp.com/mp3?url=https://www.stefanoromanelli.it/remoteAssets/NeverGonnaGiveYouUp.mp3');
      globalAudioBuffers.push(globalaudioBuffer1);


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
  function playIndexTrackMP3(audioBuffers, index) {
    try {

      if (currentAudioSource) {
        currentAudioSource.stop();
      }
      // Crea un buffer source node
      audioSource = audioContext.createBufferSource();

      // Collega il buffer al buffer source
      audioSource.buffer = audioBuffers[index];

      // Collega il buffer source al contesto audio
      audioSource.connect(audioContext.destination);

      // Riproduci il suono
      audioSource.start();

      currentAudioSource  = audioSource;

      mp3LabelStatus.textContent = "track: " + 'playing';

    } catch (error) {
      console.error('Error while playing the MP3 file:', error);
      mp3LabelStatus.textContent = "track error: " + error;
    }
  }

  // play an(global) audio buffer from audioBuffers by index
  function playGlobalIndexTrackMP3(globalAudioBuffers, index) {
    try {

      if (currentAudioSource) {
        currentGlobalAudioSource.stop();
      }
      // Crea un buffer source node
      globalAudioSource = audioContext.createBufferSource();

      // Collega il buffer al buffer source
      globalAudioSource.buffer = audioBuffers[index];

      // Collega il buffer source al contesto audio
      globalAudioSource.connect(audioContext.destination);

      // Riproduci il suono
      globalAudioSource.start();

      currentGlobalAudioSource  = globalAudioSource;

      mp3LabelStatus.textContent = "track: " + 'playing';

    } catch (error) {
      console.error('Error while playing the MP3 file:', error);
      mp3LabelStatus.textContent = "track error: " + error;
    }
  }

});
