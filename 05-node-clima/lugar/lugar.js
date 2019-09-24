const axios = require('axios-https-proxy-fix');

const getLugarLatLng = async (direccion) => {

    let direcionBusqueda = encodeURI(direccion);

    let resp = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${direcionBusqueda}&key=AIzaSyDzbQ_553v-n8QNs2aafN9QaZbByTyM7gQ`, {
        proxy: {
            host: 'proxy-epa',
            port: 3128
        }
    })

    if (resp.data.status === 'ZERO_RESULTS') {
        throw new Error(`No hay resultados para la ciudad: ${direccion}`);
    }

    let latitudResp = resp.data.results[0].geometry.location.lat;
    let longitudResp = resp.data.results[0].geometry.location.lng;
    let direccionResp = resp.data.results[0].formatted_address;

    return {
        direccion: direccionResp,
        lag: latitudResp,
        lgn: longitudResp
    }

    I
}

module.exports = {
    getLugarLatLng
}


///SIN PROXY
/* axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${direcionBusqueda}&key=AIzaSyDzbQ_553v-n8QNs2aafN9QaZbByTyM7gQ`)
    .then(resp => {
        console.log(resp.data);
    })
    .catch(e => console.log('ERROR!!!', e)); */


