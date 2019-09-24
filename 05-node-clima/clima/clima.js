const axios = require('axios-https-proxy-fix');

const getClima = async(latitud, longitud) => {

    let resp = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitud}&lon=${longitud}&units=metric&appid=6ff4a3d33fc6413031d9451c836483af`, {
        proxy: {
            host: 'proxy-epa',
            port: 3128
        }
    })
    return resp.data.main.temp;    I
}
module.exports = {
    getClima
}
