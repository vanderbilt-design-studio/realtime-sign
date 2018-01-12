const micro = require('micro');
const WebSocket = require('ws');
const { json, createError } = micro;

let wss;
let lastStatus = {};

const sendStatus = sock => sock.send(JSON.stringify(lastStatus));

const server = micro(async (req, res) => {
    switch (req.method) {
        case 'POST':
            if (req.headers['x-api-key'] !== process.env.RSIGN_API_KEY) {
                throw createError(401, 'Invalid API key');
            }
            lastStatus = await json(req);
            wss.clients.forEach(sock => {
                if (sock.readyState === WebSocket.OPEN) {
                    sendStatus(sock);
                }
            });
            console.log(lastStatus);
            return { result: 'OK' };
        default:
            throw createError(405, 'Invalid method');
    }
});

wss = new WebSocket.Server({ server });
wss.on('connection', sock => {
    sock.on('error', console.error);
    sendStatus(sock);
});

server.listen(process.env.RSIGN_PORT || 3000);
