const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');

const app = express();
const PORT = 3000; // HTTP server port
const WS_PORT = 9090; // WebSocket server port

// Function to get the device's local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        const iface = interfaces[interfaceName];
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address; // Return the first non-internal IPv4 address
            }
        }
    }
    return '127.0.0.1'; // Fallback to localhost if no IP is found
}

// Get the device's IP address
const DEVICE_IP = getLocalIPAddress();
// console.log(`Device IP Address: ${DEVICE_IP}`);

// Serve static files (e.g., index.html)
app.use(express.static('public'));

// Add the /get-ip endpoint
app.get('/get-ip', (req, res) => {
    res.json({ ip: DEVICE_IP });
});

// Start the HTTP server
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
    console.log(`HTTP server running at http://${DEVICE_IP}:${PORT}`);
    console.log(`or http://localhost:${PORT}`);
});

// Create a combined HTTP and WebSocket server on port 9090
const combinedServer = http.createServer((req, res) => {
    // Respond with "Not Found" for all HTTP requests
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end(`Not Found`);

});

// Attach the WebSocket server to the combined server
const wss = new WebSocket.Server({ server: combinedServer });

// Start the combined server
combinedServer.listen(WS_PORT, DEVICE_IP, () => {
    // console.log(`Combined HTTP/WebSocket server running at ws://${DEVICE_IP}:${WS_PORT}`);
});

// Broadcast a message to all connected clients
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}



// Start the WebSocket server
// const wss = new WebSocket.Server({ host: DEVICE_IP, port: WS_PORT }, () => {
//     console.log(`WebSocket server running at ws://${DEVICE_IP}:${WS_PORT}`);
// });

// WebSocket event handlers
wss.on('connection', (ws) => {
    // console.log('Client connected');

    // Send a welcome message to the client
    // ws.send(JSON.stringify('Welcome to the WebSocket server!'));

    // Handle messages from the client
    ws.on('message', (message) => {
        // console.log('Received:', message);

        // Parse the incoming message as JSON
        let parsedMessage;
        try {
            parsedMessage = JSON.parse(message);
        } catch (error) {
            // console.error('Invalid JSON message:', message);
            return;
        }

        // Broadcast the message to all connected clients
        broadcast(parsedMessage);
    });

    // Handle client disconnection
    ws.on('close', () => {
        // console.log('Client disconnected');
    });
});