//==============================================
// Puertos
//==============================================

process.env.PORT = process.env.PORT || 3000;

//==============================================
// Entorno
//==============================================

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

//==============================================
// Puertos
//==============================================

let urlDB;

if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/credix';
} else {
    urlDB = 'mongodb://<123456a*>:<123456a*>@ds019946.mlab.com:19946/testdbmon';
}

process.env.URLDB = urlDB;