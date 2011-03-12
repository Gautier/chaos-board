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

function Pen(ctx, color, socket) {
  var last_point = {x: 0, y: 0};

  this.down = function (x, y) {
    last_point.x = x;
    last_point.y = y;

    if (socket) {
      socket.send({down: true, x: x, y: y, color: color});
    }
  }

  this.move = function (x, y) {
    drawPoint(x, y, color);

    last_point.x = x;
    last_point.y = y;

    if (socket) {
      socket.send({down: false, x: x, y: y, color: color});
    }
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

function setupCanvas(canvas) {
  var width = canvas.width = window.innerWidth;
  var height = canvas.height = window.innerHeight;
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
  var canvas = document.getElementById("c"),
      socket = new io.Socket("", {port: 6112}),
      ctx = setupCanvas(canvas),
      myPen = new Pen(ctx, prompt("What's your color?"), socket);

  document.ontouchstart = function (e) {
    var x = e.touches[0].pageX,
        y = e.touches[0].pageY;

    myPen.down(x, y);
  }

  document.ontouchmove = function (e) {
    var x = e.touches[0].pageX,
        y = e.touches[0].pageY;

    myPen.move(x, y)
  }

  var clicked = false;
  canvas.onclick = function (e) {
    clicked = !clicked;

    if (!clicked) return;

    e = normalizeEvent(e);
    var x = e.x,
        y = e.y;

    myPen.down(x, y)
  }

  canvas.onmousemove = function (e) {
    if (!clicked)  return;
    e = normalizeEvent(e);
    var x = e.x,
        y = e.y;

    myPen.move(x, y);
  }

  socket.on('connect', function(){
  });

  var pens = {};
  socket.on('message', function(data){
      var x = data.x,
          y = data.y;

      if (!(data.color in pens)) {
        pens[data.color] = new Pen(ctx, data.color);
      }
      var pen = pens[data.color];

      if (data.down) {
        pen.down(x, y);
      } else {
        pen.move(x, y);
      }
  });

  socket.on('disconnect', function(){
  });

  socket.connect();
}
