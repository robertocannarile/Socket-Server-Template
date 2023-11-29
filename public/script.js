document.addEventListener('DOMContentLoaded', function () {
  
  // indica a quali client è rivolto il messaggio (partecipanti esperienza o se è per TouchDesigner)
  const ServerMessageTarget = {
    PartecipantClient: "partecipant_client",
    TouchDesignerClient: "touch_tesigner_client"
  }

  // rappresenta il tipo di messaggio che può ottenere un Client Partecipante dell'esperienza
  const ServerMessagePartecipantType = {
    ExperienceConfigurator: "experience_configurator", // indica che il messaggio contiene dati per la configurazione dell'esperienza
    ClientIdConfigurator: "clientIdconfigurator", // indica che il messaggio contiene l'id che client dovrà assumere
  }
  
  const ws = new WebSocket('wss://smart-perf-7d930c61dbd0.herokuapp.com:443');
  let clientUniqueId = null;



  //////////////// HTML INPUT EVENTS ////////////////////////

  let controlTD = document.querySelector('.controlTD');
  let controlTD2 = document.querySelector('.controlTD2');
  // Seleziona il tuo bottone utilizzando una classe o un ID appropriato
  let debugReadyButton = document.querySelector('.debugReadyButton');

  
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

  // Aggiungi un gestore di eventi al clic del bottone
  debugReadyButton.addEventListener('click', function () {
    // Esegui la logica desiderata quando il bottone viene cliccato
    console.log('Button clicked');
    
    // Puoi anche chiamare la funzione clientReady se necessario
    clientReady();
  });







  //////////////// HTML OUTPUT EVENTS ////////////////////////


  const clienIdLabel = document.getElementById('labelIdVisualization');
  const mp3LabelStatus = document.getElementById('mp3DownloadStatus');








  //////////////// WEB SOCKET DATA SENDER ////////////////////////

  function websocketSender(json) {
    ws.send(json);
  }







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


  //////////////// CLIENT SENDER FUNCTION ////////////////////////
  function sliderChanged() {
    let data = JSON.stringify({ 'slider1': controlTD.value, 'slider2': controlTD2.value });
    websocketSender(data);
  }
  function clientReady() {
    const readyMessage = JSON.stringify({ type: 'ready' });
    websocketSender(readyMessage);
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
        if (receivedData.server_message_target == ServerMessageTarget.PartecipantClient) {
          
          // messaggio di tipo configurazione dell'esperienza
          if (receivedData.message_type == ServerMessagePartecipantType.ExperienceConfigurator) {
            
            // configura esperienza 
            configureExperience(receivedData.message_data);

          } else if (receivedData.message_type == ServerMessagePartecipantType.ClientIdConfigurator) {
            
            // configura id client
            configureClientId(receivedData.message_data);
          }

        }

        

      } catch (error) {
        console.error('Errore durante l\'analisi del JSON:', error);
      }
    }
  }

  //////////////// CLIENT FUNCTION ////////////////////////
  async function configureExperience(data) {
    // dati ricevuti
    if (data.track) {
      console.log(`Nome della traccia: ${data.track}`);
    }
    if (data.artist) {
      console.log(`Nome dell'artista: ${data.artist}`);
    }


    /// DEBUG ///
    try {
      // download traccia audio
      const audioBuffer = await downloadMP3();

      // play della traccia
      playMP3(audioBuffer);
    } catch (error) {
        // Gestisci l'errore se necessario
    }
    
  }
  function configureClientId(data) {
    // dati ricevuti
    clientUniqueId = data.clientId;

    // Aggiorna il contenuto della label
    clienIdLabel.textContent = "id: " + clientUniqueId;

    // disabilita ready button
    debugReadyButton.disabled = true;
  }
  


  const mp3Url = 'https://smart-perf-7d930c61dbd0.herokuapp.com/mp3';
  // Funzione per scaricare il file MP3 e immagazzinarlo in una variabile
  async function downloadMP3() {
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
        mp3LabelStatus.textContent = "track: " + 'error';
        throw error; // Puoi scegliere di gestire l'errore in modo diverso se necessario
    }
  }

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  function playMP3(audioBuffer) {
    try {
        mp3LabelStatus.textContent = "track: " + 'playing';

        // Crea un buffer source node
        const source = audioContext.createBufferSource();

        // Collega il buffer al buffer source
        source.buffer = audioBuffer;

        // Collega il buffer source al contesto audio
        source.connect(audioContext.destination);

        // Riproduci il suono
        source.start();

        // Aggiorna lo stato
        mp3LabelStatus.textContent = "track: " + 'done';
    } catch (error) {
        console.error('Error while playing the MP3 file:', error);
        mp3LabelStatus.textContent = "track: " + 'error';
    }
  }
  
});
