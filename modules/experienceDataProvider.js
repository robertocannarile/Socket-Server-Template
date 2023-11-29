// modules/experienceDataProvider.js
const express = require("express");

const getMp3File = () => {
    const app = express();

    app.get('/mp3', async (req, res) => {
        try {
            // Utilizza l'importazione dinamica invece di require
            const fetch = (await import('node-fetch')).default;

            const response = await fetch('https://www.stefanoromanelli.it/remoteAssets/sample.mp3');
            const buffer = await response.arrayBuffer();
            res.set('Content-Type', 'audio/mpeg');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
            
            res.send(buffer);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    });

    return app;
};

module.exports = getMp3File;