const descripcion = {
    demand: true,
    alias: 'd',
    desc: 'Descripcion de la tarea'
}

const completado = {
    demand: true,
    default: true,
    alias: 'c',
    desc: 'Marca como completado la tarea'
}


const argv = require('yargs')
    .command('crear', 'crea nueva tarea', {descripcion})
    .command('actualizar', 'actualiza tarea', {descripcion,completado})
    .command('listar', 'listado de tareas')
    .command('borrar', 'borra una tarea', {descripcion})
    .help()
    .argv;

module.exports = {
    argv
}