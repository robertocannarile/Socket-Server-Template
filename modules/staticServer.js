// modules/staticServer.js
const express = require("express");
const path = require("path");

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
  app.get('/get-download-links', (req, res) => {
    // Leggi la directory
    fs.readdir(randomicTracksFolderPath, (err, files) => {
      if (err) {
        console.error('Errore nella lettura della directory di randomic_tracks:', err);
        res.status(500).json({ error: 'Errore nella lettura della directory di randomic_tracks' });
        return;
      }

      // Genera una lista di link per ciascun file
      const downloadLinks = files.map((filename) => {
        return `${serverDomain}/download/file?filename=${filename}`;
      });

      // Restituisci l'array di link
      res.json({ links: downloadLinks });
    });
  });

  return app;
};

module.exports = createStaticServer;