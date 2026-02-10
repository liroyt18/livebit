const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    socket.on('joinRoom', (tiktokUsername) => {
        console.log(`Checking: ${tiktokUsername}`);
        
        let tiktokConnection = new WebcastPushConnection(tiktokUsername);

        tiktokConnection.connect().then(state => {
            console.log(`Success: Connected to ${tiktokUsername}`);
            socket.emit('connected'); // שולח הצלחה לאתר
        }).catch(err => {
            console.error('Error: User not found/not live');
            socket.emit('error', 'User not active'); // שולח שגיאה לאתר
        });

        tiktokConnection.on('like', (data) => { io.emit('like', data); });
        tiktokConnection.on('gift', (data) => { io.emit('gift', data); });

        socket.on('disconnect', () => {
            try { tiktokConnection.disconnect(); } catch(e) {}
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
