var uuid = require('node-uuid'),
   sys = require('sys'),
   mongodb = require('mongodb');

var client = new mongodb.Db('chaos-board',
    new mongodb.Server("127.0.0.1", 27017, {}));

function Store(client) {

  // XXX
  var collection = null;
  client.collection('chaos', function (err, p_collection) {
    collection = p_collection;
  });

  this.newBoard = function() {
    var board = {drawingQueue: [], boardId: uuid()};

    client.collection('chaos', function (err, collection) {
      if (err) {
        console.log("err")
        console.log(err)
        // XXX 
        return;
      }
      collection.insert(board);
    });

    return board;
  }

  this.getBoard = function(boardId, callback) {
    collection.find({boardId: boardId}, function (err, cursor) {
      cursor.each(function(err, doc) {
        if(doc != null) callback(err, doc);
      })
    });
  },

  this.saveBoard = function (board) {
    collection.save(board, function () {});
  }
};


var store = null;
exports.getStore = function (callback) {
  if (store === null) {
    client.open(function(err, _client) {
      if (err) {
        callback(null, err);
      }
      store = new Store(client);
      callback(store, null);
    });
  } else {
    callback(store, null);
  }
}

exports.clients = {};
