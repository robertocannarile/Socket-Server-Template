const express = require("express");
const path = require("path");
const fetch = require('node-fetch');


const getMp3File = () => {
    const app = express();
  
    app.get('/mp3', async (req, res) => {
        try {
          const response = await fetch('https://www.stefanoromanelli.it/remoteAssets/sample.mp3');
          const buffer = await response.buffer();
          res.set('Content-Type', 'audio/mpeg');
          res.send(buffer);
        } catch (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
        }
      });
  
    return app;
  };


module.exports = getMp3File;