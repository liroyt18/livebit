const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// אובייקט לשמירת חיבורים פעילים כדי שלא נפתח מיליון חיבורים לאותו יוזר
let activeConnections = {};

io.on('connection', (socket) => {
    console.log('User connected to dashboard:', socket.id);

    // --- בדיקת משתמש (Validation) בשלב הלוגין ---
    socket.on("validateUser", async (username) => {
        console.log(`Checking if user exists: ${username}`);
        try {
            let tempConn = new WebcastPushConnection(username);
            // מנסה למשוך נתוני חדר - אם המשתמש לא קיים זה יזרוק שגיאה
            await tempConn.getRoomInfo(); 
            
            console.log(`User ${username} validated successfully.`);
            socket.emit("loginResult", { success: true, user: username });
        } catch (err) {
            console.log(`Validation failed for ${username}:`, err.message);
            socket.emit("loginResult", { 
                success: false, 
                message: "TikTok user not found or inactive. Make sure the name is correct." 
            });
        }
    });

    // --- חיבור ללייב והזרמת נתונים ---
    socket.on("connectToLive", (data) => {
        const username = data.username;

        // אם כבר יש חיבור פעיל ליוזר הזה, ננתק אותו קודם
        if (activeConnections[socket.id]) {
            activeConnections[socket.id].disconnect();
        }

        let tiktokConn = new WebcastPushConnection(username);

        tiktokConn.connect().then(state => {
            console.log(`Connected to ${username}'s Live!`);
            activeConnections[socket.id] = tiktokConn;
            socket.emit("liveConnected", { username });
        }).catch(err => {
            console.error("Failed to connect to Live:", err);
            socket.emit("liveError", "Could not connect to Live. Is the user live?");
        });

        // האזנה למתנות
        tiktokConn.on('gift', data => {
            console.log(`Gift received from ${data.uniqueId}`);
            socket.emit("gift", {
                uniqueId: data.uniqueId,
                giftName: data.giftName,
                diamondCount: data.diamondCount,
                repeatCount: data.repeatCount
            });
        });

        // האזנה ללייקים
        tiktokConn.on('like', data => {
            socket.emit("like", {
                uniqueId: data.uniqueId,
                likeCount: data.likeCount
            });
        });
    });

    socket.on('disconnect', () => {
        if (activeConnections[socket.id]) {
            activeConnections[socket.id].disconnect();
            delete activeConnections[socket.id];
        }
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
