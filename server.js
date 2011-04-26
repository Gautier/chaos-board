var http = require('http'),
    fs = require('fs');
    path = require('path'),
    url = require('url');
    db = require('./db').db;
    clutch = require('clutch');
    io = require('socket.io');


var staticServe = function (req, res, filename) {
  res.writeHead(200, {'Content-Type': 'text/javascript'});
  var localPath = path.join('static', filename);
  fs.readFile(localPath, function (err, data) {
    res.end(data);
  });
}

var index = function index(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.readFile("templates/index.html", function (err, data) {
    res.end(data);
  });
}

var newBoard = function index(req, res) {
  var board = db.newBoard();
  res.writeHead(302, {'Location': '/board/' + board.boardId + '/'});
  res.end("");
}

var joinBoard = function index(req, res, boardId) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.readFile("templates/board.html", function (err, data) {
    res.end(data);
  });
}

var urls = clutch.route404([
    ['GET /board/new/$', newBoard],
    ['GET /board/(.*)/$', joinBoard],
    ['GET /static/(.*)$', staticServe],
    ['GET /$', index]]);

var server = http.createServer(urls);
server.listen(8000);

var socket = io.listen(server);
socket.on('connection', function(client){

  var board = null;

  client.on('message', function (data) {
    if ("command" in data) {
      switch(data.command) {
        case "connect":
            if (!db.hasBoard(data.boardId)) {
              // XXX: handle error
              return;
            }
            board = db.getBoard(data.boardId);
            board.clients.push(client);

            // push the saved drawings
            for(var i = 0; i < board.drawingQueue.length; i++) {
              client.send(board.drawingQueue[i]);
            }
          break;
        default:
          break;
      }
    } else {
      board.drawingQueue.push(data);
      for (var i = 0; i < board.clients.length; i++) {
        if (client != board.clients[i]) {
          board.clients[i].send(data);
        }
      }
    }
  });

  client.on('disconnect', function() {
    board.clients.pop(client);
  });

});
