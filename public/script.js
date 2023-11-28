document.addEventListener('DOMContentLoaded', function () {
  let ws = new WebSocket('wss://smart-perf-7d930c61dbd0.herokuapp.com:443');



  let controlTD = document.querySelector('.controlTD');
  let controlTD2 = document.querySelector('.controlTD2');







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



  function sliderChanged() {
    let data = JSON.stringify({ 'slider1': controlTD.value, 'slider2': controlTD2.value });
    websocketSender(data);
  }

  function websocketSender(json) {
    ws.send(json);
  }


  ws.addEventListener("message", (event) => {

    // Verifica se il messaggio non è JSON (ad esempio, "ping" serve a tenere il server attivo)
    if (event.data === 'ping') {
      console.log('Ricevuto messaggio ping');
      return;
    } else {
      // event.data contiene il messaggio ricevuto dal server
      try {
        const receivedData = JSON.parse(event.data);
        console.log(receivedData);

        // dati ricevuti
        if (receivedData.track) {
          console.log(`Nome della traccia: ${receivedData.track}`);
        }
        if (receivedData.artist) {
          console.log(`Nome dell'artista: ${receivedData.artist}`);
        }

      } catch (error) {
        console.error('Errore durante l\'analisi del JSON:', error);
      }
    }

  });

  ws.addEventListener("error", (error) => {
    window.alert('websocket closed');
    console.log('websocket closed');
  });

  ws.addEventListener("close", (event) => {
    window.alert('websocket closed');
    console.log('websocket closed');
  });


});
