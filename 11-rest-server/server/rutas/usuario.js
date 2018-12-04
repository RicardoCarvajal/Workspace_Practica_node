const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('underscore');
const Usuario = require('../modelos/usuario');
const {verificaToken} = require('../middlewares/auth')

const app = express();

app.get('/usuario', verificaToken ,function (req, res) {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Usuario.find({estado:true}, 'nombre email')
        .skip(desde)
        .limit(limite)
        .exec((err, usuarios) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            Usuario.countDocuments({estado:true}, (err, conteo) => {
                res.json({
                    ok: true,
                    usuarios,
                    conteo
                });

            })

        })

})

app.post('/usuario', function (req, res) {
    let body = req.body;

    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        clave: bcrypt.hashSync(body.clave, 10),
        role: body.role
    });

    usuario.save((err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        /* usuarioDB.clave = null; */

        res.json({
            ok: true,
            usuario: usuarioDB
        });
    });

})

app.put('/usuario/:id', function (req, res) {
    let id = req.params.id;
    let body = _.pick(req.body, ['nombre', 'email', 'img', 'role', 'estado']);

    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            usuario: usuarioDB
        });

    });


})

app.delete('/usuario/:id', function (req, res) {

    let id = req.params.id;

    let body = {
        estado:false
    }

    Usuario.findByIdAndUpdate(id, body, { new: true }, (err, usuarioDB) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            usuario: usuarioDB
        });

    });

})

/* app.delete('/usuario/:id', function (req, res) {
    
    let id = req.params.id;

    Usuario.findByIdAndRemove(id,(err,usuarioBorrado)=>{

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if (usuarioBorrado === null) {
            return res.status(400).json({
                ok: false,
                error:{
                    message:'Usuario no encontrado'
                }
            });
        }

        res.json({
            ok: true,
            message: 'El siguiente usuario esta borrado',
            usuarioBorrado
        });

    });

}) */

module.exports = app;