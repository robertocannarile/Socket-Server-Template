document.addEventListener('DOMContentLoaded', function () {
  let ws = new WebSocket('wss://smart-perf-7d930c61dbd0.herokuapp.com:443');



  let controlTD = document.querySelector('.controlTD');
  let controlTD2 = document.querySelector('.controlTD2');


  
  


  
  //Slider 1, Ogni volta che cambio un valore allo slider, invia la modifica
  controlTD.addEventListener('input', (event) =>{
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


  ws.addEventListener("message", (message) => {
    console.log(message);
    //window.alert(message);
  });

  ws.addEventListener("error", (error) => {
    window.alert('websocket closed');
    console.log('websocket closed');
  });

  ws.addEventListener("close", (event) => {
    window.alert('websocket closed');
    console.log('websocket closed');
  });


  /*ws.addEventListener('message', function (event) {
    if (event.data) {
          console.log(event.data)
          //let countContainer = document.getElementById('controlTD');
          //const widgetParent = document.getElementById('countContainer');
          //widgetParent.innerHTML = event.data
    }
  });*/
});
