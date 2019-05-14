/*Los callbacks se podrian deir que son funciones que llamamos dentros de una  funcion y se ejecutan
cuando la funcion padre termisna el proceso*/

/*El manejo de callbacks se utiliza para el manejo de la asincronia de javascript 
ya que las funciones hijas solo se pueden ejecutar luego de las funciones padres y
dentro de las funciones padres*/


/*EJEMPLO:

Tenemos dos array uno llamado nombre y otro empleado

*/

let empleados = [
    { id: 1, nombre: 'Parck' }, { id: 2, nombre: 'Jose' }, { id: 3, nombre: 'Patiño' }
];

let salarios = [
    { id: 1, salario: 10000 }, { id: 2, salario: 13000 }
];

/*Tenemos una funcion getEmpleado() con un callback [llamado asi por convencion pero podria tener otro nombre] 
el callback no se declara aqui sino cuando se hace el llamado de la funcion getEmpleado()
*/

let getEmpleado = (id, callback) => {

    /*Aqui tenemos una funcion deflecha
    la misma cuenta de un parametro
    y como solo cuenta de una linea de sentencia
    se omite la palabra return.
    La funcion find del array 'empleados' recibe
    un callback que es esta funcion de flecha
    la cual recibe el mismo array de parametro
    y luego verifica si hay algun id dentro de este
    array que se iguale al id pasado por parametro
    en la funcion getEmpleado() y retorna el objeto 
    del array indicado*/
    let empleadoDB = empleados.find((empleados) => empleados.id === id)

    if (!empleadoDB) {
        /*Aqui se pasan los parametros indicados en el 
        callback declarado al llamar la funcion getEmpleado
        si el empleado no existe se ingresa datos en un parametro
        si no se ingresa los datos en otro*/
        callback(`No existe el empleado ID: ${id}`, null);
    } else {
        callback(null, empleadoDB);
    }

}

/*Tenemos otra funcion que recibe como parametro otro callack, la funcion getSalario se
llamara dentro de la funcion getEmpleado() mas adelante 
 */
let getSalario = (empleado, callback) => {

    let salarioDB = salarios.find(salario => salario.id === empleado.id);

    if (!salarioDB) {
        callback(`No existe el salario para el usuario id: ${empleado.id}`);
    } else {
        callback(null, {
            nombre: empleado.nombre,
            salario: salarioDB.salario
        });
    }
}

/*Tenemos el llamado de la funcion getEmpleado() */

getEmpleado(1, (err, empleado) => {
    if (err) {
        console.log(err);
    } else {
        getSalario(empleado, (err, empleadoSalario) => {
            if (err) {
                console.log(err);
            } else {
                console.log(empleadoSalario);
            }
        })
    }
})