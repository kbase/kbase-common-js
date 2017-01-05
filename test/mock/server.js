'use strict';

var http = require('http');

const PORT = 8090;

function enableCors(response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
}

function handleTrigger(args, request, response) {
    var responseCode = parseInt(args[0]);
    console.log('Mocking ' + String(responseCode));
    response.writeHead(responseCode, 'MOCK of ' + String(responseCode));
    response.end();
}

function handleRequest(request, response) {
    var path = request.url.split('/').slice(1);
    var action = path[0];
    enableCors(response);
    switch (action) {
        case 'trigger':
            handleTrigger(path.slice(1), request, response);
            break;
        default:
            response.writeHead(400, 'Invalid request: ' + request.url);
            response.end();            
    }
}

var server = http.createServer(handleRequest);

server.listen(PORT, function () {
    console.log('Mock server started on ' + PORT);
})
