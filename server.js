var http = require('http'),
    fs = require('fs');
    path = require('path'),
    url = require('url');
    db = require('./db').db;
    clients = require('./db').clients;
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

  var savingQueueTimer = null;

  function connector (data) {
    if ("command" in data && data.command == "connect") {
      db.getBoard(data.boardId, function (err, board) {

        clients[data.boardId] = clients[data.boardId] || [];
        clients[data.boardId].push(client);

        // push the saved drawings
        for(var i = 0; i < board.drawingQueue.length; i++) {
          client.send(board.drawingQueue[i]);
        }

        client.on('disconnect', function() {
          clients[board.boardId].pop(client);
        });

        client.removeListener("message", connector)

        client.on("message", function (draw_data) {
          board.drawingQueue.push(draw_data);

          if(savingQueueTimer != null) {
            clearTimeout(savingQueueTimer);
          }
          savingQueueTimer = setTimeout(function (_board) {
            db.saveBoard(_board);
          }, 2000, board)

          var otherClients = clients[board.boardId];
          for (var i = 0; i < otherClients.length; i++) {
            if (client != otherClients[i]) {
              otherClients[i].send(draw_data);
            }
          }
        });

      });
    }
  }

  client.on('message', connector);

});
