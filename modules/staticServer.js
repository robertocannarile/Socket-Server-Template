// modules/staticServer.js
const express = require("express");
const path = require("path");


const tracksFolderPath = path.join(__dirname, 'tracks');
const randomicTracksFolderPath = path.join(tracksFolderPath, 'randomic_tracks');

const createStaticServer = (publicFolder = "public") => {
  const app = express();

  // Usa il percorso assoluto per indicizzare la cartella public
  const publicPath = path.join(__dirname, "..", publicFolder);

  app.use(express.static(publicPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      }
    },
  }));

  // Aggiungi una route per gestire i download
  app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(randomicTracksFolderPath, filename);

    // Invia il file come risposta alla richiesta
    res.sendFile(filePath);
  });

  return app;
};

module.exports = createStaticServer;