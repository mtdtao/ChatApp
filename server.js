var express = require('express');
var moment = require('moment');
var app = express();
var PORT = process.env.PORT || 3000;
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

var clientInfo = {};

function sendCurrentUsers(socket) {
	var info = clientInfo[socket.id];
	var users = [];

	if (typeof info === 'undefined') {
		return;
	}

	Object.keys(clientInfo).forEach(function(socketId) {
		var userInfo = clientInfo[socketId];
		if (userInfo.room === info.room) {
			users.push(userInfo.name);
		}
	})

	socket.emit('message', {
		name: 'System',
		text: 'Currentusers: ' + users.join(', '),
		timeStamp: moment.valueOf()
	})
}

io.on('connection', function(socket) {
	console.log('get connection');

	socket.on('disconnect', function() {
		var userData = clientInfo[socket.id];

		if (typeof userData !== 'undefined') {
			socket.leave(userData.room);
			io.to(userData.room).emit('message', {
				name: 'System',
				text: userData.name + ' has left the room.',
				timeStamp: moment.valueOf()
			})
			delete clientInfo[socket.id];
		}
	})

	socket.on('joinRoom', function(req) {
		clientInfo[socket.id] = req;

		socket.join(req.room);
		socket.broadcast.to(req.room).emit('message', {
			name: 'System',
			text: req.name + ' has join the room.',
			timeStamp: moment.valueOf()
		});
	});

	socket.on('message', function(message) {
		console.log('received message: ' + message.text);

		if (message.text === '@currentUsers') {
			sendCurrentUsers(socket);
		} else {
			message.timeStamp = moment().valueOf();
			io.to(clientInfo[socket.id].room).emit('message', message);
		}
	});

	socket.emit('message', {
		name: 'System',
		text: "this is the chat",
		timeStamp: moment().valueOf()
	});
})

http.listen(PORT, function() {
	console.log('Server start');
})
