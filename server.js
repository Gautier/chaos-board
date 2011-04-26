var http = require('http'),
    fs = require('fs');
    url = require('url');
    io = require('socket.io');

var boardServer = function (req, res) {
  var src = "index.html";

  if (url.parse(req.url).pathname == "/chaosboard.js"){
    src = "chaosboard.js";
  }

  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.readFile(src, function (err, data) {
    res.end(data);
  });
}

var server = http.createServer(boardServer);
server.listen(8000);


var drawingQueue = [];

var socket = io.listen(server);
socket.on('connection', function(client){
  // push the saved drawings
  for(var i = 0; i < drawingQueue.length; i++) {
    client.send(drawingQueue[i]);
  }

  client.on('message', function (data) {
    drawingQueue.push(data);
    client.broadcast(data);
  });
});
