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
    console.log('User connected to dashboard');

    socket.on('joinRoom', (tiktokUsername) => {
        console.log(`Attempting to connect to TikTok: ${tiktokUsername}`);
        
        // יצירת חיבור חדש לטיקטוק
        let tiktokConnection = new WebcastPushConnection(tiktokUsername);

        tiktokConnection.connect().then(state => {
            console.log(`Connected to ${state.roomId}`);
            socket.emit('connected');
        }).catch(err => {
            console.error('Failed to connect', err);
        });

        // שליחת לייקים בזמן אמת
        tiktokConnection.on('like', (data) => {
            io.emit('like', data);
        });

        // שליחת מתנות בזמן אמת (כולל המטבעות 🪙)
        tiktokConnection.on('gift', (data) => {
            io.emit('gift', data);
        });

        // ניתוק מהטיקטוק כשהמשתמש סוגר את האתר
        socket.on('disconnect', () => {
            tiktokConnection.disconnect();
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
