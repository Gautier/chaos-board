function normalizeEvent (e) {
  var ev = {x: 0, y: 0};
  if (!e) var e = window.event;
  if (e.pageX || e.pageY)   {
    ev.x = e.pageX;
    ev.y = e.pageY;
  } else if (e.clientX || e.clientY)  {
    ev.x = e.clientX + document.body.scrollLeft
      + document.documentElement.scrollLeft;
    ev.y = e.clientY + document.body.scrollTop
      + document.documentElement.scrollTop;
  }
  return ev;
}

function parseCoords (location) {
  var coords = location.hash.substr(1).split(",");
  if (coords.length == 2) {
    coords[0] = +coords[0];
    coords[1] = +coords[1];

    if (coords[0] != NaN && coords[1] != NaN) {
      return {x: coords[0], y: coords[1]};
    }
  }

  return {x: 0, y: 0};
}


function Pen(ctx, startColor) {
  var last_point = {x: 0, y: 0};
  var color = startColor;

  this.setColor = function (newColor) {
    color = newColor;
  }

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

var DEFAULT_COLOR = "red";
var myPen = null;

(function (window) {
  var canvas = null,
      windowWidth = null,
      windowHeight = null,
      coords = parseCoords(document.location);

  window.myColor = DEFAULT_COLOR;

  function onChangedCoords() {
    coords = parseCoords(document.location);

    // TODO: redraw
  }

  function setupCanvas() {
    var width = canvas.width = windowWidth;
    var height = canvas.height = windowHeight;
    var ctx = canvas.getContext("2d");

    /*
     * http://code.google.com/p/chromium/issues/detail?id=59446
     */
    function chromeOnResizeFix(F) {
      var resizeList = {};

      return function () {
        var newWidth = window.innerWidth,
            newHeight = window.innerHeight;

        var resizeKey = "" + newWidth + newHeight + width + height;
        if (!resizeKey in resizeList) {
          resizeList[resizeKey] = true;
        }

        resizeList[resizeKey] = !resizeList[resizeKey];
        if (resizeList[resizeKey]) {
          return;
        }

        return F(newWidth, newHeight);
      }
    }

    function filterProperResize(F) {
      return function (newWidth, newHeight) {
        if (newWidth == width && newHeight == height)
          return;

        if (newWidth == 0 || newHeight == 0)
          return;

        return F(newWidth, newHeight);
      };
    }

    window.onresize = chromeOnResizeFix(filterProperResize(function (newWidth, newHeight) {
      var img = new Image();
      img.src = canvas.toDataURL();
      img.onload = function () {
        canvas.width = newWidth;
        canvas.height = newHeight;

        var sw = Math.min(newWidth, width);
        var sh = Math.min(newHeight, height);

        ctx.drawImage(img, 0, 0, sw, sh, 0, 0, sw, sh);

        width = newWidth;
        height = newHeight;
      }
    }));

    return ctx;
  }

  window.onload = function () {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    canvas = document.getElementById("c");

    initBoard();
  }

  function initBoard () {
    var socket = new io.Socket("", {port: 8000}),
        ctx = setupCanvas();

    myPen = new Pen(ctx, myColor, socket);

    document.ontouchstart = function (e) {
      if (e.target != canvas) return;
      var x = e.touches[0].pageX,
          y = e.touches[0].pageY;

      myPen.down(x, y);
      socket.send({down: true,
                   x: x + coords.x,
                   y: y + coords.y,
                   color: myColor});
    }

    document.ontouchmove = function (e) {
      if (e.target != canvas) return;

      var x = e.touches[0].pageX,
          y = e.touches[0].pageY;

      myPen.move(x, y)
      socket.send({down: false,
                   x: x + coords.x,
                   y: y + coords.y,
                   color: myColor});
      e.preventDefault() ;
    }

    var clicked = false;
    canvas.onclick = function (e) {
      clicked = !clicked;

      if (!clicked) return;

      e = normalizeEvent(e);
      var x = e.x,
          y = e.y;

      myPen.down(x, y)
      socket.send({down: true,
                   x: x + coords.x,
                   y: y + coords.y,
                   color: myColor});
    }

    canvas.onmousemove = function (e) {
      if (!clicked)  return;
      e = normalizeEvent(e);
      var x = e.x,
          y = e.y;

      myPen.move(x, y);
      socket.send({down: false,
                   x: x + coords.x,
                   y: y + coords.y,
                   color: myColor});
    }

    socket.on('connect', function(){
      // XXX bad way of doing this, look into backbone.js etc.
      var boardId = document.location.pathname.split("/")[2];
      socket.send({command: "connect", boardId: boardId});
    });

    var pens = {};
    socket.on('message', function(data){
        if (!(data.color in pens)) {
          pens[data.color] = new Pen(ctx, data.color);
        }
        var pen = pens[data.color];

        pen.down(data.x[0] - coords.x, data.y[0] - coords.y);
        for(var i = 1; i < data.x.length; i++) {
          pen.move(data.x[i] - coords.x, data.y[i] - coords.y);
        }
    });

    socket.on('disconnect', function(){
    });

    socket.connect();
  }
})(window);
