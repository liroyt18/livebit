const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
// הגדרת CORS מלאה ל-Socket.io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    socket.on('syncOverlay', (data) => {
        io.emit('updateUI', data);
    });

    socket.on('joinRoom', (username) => {
        const tiktok = new WebcastPushConnection(username);
        tiktok.connect()
            .then(() => socket.emit('connected'))
            .catch((err) => socket.emit('error', err));

        tiktok.on('gift', (data) => io.emit('gift', data));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
