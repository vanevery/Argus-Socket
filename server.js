// HTTP Portion
var http = require('http');
var fs = require('fs'); // Using the filesystem module
var httpServer = http.createServer(requestHandler);
var url = require('url');
httpServer.listen(8080);

function requestHandler(req, res) {

	var parsedUrl = url.parse(req.url);
	console.log("The Request is: " + parsedUrl.pathname);
	
	// Read in the file they requested	
	fs.readFile(__dirname + parsedUrl.pathname, 
		// Callback function for reading
		function (err, data) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + parsedUrl.pathname);
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(data);
  		}
  	);
}

// Array of connected pis
var pis = [];

// Array of connected web users
var web = [];

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection', 
	// We are given a websocket object in our function
	function (socket) {
	
		console.log("We have a new client: " + socket.id);
	
		// Put in the appropriate array
		socket.on('who', function(data) {
			if (data == "pi") {
				console.log("We have a pi!");
				pis.push(socket);
			} else {
				console.log("Web Client");
				web.push(socket);

				// Send the list of pis to the client
				var pi_ids = [];
				for (var i = 0; i < pis.length; i++) {
					pi_ids.push(pis[i].id);
				}
				socket.emit("pis", pi_ids);
			}
		});
		
		// Web client wants specific high quality stream
		socket.on("highquality", function(pi_id) {
			socket.highquality_pi_id = pi_id;
		});

		// New image from a pi, send it out to all highqaulity subscribers
		socket.on("image", function(data) {
			console.log("got image");
			socket.lastimage = data;
			for (var i = 0; i < web.length; i++) {
				// Send image with pi_id and imagedata packed in object
				if (web[i].highquality_pi_id == socket.id) {
					web[i].emit("image", {"pi_id":socket.id, "imagedata":data});
				}
			}
		});	


		// Socket disconnected
		socket.on('disconnect', function() {
			var webindexToRemove = web.indexOf(socket);
			if (webindexToRemove > -1) {
				web.splice(webindexToRemove, 1);
			}
			
			var pisindexToRemove = pis.indexOf(socket);
			if (pisindexToRemove > -1) {
				pis.splice(pisindexToRemove, 1);
			}			
		});
	}
);

// Send out the images every 2 seconds
var lowQualityInterval = setInterval(function() {
	console.log("Sending low");
	for (var i = 0; i < pis.length; i++) {
		if (pis[i].lastimage) {
			for (var p = 0; p < web.length; p++) {
				if (pis[i].id != web[p].highquality_pi_id) {
					web[p].emit("image", {"pi_id":pis[i].id, "imagedata":pis[i].lastimage});
				}
			}
		}
	}
}, 2000);
