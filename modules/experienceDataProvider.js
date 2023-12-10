// modules/experienceDataProvider.js
const express = require("express");

const fs = require('fs');
const path = require('path');

const tracksFolderPath = path.join(__dirname, 'tracks');
const randomicTracksFolderPath = path.join(tracksFolderPath, 'randomic_tracks');


// Leggi la directory
fs.readdir(randomicTracksFolderPath, (err, files) => {
    if (err) {
        console.error('Errore nella lettura della directory di randomic_tracks:', err);
        return;
    }

    // Genera e stampa i link per ciascun file
    files.forEach((filename) => {
        const downloadLink = `/download/file?filename=${filename}`;
        console.log(`Link per il download di ${filename}: ${downloadLink}`);
    });
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