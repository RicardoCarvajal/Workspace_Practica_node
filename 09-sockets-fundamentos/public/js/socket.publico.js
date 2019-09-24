var socket = io();

var lblticket1 = $('#lblTicket1');
var lblticket2 = $('#lblTicket2');
var lblticket3 = $('#lblTicket3');
var lblticket4 = $('#lblTicket4');

var lblescritorio1 = $('#lblEscritorio1');
var lblescritorio2 = $('#lblEscritorio2');
var lblescritorio3 = $('#lblEscritorio3');
var lblescritorio4 = $('#lblEscritorio4');

var lblTickets = [lblticket1, lblticket2, lblticket3, lblticket4];
var lblEscritorios = [lblescritorio1, lblescritorio2, lblescritorio3, lblescritorio4];

socket.on('estadoActual', function(data) {
    console.log(data);
    actualizarHTML(data.ultimos4);
});

socket.on('ultimos4', function(data) {
    console.log(data);
    var audio = new Audio('audio/new-ticket.mp3');
    audio.play();
    actualizarHTML(data.ultimos4);
});

function actualizarHTML(ultimos) {
    console.log(ultimos);
    for (let i = 0; i <= ultimos.length - 1; i++) {
        lblTickets[i].text('Ticket ' + ultimos[i].numero);
        lblEscritorios[i].text('Escritorio ' + ultimos[i].escritorio);
    }
}