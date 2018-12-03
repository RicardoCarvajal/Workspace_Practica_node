let empleados = [
    {id:1,nombre:'Ricardo'},{id:2,nombre:'Jose'},{id:3,nombre:'Mario'}
];

let salarios = [
    {id:1,salario:10000},{id:2,salario:13000}
];

let getEmpleado = (id) => {

    return new Promise((resolve, reject) => {

        let empleadoDB = empleados.find(empleado => empleado.id === id)

        if (!empleadoDB) {
            reject(`No existe el empleado ID: ${id}`);
        }else{
            resolve(empleadoDB);
        }

    });

}

let getSalario = (empleado) =>{

    return new Promise((resolve, reject) => {

        let salarioDB = salarios.find(salario => salario.id === empleado.id);

        if(!salarioDB){
            reject(`No existe el salario para el usuario id: ${empleado.id}`);
        }else{
            resolve({
            nombre: empleado.nombre,
            salario: salarioDB.salario
        });
    }

    });

}

//getEmpleado(1).then(empleado =>{
//    getSalario(empleado).then(informacion => {
//        console.log('La informacion del salario es: ',informacion);
//    },(err) => {
//        console.log(err);  
//    });
//  },(err) => {
//      console.log(err);
//  });

getEmpleado(1).then(empleado => {
    return getSalario(empleado);
}).then(resp => {
    console.log(`El salario de ${resp.nombre} es de ${resp.salario}`);
}).catch(err => {
    console.log(err);
});

