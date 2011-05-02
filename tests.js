var compressQueue = require("queue");
    
exports["smoke test"] = function (test) {
  var queue = new compressQueue.Queue(function (compressed) {}, 100);
  queue.feed({});
  test.done();
}
    
exports["done without data"] = function (test) {
  var queue = new compressQueue.Queue(function (compressed) {
    test.done();
  }, 100);
  queue.done();
}
    
exports["identity test"] = function (test) {
  test.expect(1);

  var simpleData = {color: "red", x: 0, y: 0, down: true};

  var queue = new compressQueue.Queue(function (compressed) {
    test.deepEqual(compressed, [{color: "red", x: [0], y: [0], down: true}]);
    test.done();
  }, 100);
  queue.feed(simpleData);
  queue.done();
}

exports["same data twice"] = function (test) {
  test.expect(1);

  var simpleData = {color: "red", x: 0, y: 0, down:false};

  var queue = new compressQueue.Queue(function (compressed) {
    test.deepEqual(compressed, [{color: "red", x: [0, 0], y: [0, 0], down:false}]);
    test.done();
  }, 100);

  queue.feed(simpleData);
  queue.feed(simpleData);
  queue.done();
}

exports["realistic example"] = function (test) {
  test.expect(1);

  var realData = [{color: "red", x: 0, y: 3, down: true},
                  {color: "red", x: 1, y: 2, down: false},
                  {color: "yellow", x: 2, y: 4, down: true}];

  var queue = new compressQueue.Queue(function (compressed) {
    test.deepEqual(compressed, [{color: "red", x: [0, 1], y: [3, 2], down: true},
                                {color: "yellow", x: [2], y: [4], down: true}]);
    test.done();
  }, 100);

  for(var i = 0; i < realData.length; i++) {
    queue.feed(realData[i]);
  }
  queue.done();
}

exports["test down"] = function (test) {
  test.expect(1);

  var realData = [{color: "red", x: 0, y: 3, down: true},
                  {color: "red", x: 1, y: 2, down: false},
                  {color: "red", x: 0, y: 3, down: true},
                  {color: "red", x: 1, y: 2, down: false},
                  {color: "yellow", x: 2, y: 4, down: false}];

  var queue = new compressQueue.Queue(function (compressed) {
    test.deepEqual(compressed, [{color: "red", x: [0, 1], y: [3, 2], down: true},
                                {color: "red", x: [0, 1], y: [3, 2], down: true},
                                {color: "yellow", x: [2], y: [4], down: false}]);
    test.done();
  }, 100);

  for(var i = 0; i < realData.length; i++) {
    queue.feed(realData[i]);
  }
  queue.done();
}


exports["timer"] = function (test) {
  test.expect(1);

  var realData = [{color: "red", x: 0, y: 3, down: true},
                  {color: "red", x: 1, y: 2, down: false},
                  {color: "yellow", x: 2, y: 4, down: false}];

  var queue = new compressQueue.Queue(function (compressed) {
    test.deepEqual(compressed, [{color: "red", x: [0, 1], y: [3, 2], down: true},
                                {color: "yellow", x: [2], y: [4], down: false}]);
    test.done();
  }, 1);

  for(var i = 0; i < realData.length; i++) {
    queue.feed(realData[i]);
  }
}
