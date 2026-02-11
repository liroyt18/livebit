const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    // מאזין לעדכונים מהפאנל ושולח אותם ל-Overlay
    socket.on('syncOverlay', (data) => {
        io.emit('updateUI', data); 
    });

    socket.on('joinRoom', (username) => {
        let tiktok = new WebcastPushConnection(username);
        tiktok.connect().then(() => socket.emit('connected'))
        .catch(() => socket.emit('error'));

        tiktok.on('gift', (data) => { io.emit('gift', data); });
    });
});

server.listen(process.env.PORT || 3000);
