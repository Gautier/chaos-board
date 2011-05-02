function Queue (callback, timeout) {

  var queue = [];

  var timer = null;
  this.feed = function(data) {
    queue.push(data);
    if (timer != null) {
      clearTimeout(timer);
    }
    timer = setTimeout(this.done, timeout);
  }

  this.done = function () {
    if (timer != null) {
      clearTimeout(timer);
    }
    if (queue.length == 0) {
      callback(null);
      return;
    }

    var compressedQueue = [];
    var current = {};

    for(var i = 0; i < queue.length; i++) {
      var color = queue[i].color,
          x = queue[i].x,
          y = queue[i].y;
          down = queue[i].down;

      if (compressedQueue.length > 0 && 
          color == compressedQueue[compressedQueue.length-1].color &&
          !down) {
        current.x.push(x);
        current.y.push(y);
      } else {
        current = {color: color, x: [x], y: [y], down: down};
        compressedQueue.push(current);
      }
    }

    callback(compressedQueue);
  }

}

exports.Queue = Queue
