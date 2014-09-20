var express = require('express');
var routes = require('./routes/index');
var http = require('http');
var path = require('path');
var logger = require('morgan');
var async = require('async');
var gpio = require('pi-gpio');

//tank vars
var _leftMotorFront  = 11;
var _leftMotorBack   = 12;
var _rightMotorFront = 15;
var _rightMotorBack  = 16;
var tank = {};

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use('/', routes);
app.use(express.static(path.join(__dirname, 'public')));

var http = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io')(http);

tank.initPins = function(){
  gpio.open(_leftMotorFront, "output");
  gpio.open(_leftMotorBack, "output");
  gpio.open(_rightMotorFront, "output");
  gpio.open(_rightMotorBack, "output");
};

tank.moveForward = function(){
  async.parallel([
    gpio.write(_leftMotorFront, 1),
    gpio.write(_rightMotorFront, 1)
  ]);
};

tank.moveBackward = function(){
  async.parallel([
    gpio.write(_leftMotorBack, 1),
    gpio.write(_rightMotorBack, 1)
  ]);
};

tank.turnLeft = function(){
  async.parallel([
    gpio.write(_leftMotorBack, 1),
    gpio.write(_rightMotorFront, 1)
  ]);
};

tank.turnRight = function(){
  async.parallel([
    gpio.write(_leftMotorFront, 1),
    gpio.write(_rightMotorBack, 1)
  ]);
};

tank.stopAllMotors = function(){
  async.parallel([
    gpio.write(_leftMotorFront, 0),
    gpio.write(_leftMotorBack, 0),
    gpio.write(_rightMotorFront, 0),
    gpio.write(_rightMotorBack, 0)
  ]);
};

io.sockets.on('connection', function(socket) {
  
  socket.on('keydown', function(dir) {
    switch(dir){
     case 'up':
        tank.moveForward();
        break;
      case 'down':
        tank.moveBackward();
        break;
      case 'left':
        tank.turnLeft();
        break;
      case 'right':
        tank.turnRight();
        break;
    }
  });

  socket.on('keyup', function(dir){
    tank.stopAllMotors();
  });

});

tank.initPins();

module.exports = app;
