// requires socket.io-client and datauri
// npm install socket.io-client
// npm install datauri

// Point to file to read in and send
var fileToRead = __dirname + "/test.jpg";  // Path to image file

var interval = null;
var fs = require('fs'); 
// Change pointer to server.js
var socket = require('socket.io-client')('http://localhost:8080');
const DataURI = require('datauri');
const datauri = new DataURI();

socket.on('connect', function() {
	console.log("Socket Connected");
	socket.emit('who', 'pi');
	
	interval = setInterval(function() {

			datauri.encode(fileToRead, function (err, content) {
			  if (err) {
				  console.log(err);
			  }
		  
			  socket.emit('image', content);
			});
	
		}, 1000/30);
});

socket.on('disconnect', function() {
	clearInterval(interval);
});
