const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let Schema = mongoose.Schema;

let tiposValidos = {
    values: ['C','S','D'],
    message: '{value} no es un tipo valido'
};

let categoriaSchema = new Schema({
    nombre:{
        type: String,
        required: [true, 'El nombre de la categoria es necesario'],
        unique: true
    },
    codigo: {
        type: Number,
        required: [true, 'Se requiere un codigo para la categoria'],
        unique: true
    },
    tipo:{
        type: String,
        required: [true, 'El tipo de la categoria es requerido'],
        enum: tiposValidos
    },
    activo:{
        type: Boolean,
        default: true
    }

});

categoriaSchema.plugin(uniqueValidator,{message: '{PATH} debe ser el único'})

module.exports = mongoose.model('Categoria',categoriaSchema);