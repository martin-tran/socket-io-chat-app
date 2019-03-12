var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var utils = require('./utils');

var history = [];
var currentUsers = new Map();
var nameChangeRegex = /^\/nick /;
var nameChangeRegexGroup = /^\/nick (.+)/;
var colorChangeRegex = /^\/nickcolor/;
var colorChangeRegexGroup = /^\/nickcolor ([A-F0-9]{6})/;

var a = true;

dateToReadableString_ = (time) =>
    (('0' + time.getHours()).substr(-2) + ':' +
     ('0' + time.getMinutes()).substr(-2) + ':' +
     ('0' + time.getSeconds()).substr(-2));

printMessage = (message) =>
    message.user + '@' + dateToReadableString_(message.time) + ' - ' + message.body;

    
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('new user', () => {
	var newUser = {
	    userID: socket.id,
	    color: '000000'
	};
	currentUsers.set(socket.id, newUser);
	socket.emit('new user registered', newUser);
	socket.emit('user list', {
	    list: Array.from(currentUsers.values())
	});
	history.forEach((message) => {
		socket.emit('chat message', utils.printMessage(message));
	})
    });

    socket.on('returning user', (user) => {
	currentUsers.set(socket.id, user);
	socket.emit('user list', {
	    list: Array.from(currentUsers.values())
	});
	history.forEach((message) => {
	    if (message.userID === user.userID)
		socket.emit('chat message', utils.printBoldMessage(message));
	    else
		socket.emit('chat message', utils.printMessage(message));
	})
    });

    socket.on('disconnect', () => {
	io.emit('user disconnected', currentUsers.get(socket.id));
	currentUsers.delete(socket.id);
    });

    socket.on('announce user joined', (user) => {
	socket.broadcast.emit('announce user joined', user);
    });

    socket.on('chat message', (msg) => {
	if (msg.body.match(nameChangeRegex)) {
	    var newName = msg.body.match(nameChangeRegexGroup);
	    var valid = true;
	    currentUsers.forEach((user) => {
		console.log(user.userID);
		console.log(newName);
		if (user.userID === newName[1])
		    valid = false;
	    });
	    if (newName && valid) {
		socket.emit('name change success', newName[1]);
		socket.broadcast.emit('name change event', {
		    prev: {
			userID: currentUsers.get(socket.id).userID,
			color: currentUsers.get(socket.id).color
		    },
		    cur: {
			userID: newName[1],
			color: currentUsers.get(socket.id).color
		    }
		});
		currentUsers.get(socket.id).userID = newName[1];
	    } else {
		socket.emit('name change fail');
	    }
	} else if (msg.body.match(colorChangeRegex)) {
	    var newColor = msg.body.match(colorChangeRegexGroup);
	    if (newColor) {
		socket.emit('color change success', newColor[1]);
		socket.broadcast.emit('color change event', {
		    prev: {
			userID: currentUsers.get(socket.id).userID,
			color: currentUsers.get(socket.id).color
		    },
		    cur: {
			userID: currentUsers.get(socket.id).userID,
			color: newColor[1]
		    }
		});
		currentUsers.get(socket.id).color = newColor[1];
	    } else {
		socket.emit('color change fail');
	    }
	} else {
	    var message = {
		userID: msg.userID,
		color: msg.color,
		body: msg.body,
		time: new Date()
	    }
	    socket.emit('chat message', utils.printBoldMessage(message));
	    socket.broadcast.emit('chat message', utils.printMessage(message));
	    history.push(message);
	}
    });
});


http.listen(3000, () => {
    console.log('listening on *:3000');
});

