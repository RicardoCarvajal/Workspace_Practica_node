const fs = require('fs');
const colors = require('colors');

let crearArchivo = (base, limite = 10) => {
    return new Promise((resolve, reject) => {

        if (!Number(base)) {
            reject('No es un numero');
            return;
        }

        let data = '';

        for (let i = 1; i < limite; i++) {
            data += (`${base} * ${i} = ${base * i} \n`);
        }

        fs.writeFile(`tablas/file-${base}.txt`, data, (err) => {
            if (err) reject(err);
            else
            resolve(`tablas/file-${base}.txt`.green);
        })

    });
}

let listarTabla = (base,limite = 10) => {
    return new Promise((resolve, reject) => {

        if (!Number(base)) {
            reject('No es un numero');
            return;
        }

        let data = '';

        console.log('======================'.green);
        console.log(`Tabla de ${base}`.green);
        console.log('======================'.green);

        for (let i = 1; i < limite; i++) {
            console.log(`${base} * ${i} = ${base * i}`);
        }

    });
}

module.exports = {crearArchivo,listarTabla}

