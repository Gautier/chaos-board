require.paths.unshift('./lib')

var http = require('http'),
    db = require('db'),
    web = require('web'),
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
        client.disconnect();
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
        for(var i = 0; i < board.drawingQueue.length; i++) {
          client.send(board.drawingQueue[i]);
        }

        client.on('disconnect', function() {
          boardClients.pop(client);
        });

        client.on("message", function (draw_data) {
          board.drawingQueue.push(draw_data);

          if(savingQueueTimer != null) {
            clearTimeout(savingQueueTimer);
          }
          savingQueueTimer = setTimeout(function (_board) {
            store.saveBoard(_board);
          }, 2000, board)

          for (var i = 0; i < boardClients.length; i++) {
            if (client != boardClients[i]) {
              boardClients[i].send(draw_data);
            }
          }
        });

      });
    });
  });
});
