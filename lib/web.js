var fs = require('fs'),
    db = require('db'),
    async = require('async'),
    mime = require('mime'),
    path = require('path'),
    clutch = require('clutch'),
    Canvas = require('canvas');


function staticServe(req, res, filename) {
  var localPath = path.join('static', filename);
  var mimeType = mime.lookup(localPath);

  res.writeHead(200, {'Content-Type': mimeType});

  fs.readFile(localPath, function (err, data) {
    res.end(data);
  });
}

function index(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.readFile("templates/index.html", function (err, data) {
    res.end(data);
  });
}

function newBoard(req, res) {
  db.getStore(function (store) {
    var board = store.newBoard();
    res.writeHead(302, {'Location': '/board/' + board.boardId + '/'});
    res.end("");
  });
}

function joinBoard(req, res, boardId) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  fs.readFile("templates/board.html", function (err, data) {
    res.end(data);
  });
}

function renderBoard(req, res, boardId) {

      function Pen(ctx, color) {
        var last_point = {x: 0, y: 0};

        this.down = function (x, y) {
          last_point.x = x;
          last_point.y = y;

        }

        this.move = function (x, y) {
          drawPoint(x, y, color);

          last_point.x = x;
          last_point.y = y;
        }

        function drawPoint(x, y) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = color;

          ctx.beginPath();
          ctx.moveTo(last_point.x, last_point.y);
          ctx.lineTo(x, y);
          ctx.stroke();

        }
      }

  db.getStore(function (store) {
    store.getBoard(boardId, function (err, board) {

      var maxX=0, maxY=0;
      for(var i = 0; i < board.drawingQueue.length; i ++ ) {
        for(var j = 0; j < board.drawingQueue[i].length; j++) {
          for(var k = 1; k < board.drawingQueue[i][j].x.length; k++) {
            if(board.drawingQueue[i][j].x[k] > maxX) {
              maxX = board.drawingQueue[i][j].x[k];
            }
            if(board.drawingQueue[i][j].y[k] > maxY) {
              maxY = board.drawingQueue[i][j].y[k];
            }
          }
        }
      }

      var canvas = new Canvas(maxX, maxY),
          ctx = canvas.getContext('2d');

      for(var i = 0; i < board.drawingQueue.length; i ++ ) {
        async.forEach(board.drawingQueue[i], function (data, f) {
          var pen = new Pen(ctx, data.color);

          pen.down(data.x[0], data.y[0]);
          for(var i = 1; i < data.x.length; i++) {
            pen.move(data.x[i], data.y[i]);
          }
          f();

        }, function (err) {
          //check err
          res.writeHead(200, {'Content-Type': 'image/png'});
          canvas.createPNGStream().pipe(res);
        });
      }
    });

  });
}

exports.urls = clutch.route404([
    ['GET /board/new/$', newBoard],
    ['GET /board/(.*).png$', renderBoard],
    ['GET /board/(.*)/$', joinBoard],
    ['GET /static/(.*)$', staticServe],
    ['GET /$', index]]);

