const opt = {
    base: {
        demand: true,
        alias: 'b'
    },
    limite: {
        alias: 'l'
    }
}

const argv = require('yargs')
    .command('crear', 'Genera archivo con la tabla de multiplicar',opt)
    .command('listar', 'Imprime en consola la tabla de multiplicar',opt)
    .help()
    .argv;

module.exports = {
    argv
}