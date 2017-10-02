var BBCMicrobit = require('bbc-microbit')

var microbitConnected = false;

var BUTTON_VALUE_MAPPER = ['Not Pressed', 'Pressed', 'Long Press'];

console.log('*** BBC micro:bit Scratch extension ***')

var http = require('http'),
    fs = require('fs'),
    index = fs.readFileSync(__dirname + '/scratch_microbit.js');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/javascript'});
    res.end(index);
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
