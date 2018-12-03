let empleados = [
    { id: 1, nombre: 'Ricardo' }, { id: 2, nombre: 'Jose' }, { id: 3, nombre: 'Mario' }
];

let salarios = [
    { id: 1, salario: 10000 }, { id: 2, salario: 13000 }
];

/* let getEmpleado = (id) => {

    return new Promise((resolve, reject) => {

        let empleadoDB = empleados.find(empleado => empleado.id === id)

        if (!empleadoDB) {
            reject(`No existe el empleado ID: ${id}`);
        } else {
            resolve(empleadoDB);
        }

    });

} */


let getEmpleado = async (id) => {

    let empleadoDB = empleados.find(empleado => empleado.id === id)

    if (!empleadoDB) {
        throw new Error(`No existe el empleado ID: ${id}`);
    } else {
        return empleadoDB;
    }
}


/* let getSalario = (empleado) => {

    return new Promise((resolve, reject) => {

        let salarioDB = salarios.find(salario => salario.id === empleado.id);

        if (!salarioDB) {
            reject(`No existe el salario para el usuario id: ${empleado.id}`);
        } else {
            resolve({
                nombre: empleado.nombre,
                salario: salarioDB.salario
            });
        }

    });

} */


let getSalario = async (empleado) => {

    let salarioDB = salarios.find(salario => salario.id === empleado.id);

    if (!salarioDB) {
        throw new Error(`No existe el salario para el usuario id: ${empleado.id}`);
    } else {
        return {nombre: empleado.nombre,salario: salarioDB.salario};
    }



}


let getInformacion = async (id) => {

    let empleado = await getEmpleado(id);

    let resp = await getSalario(empleado);

    return `${resp.nombre} tiene un salario de ${resp.salario}`;
}

getInformacion(1).then(mensaje => console.log(mensaje)).catch(err => console.log(err));

