"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
exports.newSubscriberNotification = functions.firestore
    .document('servicioscliente/{servicioId}')
    .onCreate((event) => __awaiter(this, void 0, void 0, function* () {
    const reserva = event.data();
    const userId = reserva.idusuario;
    const cliente = reserva.cliente.nombre;
    const payload = {
        notification: {
            title: 'Nueva reserva',
            body: `${cliente} ha realizado una reserva el día `,
            icon: 'https://goo.gl/Fz9nrQ'
        }
    };
    const db = admin.firestore();
    const usuarioDoc = db.doc('usuarios/' + userId);
    const devices = yield usuarioDoc.get();
    const token = devices.data().token;
    return admin.messaging().sendToDevice(token, payload);
}));
//# sourceMappingURL=index.js.map