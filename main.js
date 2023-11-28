const createStaticServer = require("./modules/staticServer");
const createStaticServer = require("./modules/webSocketServer");
const http = require("http");
const express = require("express");
const app = express();




const serverPort = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(serverPort);
console.log(`Server started on port ${serverPort} in stage ${process.env.NODE_ENV}`);






// web socket module
const wss = createWebSocketServer(server);

// static web app 
const staticApp = createStaticServer();
app.use(staticApp);



