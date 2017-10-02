var BBCMicrobit = require('bbc-microbit');
const fs = require('fs');
const path = require('path');

var microbitConnected = false;

var BUTTON_VALUE_MAPPER = ['Not Pressed', 'Pressed', 'Long Press'];

console.log('*** BBC micro:bit Scratch extension ***')

var http = require('http');

var app = http.createServer(function(req, res) {
  console.log('http: read ' + req.url);
  const map = {
    '.xml': 'application/xml',
    '.js': 'application/javascript',
    '.sbx': 'application/octet-stream'
  };
  const ext = path.parse(req.url).ext;

  fs.readFile(__dirname + req.url, function(err, data) {
    if (err) {
      res.statusCode = 404;
      res.end();
    } else {
      res.setHeader('Content-type', map[ext] || 'text/plain');
      res.end(data);
    }
  });
});

var io = require('socket.io').listen(app.listen(3000));

io.on('connection', function(socket) {
  console.log('socket: connected');

  socket.emit('socket: connected');
  socket.emit('microbit: connected', microbitConnected);
});


console.log('socket: listening');

function microbitFound(microbit) {
  console.log('microbit: discovered %s', microbit.address);

  microbit.on('disconnect', function() {
    microbitConnected = false;
    console.log('microbit: connected ' + microbitConnected);
    io.sockets.emit('microbit: connected', microbitConnected);
    microbitScanner();
  });

  microbit.on('buttonAChange', function(value) {
    console.log('microbit: button A', BUTTON_VALUE_MAPPER[value]);
    io.sockets.emit('microbit: button A', value);
  });

  microbit.on('buttonBChange', function(value) {
    console.log('microbit: button B', BUTTON_VALUE_MAPPER[value]);
    io.sockets.emit('microbit: button B', value);
  });

  console.log('microbit: connecting...');
  microbit.connectAndSetUp(function() {
    microbitConnected = true;
    console.log('microbit: connected ' + microbitConnected);
    console.log('microbit: subscribing to buttons...');
    microbit.subscribeButtons(function() {
      console.log('microbit: subscribed to buttons');
      io.sockets.emit('microbit: connected', microbitConnected);
    });
  });
};

function microbitScanner() {
  console.log('microbit: scanning...');
  BBCMicrobit.discover(microbitFound);
};

microbitScanner();
