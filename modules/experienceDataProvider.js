// modules/experienceDataProvider.js
const express = require("express");

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