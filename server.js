const { WebcastPushConnection } = require('tiktok-live-connector');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    socket.on('connect-live', (username) => {
        let tiktok = new WebcastPushConnection(username);
        tiktok.connect().then(() => {
            socket.emit('conn-status', { success: true });
            tiktok.on('gift', (data) => io.emit('gift', data));
            tiktok.on('like', (data) => io.emit('like', data));
        }).catch(() => {
            socket.emit('conn-status', { success: false });
        });
    });
});

server.listen(3000, () => console.log('Server active on port 3000'));
