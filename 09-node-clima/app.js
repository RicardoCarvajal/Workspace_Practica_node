const lugar = require('./lugar/lugar');
const clima = require('./clima/clima');
const argv = require('yargs').options({
    direccion: {
        alias: 'd',
        desc: 'Direccion de la ciudad para obtener el clima',
        demand: true
    }
}).argv;

let getInfo = async (direccion) => {

    try {

        let coors = await lugar.getLugarLatLng(argv.direccion);

        let temp = await clima.getClima(coors.lag, coors.lgn);

        return `El clima en ${coors.direccion} es de ${temp}`;

    } catch (error) {

        return `No se pudo determinar el clima en ${direccion}`

    }


}

getInfo(argv.direccion)
    .then(resp => console.log(resp))
    .catch(err => console.log(err));


