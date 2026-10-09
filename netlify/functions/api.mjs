// Backend UniLink (server/server.js) ejecutándose como Netlify Function.
// El estado de la base se guarda en Netlify Blobs; db.json solo sirve como datos iniciales.
import serverless from 'serverless-http';
import {connectLambda, getStore} from '@netlify/blobs';
import {createApp} from '../../server/server.js';
import seed from '../../server/db.json';

const {server, db} = createApp(structuredClone(seed));
const app = serverless(server);

// Las peticiones de una misma instancia se procesan en serie para no pisar el estado.
let queue = Promise.resolve();

export const handler = (event, context) => {
  const run = queue.then(async () => {
    connectLambda(event);
    const store = getStore('unilink-api');
    const saved = await store.get('db', {type: 'json'});
    db.setState(saved ?? structuredClone(seed));
    const before = JSON.stringify(db.getState());
    const response = await app(event, context);
    if (JSON.stringify(db.getState()) !== before) await store.setJSON('db', db.getState());
    return response;
  });
  queue = run.catch(() => {});
  return run;
};
