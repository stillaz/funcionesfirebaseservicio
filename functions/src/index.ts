import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as moment from 'moment-timezone';

admin.initializeApp(functions.config().firebase);

exports.nofitificacionNuevaReserva = functions.firestore
    .document('servicioscliente/{servicioId}')
    .onCreate(async event => {
        const reserva = event.data();
        const userId = reserva.idusuario;
        const cliente = reserva.cliente.nombre;
        const fecha = moment(reserva.fechaInicio.toDate());
        const dif = fecha.tz('America/Bogota').diff(new Date(), 'days');
        const textoDia = dif === 0 ? 'hoy' : dif === 1 ? 'mañana' : fecha.locale('es').format('[el] DD [de] MMMM');
        const texto = textoDia + fecha.locale('es').tz('America/Bogota').format(' [a las] hh:mm a');

        const payload = {
            notification: {
                title: 'Nueva cita',
                body: `${cliente} ha realizado una cita para ${texto}`,
                sound: 'default'
            }
        }

        const db = admin.firestore();

        const usuarioDoc = db.doc('usuarios/' + userId);

        const devices = await usuarioDoc.get();

        const token = devices.data().token;

        return admin.messaging().sendToDevice(token, payload);
    });

exports.notificacionCitaCancelada = functions.firestore
    .document('servicioscliente/{servicioId}')
    .onUpdate(async event => {
        let dataFilePath;
        let userId;
        let usuario;
        let imagen;
        let title;
        let body;
        let empresa = '';
        const db = admin.firestore();
        const reserva = event.after.data();
        const actualiza = reserva.actualiza;
        const fecha = moment(reserva.fechaInicio.toDate());
        const dif = fecha.tz('America/Bogota').diff(new Date(), 'days');
        const textoDia = dif === 0 ? 'hoy' : dif === 1 ? 'mañana' : fecha.locale('es').format(' DD [de] MMMM');
        switch (actualiza) {
            case 'cliente':
                dataFilePath = 'usuarios/';
                userId = reserva.idusuario;
                usuario = reserva.cliente.nombre;
                imagen = reserva.cliente.imagen ? reserva.cliente.imagen : '';
                break;
            case 'usuario':
                dataFilePath = 'clientes/';
                userId = reserva.cliente.correoelectronico;
                usuario = reserva.nombreusuario;
                imagen = reserva.imagenusuario ? reserva.imagenusuario : '';
                empresa = reserva.empresa ? reserva.empresa : empresa;
                break;
        }

        const usuarioDoc = db.doc(dataFilePath + userId);
        const devices = await usuarioDoc.get();
        const token = devices.data().token;

        switch (reserva.estado) {
            case 'Cancelado':
                const texto = textoDia + fecha.locale('es').tz('America/Bogota').format(' [a las] hh:mm a');
                title = 'Cita cancelada';
                body = `${usuario} ha cancelado la cita del ${texto}`;
                break;

            case 'Finalizado':
                title = 'Servicio finalizado';
                body = `${usuario} ha finalizado el servicio de ${reserva.servicio.nombre}`;
                break;
        }

        const payload = {
            notification: {
                title: title,
                body: body,
                sound: 'default'
            },
            data: {
                empresa: empresa,
                imagen: imagen,
                usuario: usuario,
                fechaservicio: fecha.locale('es').format('[el] dd [de] MMMM') + fecha.locale('es').tz('America/Bogota').format(' [a las] hh:mm a')
            }
        }
        return admin.messaging().sendToDevice(token, payload).then(() => {
            db.doc('servicioscliente/' + reserva.id).delete().catch(err => console.log('No fue posible eliminar el registro. Error: ' + err));;
        }).catch(err => console.log('No fue posible enviar la notificación. Error: ' + err));
    });

exports.registro = functions.https.onRequest((req, res) => {
    const negocio = req.query.negocio || 'Uknown';
    const empresa = req.query.empresa || 'Uknown';
    const direccion = req.query.direccion || 'Uknown';
    const ciudad = req.query.ciudad || 'Uknown';
    const barrio = req.query.barrio || 'Uknown';
    const telefono = req.query.telefono || 'Uknown';
    const contacto = req.query.contacto || 'Uknown';
    const telefonoContacto = req.query.telefonoContacto || 'Uknown';
    const correoContacto = req.query.correoContacto || 'Uknown';

    const db = admin.firestore();

    db.doc('servicioscliente').create({
        negocio: negocio,
        empresa: empresa,
        direccion: direccion,
        ciudad: ciudad,
        barrio: barrio,
        telefono: telefono,
        contacto: contacto,
        telefonoContacto: telefonoContacto,
        correoContacto: correoContacto
    }).then(() => {
        const html = '<h1>Se ha registrado el negocio.</h1><p>' +
            'Negocio: ' + negocio + '.<br/>' +
            'Empresa: ' + empresa + '.<br/>' +
            'Dirección: ' + direccion + '.<br/>' +
            'Ciudad: ' + ciudad + '.<br/>' +
            'Barrio: ' + barrio + '.<br/>' +
            'Teléfono: ' + telefono + '.<br/>' +
            'Contacto: ' + contacto + '.<br/>' +
            'Teléfono contacto: ' + telefonoContacto + '.<br/>' +
            'Correo contacto: ' + correoContacto + '.</p></br>' +
            '<a href="https://www.disoft.org/"><input type="button" value="Aceptar" /></a>';
        res.send(html);
    }).catch(err => {
        const html = '<h1>Ha ocurrido un error</h1><p>' +
            'No fue posible registrar la empresa, inténtalo más tarde. Error: ' +
            err + '</p></br>' +
            '<a href="https://www.disoft.org/"><input type="button" value="Aceptar" /></a>';
        res.send(html);
    });
});