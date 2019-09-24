const express = require('express');
const Categoria = require('../modelos/categoria');
const _ = require('underscore');
const { verificaToken, verificaAdminRole } = require('../middlewares/auth');

let app = express();

////////////////////////////////
//Mostrar toda las categoria
////////////////////////////////

app.get('/categoria', verificaToken, (req, res) => {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 0;
    limite = Number(limite);

    Categoria.find({})
        .sort('nombre')
        .skip(desde)
        .limit(limite)
        .exec((err, categorias) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            Categoria.countDocuments({}, (err, conteo) => {
                res.json({
                    ok: true,
                    categorias,
                    conteo
                })
            });
        });
});

////////////////////////////////
//Mostrar una categoria por ID
////////////////////////////////

app.get('/categoria/:id', verificaToken, (req, res) => {

    let id = req.params.id;

    Categoria.findById(id).exec((err, categoriaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if (!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'La categoria no existe'
                }
            });
        }
        res.json({
            ok: true,
            categoria: categoriaDB
        })
    });

});

////////////////////////////////
//Crear una nueva categoria
////////////////////////////////

app.post('/categoria', verificaToken, (req, res) => {

    let body = req.body;

    let categoria = new Categoria({
        nombre: body.nombre,
        codigo: body.codigo,
        tipo: body.tipo,
        activo: body.activo
    });

    categoria.save((err, categoriaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            categoriaDB
        });


    });

});

////////////////////////////////
//Modificar una categoria
////////////////////////////////

app.put('/categoria/:id', [verificaToken, verificaAdminRole], (req, res) => {

    let id = req.params.id;
    let body = _.pick(req.body, ['activo']);

    Categoria.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, categoriaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            categoria: categoriaDB
        });
    });


});

////////////////////////////////
//Eliminar una categoria
////////////////////////////////

app.delete('/categoria/:id', [verificaToken, verificaAdminRole], (req, res) => {

    let id = req.params.id;

    Categoria.findByIdAndRemove(id, (err, categoriaBorrada) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if (categoriaBorrada === null) {
            return res.status(400).json({
                ok: false,
                error: {
                    message: 'Categoria no encontrada'
                }
            });
        }

        res.json({
            ok: true,
            message: 'La siguiente categoria esta borrada',
            categoriaBorrada
        });

    });

});

module.exports = app;