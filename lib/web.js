var fs = require('fs'),
    db = require('db'),
    path = require('path'),
    clutch = require('clutch');

function staticServe(req, res, filename) {
  res.writeHead(200, {'Content-Type': 'text/javascript'});
  var localPath = path.join('static', filename);
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

exports.urls = clutch.route404([
    ['GET /board/new/$', newBoard],
    ['GET /board/(.*)/$', joinBoard],
    ['GET /static/(.*)$', staticServe],
    ['GET /$', index]]);

