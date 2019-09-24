// Comando para establecer la comunicacion

var socket = io();
var label = $('#lblNuevoTicket');

socket.on('connect', () => {
    console.log('Conectado al servidor');
});

socket.on('disconnect', () => {
    console.log('No hay conección con el servidor');
});

socket.on('estadoActual', (resp) => {

    console.log(resp);
    label.text(resp.actual)

});

/*Esto es jquery */
$('button').on('click', () => {
    socket.emit('siguienteTicket', null, (siguienteTicket) => {
        label.text(siguienteTicket);
    });
});