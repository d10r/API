/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');

// setup local env is not available
let configDir = path.resolve('config');
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(configDir + '/local.json')) {
  fs.copySync(configDir + '/local.example.json', configDir + '/local.json');
}

const app = require('./app');
const port = app.get('port');

process.on('unhandledRejection', function (err) {
  throw err;
});

process.on('uncaughtException', function (err) {
  app.error(err);
});

// Start server
const server = app.listen(port);
server.on('listening', () => {
  // Start seeder, after database is setup
  if (app.get('seeder').runOnInit === true) {
    app.on('mongooseInit', () => {
      app.service('users').find({ query: { $limit: 0 }})
        .then(async (res) => {
          app.debug(res);
          if (res.total > 0) {
            return null;
          }
          app.info(`Feathers application started on ${app.get('host')}:${port}`);
          app.info('>>>>>> RUN SEEDER <<<<<<');
          await app.seed();
        });
    });
  } else {
    app.service('categories').find({ query: { $limit: 0 }})
      .then(async (res) => {
        if (res.total < 1) {
          app.service('admin').create({ seedBaseCategories: true });
        }
      });
    app.info(`Feathers application started on ${app.get('host')}:${port}`);
  }
});
