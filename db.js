var uuid = require('node-uuid'),
   sys = require('sys'),
   mongodb = require('mongodb');

var mongoClient = new mongodb.Db('chaos-board', new mongodb.Server("127.0.0.1", 27017, {}));

var db = function () {
  var insertBoard = null;
  var getBoard = null;
  var saveBoard = null;

  mongoClient.open(function(err, p_client) {
    insertBoard = function(board) {
      mongoClient.collection('chaos', function (err, collection) {
        if (err) {
          console.log("err")
          console.log(err)
        }
        collection.insert(board);
      });
    }

    var collection = null;
    p_client.collection('chaos', function (err, p_collection) {
      collection = p_collection;
    });

    var i =0;
    getBoard = function(boardId, callback) {
      collection.find({boardId: boardId}, function (err, cursor) {
        cursor.each(function(err, doc) {
          if(doc != null) callback(err, doc);
        }) 
      });
    }

    saveBoard = function (board) {
      collection.save(board, function () {});
    }

  });

  this.getBoard = function(boardId, callback) {
    getBoard(boardId, callback);
  }

  this.newBoard = function() {
    var board = {drawingQueue: [], boardId: uuid()};
    insertBoard(board);
    return board;
  }

  this.saveBoard = function(board) {
    saveBoard(board) 
  }

};

exports.db = new db();
exports.clients = {};

