// modules/experienceDataProvider.js

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

    // Itera sui file
    files.forEach((file) => {
        // Crea il link per il file
        const fileLink = `${serverDomain}/download/${encodeURIComponent(file)}`;
        console.log('Link per scaricare il file:', fileLink);
    });

});

// Leggi la directory delle global traks
fs.readdir(gloablTracksFolderPath, (err, files) => {
    if (err) {
        console.error('Errore nella lettura della directory di randomic_tracks:', err);
        return;
    }

    // Itera sui file
    files.forEach((file) => {
        // Crea il link per il file
        const fileLink = `${serverDomain}/download/${encodeURIComponent(file)}`;
        console.log('Link per scaricare il file:', fileLink);
    });

});