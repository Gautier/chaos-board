var uuid = require('node-uuid');

var dbStore = {};

var db = function () {

  this.newBoard = function() {
    var boardId = uuid();
    dbStore[boardId] = {drawingQueue: [], boardId: boardId, clients: []};
    return dbStore[boardId];
  }

  this.getBoardByClient = function(client) {
    for (var i = 0; i < dbStore.length; i++) {
      if(dbStore[i].clients.indexOf(client) != -1) {
        return dbStore[i];
      }
    }
    return null;
  }

  this.getBoard = function(uuid) {
    return dbStore[uuid];
  }

  this.hasBoard = function(uuid) {
    return uuid in dbStore;
  }

};

exports.db = new db();
