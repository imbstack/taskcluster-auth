var assert      = require('assert');
var Promise     = require('promise');
var path        = require('path');
var _           = require('lodash');
var testing     = require('taskcluster-lib-testing');
var data        = require('../lib/data');
var v1          = require('../lib/v1');
var taskcluster = require('taskcluster-client');
var mocha       = require('mocha');
var serverLoad  = require('../lib/main');
var exchanges   = require('../lib/exchanges');
var testserver  = require('./testserver');
var slugid      = require('slugid');
var Config      = require('typed-env-config');

// Load configuration
var cfg = Config({profile: 'test'});

// Create subject to be tested by test
var helper = module.exports = {};

helper.cfg = cfg;
helper.testaccount = _.keys(cfg.app.azureAccounts)[0];
helper.rootAccessToken = cfg.app.rootAccessToken;

// Skip tests if no pulse credentials are configured
if (!cfg.pulse.password) {
  console.log("Skip tests for due to missing pulse credentials; " +
              "create user-config.yml");
  process.exit(1);
}

// Configure PulseTestReceiver
helper.events = new testing.PulseTestReceiver(cfg.pulse, mocha);

var webServer = null, testServer;
mocha.before(async () => {
  let overwrites = {};
  overwrites['profile'] = 'test';
  overwrites['process'] = 'test';
  helper.overwrites = overwrites;
  helper.load = serverLoad;

  // if we don't have an azure account/key, use the inmemory version
  if (!cfg.azure || !cfg.azure.accountName) {
    let resolver = await serverLoad('resolver', overwrites);
    let signingKey = cfg.app.tableSigningKey;
    let cryptoKey = cfg.app.tableCryptoKey;
    overwrites['resolver'] = resolver;
    overwrites['Client'] = data.Client.setup({
      table: 'Client',
      account: 'inMemory',
      cryptoKey,
      signingKey,
      context: {resolver},
    });
    overwrites['Role'] = data.Role.setup({
      table: 'Role',
      account: 'inMemory',
      signingKey,
      context: {resolver},
    });
  }

  webServer = await serverLoad('server', overwrites);
  webServer.setTimeout(3500); // >3s because Azure can be sloooow

  // Create client for working with API
  helper.baseUrl = 'http://localhost:' + webServer.address().port + '/v1';
  var reference = v1.reference({baseUrl: helper.baseUrl});
  assert(reference.entries.length == 19, "Something is missing");
  helper.Auth = taskcluster.createClient(reference);
  helper.auth = new helper.Auth({
    baseUrl:          helper.baseUrl,
    credentials: {
      clientId:       'root',
      accessToken:    cfg.app.rootAccessToken,
    }
  });

  // Create test server
  let {
    server:     testServer_,
    reference:  testReference,
    baseUrl:    testBaseUrl,
    Client:     TestClient,
    client:     testClient,
  } = await testserver({
    authBaseUrl: helper.baseUrl,
    rootAccessToken: cfg.app.rootAccessToken,
  });

  testServer = testServer_;
  helper.testReference  = testReference;
  helper.testBaseUrl    = testBaseUrl;
  helper.TestClient     = TestClient;
  helper.testClient     = testClient;

  var exchangeReference = exchanges.reference({
    exchangePrefix:   cfg.app.exchangePrefix,
    credentials:      cfg.pulse,
  });
  helper.AuthEvents = taskcluster.createClient(exchangeReference);
  helper.authEvents = new helper.AuthEvents();
});

// Cleanup after tests
mocha.after(async () => {
  // Kill servers
  if (testServer) {
    await testServer.terminate();
  }
  if (webServer) {
    await webServer.terminate();
  }
});
