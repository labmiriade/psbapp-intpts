import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import * as config from './config';
import modules from './modules';

const app = new Koa();
app.use(cors());
app.use(bodyParser());

app.use(async (context, next) => {
  let timeout = 1000;

  if (context.method !== 'GET') {
    timeout = 2000; // 2 sec
  }

  await delay(timeout).then(next);
});

for (const [name, module] of Object.entries(modules)) {
  console.log(`Registering module '${name}'...`);
  app.use(module.routes());
  app.use(module.allowedMethods());
}

app.listen(config.port, () => console.log(`Server started on port ${config.port}!`));

const delay = (timeout: number) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, timeout);
  });
