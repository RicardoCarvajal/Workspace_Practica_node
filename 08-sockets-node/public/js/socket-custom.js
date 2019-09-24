var socket = io();

socket.on('connect', function() {
    console.log('Conectado al servidor');
});

socket.on('disconnect', function() {
    console.log('Perdimos conexion con el servidor');
});

socket.emit('enviarMensaje', {
    usuario: 'Ricardo',
    mensaje: 'Soy el usuario'
}, function(resp) {
    console.log('Respuesta server: ', resp);
});

socket.on('enviarMensaje', (mensaje) => {
    console.log(mensaje);
});