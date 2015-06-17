
///SERVIDOR
var static = require('node-static');
var http = require('http');
var file = new(static.Server)();


var app = http.createServer(function (req, res) {
	if(req.url === '/'){
		file.serveFile('/index.html', 200, {}, req, res);
	}else if (req.url.substring(1, 6) === 'room=') {
        file.serveFile('/room.html', 200, {}, req, res);
    } else {
        file.serve(req, res, function(error, errorRes) {
            if (error && (error.status === 404)) {
                file.serveFile('/nofichero.html', 404, {}, req, res);
            }
        });
    }
}).listen(process.env.PORT || 5000);

/////VARIABLES E INICIO TRADUCCION

var numClients = 0;
var MsTranslator = require('mstranslator');
var client = new MsTranslator({client_id: 'client_id', client_secret: 'client_secret='});
client.initialize_token();
var rooms = {};

///INICIO SERVIDOR

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket){

	var clientAddress = socket.handshake.address;

	socket.on('sign in', function (username, room) {

		if (!username || !room) {
            console.log('$ Error en los parametros');
            socket.disconnect();
        } else {
            console.log('$ El usuario' + username, +' quiere entrar en la sala ' + room);
            //Se crea la room si no esta creada
            if (rooms[room] === undefined) {
                console.log('$ La sala ' + room  + 'ha sido creada');
                rooms[room] = {};
                socket.join(room);
                socket.emit('created', room);
                rooms[room][username] = socket;
                rooms[room]['nusers'] = 1;

            } else if (Object.keys(rooms[room]).indexOf(username) !== -1) {// mirar si el usuario esta dentro de la room
                console.log('$ El nombre de usuario ' + username + ' ya se está usando en la sala ' + room);
                socket.emit('username used', username, room);
                socket.disconnect();

            } else {

                if(rooms[room]['nusers'] ==1){
                    console.log('$ El  usuario '+ username + ' ha entrado en la sala ' + room);
                    io.sockets.in(room).emit('join', username, room);
                    socket.join(room);
                    socket.emit('joined', room, Object.keys(rooms[room]));
                    rooms[room][username] = socket;
                    rooms[room]['nusers'] ++;
                    console.log(rooms);

                }else{
                    socket.emit('full room', username, room);
                    console.log('$ La sala ' + room + ' está llena');
                }

            }
        }
    });


	socket.on('message', function (message) {
		console.log('message: ', message.room , message.type);
		if(message.type === 'translate'){

                console.log(message.from + " " + message.to);
                var params = {
                    text: message.text,
                    from: message.from,
                    to: message.to
                };

                client.translate(params, function(err, data) {
										console.log("translate " + data);
                    rooms[message.room][message.user].emit('translation',{text: data});
                });

		}else{

			if(message.type == 'end'){
				console.log(message);
				delete rooms[message.room][message.user];

				rooms[message.room]['nusers'] --;

				if(rooms[message.room]['nusers'] == 0){
					delete rooms[message.room];
				}else{
					console.log("sending end message");
					socket.broadcast.to(message.room).emit('end', message);
				}
				socket.leave(message.room);
				console.log(rooms);
			}

			if(message.type === 'offer' || message.type === 'answer'){
				socket.broadcast.to(message.room).emit('message', message.msg);
			}else{
				socket.broadcast.to(message.room).emit('message', message);
			}

		}


	});

});
