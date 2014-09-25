var express = require('express'),
  http = require('http'),
  path = require('path'),
  async = require('async'),
  gpio = require('pi-gpio'),
  app = express();

//set the port
app.set('port', process.env.PORT || 3000);

//serve static files from /static directory
app.use(express.static(path.join(__dirname, '/static')));

//create the server
var http = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//init socket.io
var io = require('socket.io')(http);

//the actual tank code starts here
//----------------------------------

//create the tank object
var tank = {

  //assign pin numbers to variables for later use
  motors: {
    leftFront: 11,
    leftBack: 12,
    rightFront: 15,
    rightBack: 16
  },

  //open the gpio pins and set them as outputs
  init: function(){
    gpio.open(this.motors.leftFront, "output");
    gpio.open(this.motors.leftBack, "output");
    gpio.open(this.motors.rightFront, "output");
    gpio.open(this.motors.rightBack, "output");
  },

  //for moving forward we power both motors  
  moveForward: function(){
    async.parallel([
      gpio.write(this.motors.leftFront, 1),
      gpio.write(this.motors.rightFront, 1)
    ]);
  },

  //for moving backward we power both motors but in backward mode
  moveBackward: function(){
    async.parallel([
      gpio.write(this.motors.leftBack, 1),
      gpio.write(this.motors.rightBack, 1)
    ]);
  },

  //for turning right we power the left motor 
  moveLeft: function(){
    gpio.write(this.motors.leftFront, 1);
  },

  //for turning left we power the right motor
  moveRight: function(){
    gpio.write(this.motors.rightFront, 1)
  },

  //stop both motors in all directions 
  stop: function(){
    async.parallel([
      gpio.write(this.motors.leftFront, 0),
      gpio.write(this.motors.leftBack, 0),
      gpio.write(this.motors.rightFront, 0),
      gpio.write(this.motors.rightBack, 0)
    ]);
  }
};

//listen for socket connection
io.sockets.on('connection', function(socket) {
  //listen for move signal
  socket.on('move', function(direction) {
    switch(direction){
     case 'up':
        tank.moveForward();
        break;
      case 'down':
        tank.moveBackward();
        break;
      case 'left':
        tank.moveLeft();
        break;
      case 'right':
        tank.moveRight();
        break;
    }
  });
  //listen for stop signal
  socket.on('stop', function(dir){
    tank.stop();
  });
});

tank.init();
