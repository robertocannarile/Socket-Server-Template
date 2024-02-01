//const setRandomicClientTracksConfiguratorUrl = require("./webSocketServer");
//const setGlobalClientTracksConfiguratorUrl = require("./webSocketServer");
const { setRandomicClientTracksConfiguratorUrl, setGlobalClientTracksConfiguratorUrl } = require("./webSocketServer");

const express = require("express");

const fs = require('fs');
const path = require('path');

const tracksFolderPath = path.join(__dirname, 'tracks');
const randomicTracksFolderPath = path.join(tracksFolderPath, 'randomic_tracks');

const gloablTracksFolderPath = path.join(tracksFolderPath, 'global_tracks');

const serverDomain = 'https://smart-perf-7d930c61dbd0.herokuapp.com';

// Leggi la directory delle randomic traks
fs.readdir(randomicTracksFolderPath, (err, files) => {
    if (err) {
        console.error('Errore nella lettura della directory di randomic_tracks:', err);
        return;
    }

    let randomicTracksUrl  = [];
    // Itera sui file
    files.forEach((file) => {
        // Crea il link per il file
        const fileLink = `${serverDomain}/download/randomic/${encodeURIComponent(file)}`;
        randomicTracksUrl.push(fileLink);
        //console.log('Link per scaricare il file:', fileLink);
    });



    setRandomicClientTracksConfiguratorUrl(randomicTracksUrl);
});

// Leggi la directory delle global traks
fs.readdir(gloablTracksFolderPath, (err, files) => {
    if (err) {
        console.error('Errore nella lettura della directory di randomic_tracks:', err);
        return;
    }


    let globalTracksUrl = [];
    // Itera sui file
    files.forEach((file) => {
        // Crea il link per il file
        const fileLinkGlobal = `${serverDomain}/download/global/${encodeURIComponent(file)}`;
        globalTracksUrl.push(fileLinkGlobal);
    });

    setGlobalClientTracksConfiguratorUrl(globalTracksUrl);
});


const getMp3File = () => {
    const app = express();

    app.get('/mp3', async (req, res) => {
        try {

            // Ottieni l'URL del file dalla query della richiesta
            const fileUrl = req.query.url;


            // Utilizza l'importazione dinamica invece di require
            const fetch = (await import('node-fetch')).default;

            const response = await fetch(fileUrl);
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