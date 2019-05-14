let empleados = [
    { id: 1, nombre: 'Ricardo' }, { id: 2, nombre: 'Jose' }, { id: 3, nombre: 'Mario' }
];

let salarios = [
    { id: 1, salario: 10000 }, { id: 2, salario: 13000 }
];

let getEmpleado = (id, callback) => {

    let empleadoDB = empleados.find(empleados => empleados.id === id)

    if (!empleadoDB) {
        callback(`No existe el empleado ID: ${id}`, null);
    } else {
        callback(null, empleadoDB);
    }

}

let getSalario = (empleado, callback) => {
    let salarioDB = salarios.find(salario => salario.id === empleado.id);

    //let data = `{nombre:${empleado.nombre} , salario:${salarioDB.salario}}`; 

    if (!salarioDB) {
        callback(`No existe el salario para el usuario id: ${empleado.id}`);
    } else {
        //callback(null,data);
        callback(null, {
            nombre: empleado.nombre,
            salario: salarioDB.salario
        });
    }

}

getEmpleado(1, (err, empleados) => {
    if (err) {
        console.log(err);
    } else {
        getSalario(empleados, (err, salario) => {
            if (err) {
                console.log(err);
            } else {
                console.log(salario);
            }

        })
    }
});