const { io } = require('../server');

io.on('connection', (client) => {
    console.log('Usuario conectado');

    client.emit('enviarMensaje', {
        usuario: 'Administrador',
        mensaje: 'Bienvenido'
    });

    client.on('disconnect', () => {

        console.log('Usuario desconectado');

    });

    client.on('enviarMensaje', (mensaje, callback) => {
        console.log(mensaje);

        if (mensaje.usuario) {
            callback({
                resp: 'TODO BIEN'
            });
        } else {
            callback({
                resp: 'ALGO VA MAL'
            });
        }
    })

});