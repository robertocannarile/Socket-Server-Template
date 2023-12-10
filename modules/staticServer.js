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
  app.get('/download/file', (req, res) => {
    const filename = req.query.filename;
    const filePath = path.join(publicPath, 'tracks', 'randomic_tracks', filename);

    res.download(filePath, filename);
  });

  return app;
};

module.exports = createStaticServer;