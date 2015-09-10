var base      = require('taskcluster-base');
var assert    = require('assert');

/** Declaration of exchanges offered by the auth */
var exchanges = new base.Exchanges({
  title:      "Auth Pulse Exchanges",
  description: [
    "The auth service, typically available at `auth.taskcluster.net`,"
    "is responsible for storing credentials, managing assignment of scopes,",
    "and validation of request signatures from other services.",
    "",
    "These exchanges provides notifications when credentials or roles are",
    "updated. This is mostly so that multiple instances of the auth service",
    "can purge their caches and synchronize state. But you are of course",
    "welcome to use these for other purposes, monitoring changes for example."
  ].join('\n'),
  schemaPrefix:         'http://schemas.taskcluster.net/auth/v1/'
});

// Export exchanges
module.exports = exchanges;

/** Build client routing key construct for `exchanges.declare` */
var buildClientRoutingKey = (options) => {
  return [
    {
      name:             'clientId',
      summary:          "`clientId` that was affected by this change.",
      required:         true,
      maxSize:          22
    }, {
      name:             'reserved',
      summary:          "Space reserved for future routing-key entries, you " +
                        "should always match this entry with `#`. As " +
                        "automatically done by our tooling, if not specified.",
      multipleWords:    true,
      maxSize:          1
    }
  ];
};

/** Build role routing key construct for `exchanges.declare` */
var buildRoleRoutingKey = (options) => {
  return [
    {
      name:             'reserved',
      summary:          "Space reserved for future routing-key entries, you " +
                        "should always match this entry with `#`. As " +
                        "automatically done by our tooling, if not specified.",
      multipleWords:    true,
      maxSize:          1
    }
  ];
};

/** Build an AMQP compatible message from a message */
var commonMessageBuilder = (message) => {
  message.version = 1;
  return message;
};

/** Build a client routing key from message */
var clientRoutingKeyBuilder = (message) => {
  return {
    clientId: message.clientId,
  };
};

exchanges.declare({
  exchange:           'client-created',
  name:               'clientCreated',
  title:              "Client Created Messages",
  description: [
    "Message that a new client has been created."
  ].join('\n'),
  routingKey:         buildClientRoutingKey(),
  schema:             'client-message.json#',
  messageBuilder:     commonMessageBuilder,
  routingKeyBuilder:  clientRoutingKeyBuilder,
  CCBuilder:          () => []
});

exchanges.declare({
  exchange:           'client-updated',
  name:               'clientÚpdated',
  title:              "Client Updated Messages",
  description: [
    "Message that a new client has been updated."
  ].join('\n'),
  routingKey:         buildClientRoutingKey(),
  schema:             'client-message.json#',
  messageBuilder:     commonMessageBuilder,
  routingKeyBuilder:  clientRoutingKeyBuilder,
  CCBuilder:          () => []
});

exchanges.declare({
  exchange:           'client-deleted',
  name:               'clientDeleted',
  title:              "Client Deleted Messages",
  description: [
    "Message that a new client has been deleted."
  ].join('\n'),
  routingKey:         buildClientRoutingKey(),
  schema:             'client-message.json#',
  messageBuilder:     commonMessageBuilder,
  routingKeyBuilder:  clientRoutingKeyBuilder,
  CCBuilder:          () => []
});

exchanges.declare({
  exchange:           'role-created',
  name:               'roleCreated',
  title:              "Role Created Messages",
  description: [
    "Message that a new role has been created."
  ].join('\n'),
  routingKey:         buildRoleRoutingKey(),
  schema:             'role-message.json#',
  messageBuilder:     commonMessageBuilder,
  routingKeyBuilder:  () => '',
  CCBuilder:          () => []
});

exchanges.declare({
  exchange:           'role-updated',
  name:               'roleUpdated',
  title:              "Role Updated Messages",
  description: [
    "Message that a new role has been updated."
  ].join('\n'),
  routingKey:         buildRoleRoutingKey(),
  schema:             'role-message.json#',
  messageBuilder:     commonMessageBuilder,
  routingKeyBuilder:  () => '',
  CCBuilder:          () => []
});

exchanges.declare({
  exchange:           'role-deleted',
  name:               'roleDeleted',
  title:              "Role Deleted Messages",
  description: [
    "Message that a new role has been deleted."
  ].join('\n'),
  routingKey:         buildRoleRoutingKey(),
  schema:             'role-message.json#',
  messageBuilder:     commonMessageBuilder,
  routingKeyBuilder:  () => '',
  CCBuilder:          () => []
});
