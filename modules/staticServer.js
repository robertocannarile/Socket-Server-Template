// staticServer.js
const express = require("express");

const createStaticServer = () => {
  const app = express();

  app.use(express.static('public', {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      }
    },
  }));

  return app;
};

module.exports = createStaticServer;