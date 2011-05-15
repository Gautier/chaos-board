require.paths.unshift('../lib')

var mongodb = require('mongodb'),
    q = require('queue');

var client = new mongodb.Db('chaos-board',
    new mongodb.Server("127.0.0.1", 27017, {}));

function update (board, callback) {
  var queue = new q.Queue(function (compressed) {
    board.drawingQueue = compressed;
    callback(board);
  }, 200000000000);
  console.log(board.boardId + ":" + board.drawingQueue.length); 
  for (var i=0; i < board.drawingQueue.length; i++) {
    queue.feed(board.drawingQueue[i]);
  }
  queue.done();
}

client.open(function(err, _client) {
  client.collection('chaos', function (err, collection) {
    collection.find({}, {}, function (err, cursor) { 
      cursor.count(function (err, i) {
       console.log("have " + i); 
      });
    });

    setTimeout(function ()  {
      var i = 0;
      collection.find({}, {}, function (err, cursor) {
        cursor.each(function(err, doc) {
          if(doc != null) {
            i++;
            console.log("doc" + i);

            update(doc, function (updated) {
              collection.save(updated, function () {
                console.log("saved" + updated.boardId + "with " + updated.drawingQueue.length);
              });
            });
          }
        });
      });
    }, 2000);

  });
});

