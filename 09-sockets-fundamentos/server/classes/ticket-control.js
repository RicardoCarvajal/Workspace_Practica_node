const fs = require('fs');

class Ticket {

    constructor(numero, escritorio) {

        this.numero = numero;
        this.escritorio = escritorio;

    }


}

class TicketControl {

    constructor() {
        this.ultimo = 0;
        this.hoy = new Date().getDate();
        this.tickets = [];
        this.ultimos = [];

        let data = require('../data/data.json');

        if (data.hoy === this.hoy) {

            this.ultimo = data.ultimo;
            this.tickets = data.tickets;
            this.ultimos = data.ultimos;

        } else {
            this.reiniciarConteo();
        }
    }

    reiniciarConteo() {

        this.ultimo = 0;
        this.tickets = [];
        this.ultimos = [];

        console.log('Se inicializa la aplicación');

        this.grabarArchivo();

    }

    siguiente() {

        this.ultimo = this.ultimo + 1;
        let ticket = new Ticket(this.ultimo, null);
        this.tickets.push(ticket);
        this.grabarArchivo();
        return `Ticket ${this.ultimo}`;

    }

    getUltimos() {
        return this.ultimos;
    }

    getUltimoTicket() {
        return `Ticket ${this.ultimo}`;
    }

    atenderTicket(escritorio) {

        if (this.tickets.length === 0) {

            return 'No hay mas tickets';

        }

        let numeroTicket = this.tickets[0].numero;

        this.tickets.shift();

        let atenderTicket = new Ticket(numeroTicket, escritorio);

        console.log(atenderTicket);

        this.ultimos.unshift(atenderTicket);

        if (this.ultimos.length > 4) {
            this.ultimos.splice(-1, 1);
        }

        console.log('Ultimos 4:');
        console.log(this.ultimos);

        this.grabarArchivo();

        return atenderTicket;

    }

    grabarArchivo() {
        let jsonData = {
            ultimo: this.ultimo,
            hoy: this.hoy,
            tickets: this.tickets,
            ultimos: this.ultimos
        };

        let jsonDataString = JSON.stringify(jsonData);

        fs.writeFileSync('./server/data/data.json', jsonDataString);
    }

}

module.exports = {
    TicketControl
}