const argv = require('./config/yargs').argv;
const color = require('colors');
const porHacer = require('./hacer/doit');

let comando = argv._[0];

switch (comando) {
    case 'crear':
        let tarea = porHacer.crear(argv.descripcion);
        console.log(tarea);
        break;
    case 'listar':
        let listado = porHacer.getListado();

        for (const tarea of listado) {
            console.log('=========== Por hacer ============'.green);
            console.log(tarea.descripcion);
            console.log('Estado: ', tarea.completado);
            console.log('=================================='.green);
        }


        break;
    case 'actualizar':
        console.log(porHacer.actualizar(argv.descripcion, argv.completado));
        break;

    case 'borrar':
        let borrado = porHacer.borrar(argv.descripcion)
        console.log(borrado);
        break;

    default:
        console.log('Comando invalido');
        break;
}