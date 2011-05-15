require.paths.unshift('./lib')

var http = require('http'),
    db = require('db'),
    web = require('web'),
    compressQueue = require('queue'),
    io = require('socket.io');

var server = http.createServer(web.urls);
server.listen(8000);

db.getStore(function (store) {
  var socket = io.listen(server);
  socket.on('connection', function(client){

    client.once('message', function (data) {
      var savingQueueTimer = null;

      // First message must be a connect
      if (!("command" in data) || data.command != "connect") {
        client.send({command: "error", message: "no such board"});
        try {
          client.disconnect();
        } catch(e) {
          // alright, probably not connected properly anyway
          // XXX find out this happens sometimes
        }
        return;
      }

      store.getBoard(data.boardId, function (err, board) {
        if (err) {
          client.send({command: "error", message: "no such board"});
          client.disconnect();
          return;
        }

        var boardClients = db.clients[data.boardId] = db.clients[data.boardId] || [];
        boardClients.push(client);

        // push the saved drawings
        for (var i = 0; i < board.drawingQueue.length; i++) {
          client.send(board.drawingQueue[i]);
        }

        client.on('disconnect', function() {
          boardClients.pop(client);
        });

        var dbQueue = new compressQueue.Queue(function (compressed) {
          store.getBoard(data.boardId, function (err, _board) {
            _board.drawingQueue.push(compressed);
            store.saveBoard(_board);
          });
        }, 3000);

        var liveQueue = new compressQueue.Queue(function (compressed) {
          for (var i = 0; i < boardClients.length; i++) {
            if (client != boardClients[i]) {
              boardClients[i].send(compressed);
            }
          }
        }, 20);

        client.on("message", function (draw_data) {
          liveQueue.feed(draw_data);
          dbQueue.feed(draw_data);
        });

      });
    });
  });
});
