const createStaticServer = require("./modules/staticServer");
const getMp3File = require('./modules/experienceDataProvider');
const createWebSocketServer = require("./modules/webSocketServer");

const http = require("http");
const express = require("express");
const app = express();


const serverPort = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(serverPort);
console.log(`Server started on port ${serverPort} in stage ${process.env.NODE_ENV}`);






// MODULES START

// web socket module
const wss = createWebSocketServer(server);

// static web app 
const staticApp = createStaticServer();
app.use(staticApp);

// download MP3 module
const mp3App = getMp3File();
app.use(mp3App); // Mount the MP3 route




