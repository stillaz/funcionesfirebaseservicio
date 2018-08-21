import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

exports.newSubscriberNotification = functions.firestore
    .document('servicioscliente/{servicioId}')
    .onCreate(async event => {
        const reserva = event.data();
        const userId = reserva.idusuario;
        const cliente = reserva.cliente.nombre;

        const payload = {
            notification: {
                title: 'Nueva reserva',
                body: `${cliente} ha realizado una reserva el día `,
                icon: 'https://goo.gl/Fz9nrQ'
            }
        }

        const db = admin.firestore();

        const usuarioDoc = db.doc('usuarios/' + userId);

        const devices = await usuarioDoc.get();

        const token = devices.data().token;

        return admin.messaging().sendToDevice(token, payload);
    });
