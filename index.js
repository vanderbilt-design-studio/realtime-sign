const micro = require('micro');
const WebSocket = require('ws');
const { json, createError } = micro;

let wss;
let lastStatus = {};

const sendJSON = data => sock => sock.send(JSON.stringify(data));

const server = micro(async (req, res) => {
    switch (req.method) {
        case 'POST':
            if (req.headers['x-api-key'] !== process.env.RSIGN_API_KEY) {
                throw createError(401, 'Invalid API key');
            }
            lastStatus = await json(req);
            wss.clients
                .filter(sock => sock.readyState === WebSocket.OPEN)
                .forEach(sendJSON(lastStatus));
            console.log(lastStatus);
            return { result: 'OK' };
        default:
            throw createError(405, 'Invalid method');
    }
});

wss = new WebSocket.Server({ server });
wss.on('connection', sendJSON(lastStatus));

server.listen(process.env.RSIGN_PORT || 3000);
