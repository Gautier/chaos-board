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
  var width = canvas.width = 800;
  var height = canvas.height = 600;
  return canvas.getContext("2d");
}

window.onload = function () {
  var canvas = document.getElementById("c"),
      socket = new io.Socket("", {port: 8000}),
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
    var x = e.x - canvas.offsetLeft,
        y = e.y - canvas.offsetTop;

    myPen.down(x, y)
  }

  canvas.onmousemove = function (e) {
    if (!clicked)  return;
    e = normalizeEvent(e);
    var x = e.x - canvas.offsetLeft,
        y = e.y - canvas.offsetTop;

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
