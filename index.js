const micro = require('micro');
const WebSocket = require('ws');
const { json, createError } = micro;
const equal = require('fast-deep-equal');

let wss;
let currStatus = {};

const sendStatus = sock => sock.send(JSON.stringify(currStatus));

const server = micro(async (req, res) => {
    switch (req.method) {
        case 'POST':
            if (req.headers['x-api-key'] !== process.env.RSIGN_API_KEY) {
                throw createError(401, 'Invalid API key');
            }
            const newStatus = await json(req);
            if (equal(currStatus, newStatus)) {
                return { updated: false };
            }
            currStatus = newStatus;
            wss.clients.forEach(sock => {
                if (sock.readyState === WebSocket.OPEN) {
                    sendStatus(sock);
                }
            });
            console.log(currStatus);
            return { updated: true };
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
