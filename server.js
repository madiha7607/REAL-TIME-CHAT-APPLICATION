const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket Server
const wss = new WebSocket.Server({ server });
const messageHistory = [];

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send message history
    ws.send(JSON.stringify({
        type: 'history',
        data: messageHistory
    }));

    ws.on('message', (message) => {
        const msgObj = {
            id: Date.now(), // Unique ID for each message
            text: message.toString(),
            timestamp: new Date().toISOString()
        };

        // Store message
        messageHistory.push(msgObj);
        if (messageHistory.length > 100) messageHistory.shift();

        // Broadcast to all clients EXCEPT sender
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'message',
                    data: msgObj
                }));
            }
        });
    });
});