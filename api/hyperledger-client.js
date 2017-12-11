//. hyperledger-client.js

//. Run following command to deploy business network before running this app.js
//. $ composer network deploy -p hlfv1 -a ./bbbs-network.bna -i PeerAdmin -s secret
var settings = require( './settings' );

const NS = 'me.juge.model';
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const cloudantlib = require( 'cloudant' );
var cloudant = null;
var db = null;

const HyperledgerClient = function() {
  var vm = this;
  vm.businessNetworkConnection = null;
  vm.businessNetworkDefinition = null;

  vm.prepare = (resolved, rejected) => {
    if( settings.use_blockchain ){
      if( vm.businessNetworkConnection != null && vm.businessNetworkDefinition != null ){
        resolved();
      }else{
        console.log('HyperLedgerClient.prepare(): create new business network connection');
        vm.businessNetworkConnection = new BusinessNetworkConnection();
        const connectionProfile = settings.connectionProfile;
        const businessNetworkIdentifier = settings.businessNetworkIdentifier;
        const participantId = settings.participantId;
        const participantPwd = settings.participantPwd;
        return vm.businessNetworkConnection.connect(connectionProfile, businessNetworkIdentifier, participantId, participantPwd)
        .then(result => {
          vm.businessNetworkDefinition = result;
          resolved();
        }).catch(error => {
          console.log('HyperLedgerClient.prepare(): reject');
          rejected(error);
        });
      }
    }else{
      if( db == null ){
        cloudant = cloudantlib( { account: settings.cloudant_username, password: settings.cloudant_password } );
        db = cloudant.db.use( settings.cloudant_db );
      }
      resolved();
    }
  };

  vm.createUserTx = (user, resolved, rejected) => {
    vm.prepare(() => {
      let currentDate = new Date();
      let oldDate = new Date(0);
      if( settings.use_blockchain ){
        let factory = vm.businessNetworkDefinition.getFactory();
        let transaction = factory.newTransaction(NS, 'CreateUserTx');
        transaction.id = user.id;
        transaction.password = user.password;
        transaction.name = user.name;
        transaction.role = user.role;
        transaction.created = ( user.created ? new Date( user.created ) : currentDate );
        transaction.loggedin = ( user.loggedin ? new Date( user.loggedin ) : oldDate );

        return vm.businessNetworkConnection.submitTransaction(transaction)
        .then(result => {
          //resolved(result);
          var result0 = {transactionId: transaction.transactionId, timestamp: transaction.timestamp};
          resolved(result0);
        }).catch(error => {
          console.log('HyperLedgerClient.createUserTx(): reject');
          rejected(error);
        });
      }else{
        let transaction = {};
        transaction.id = user.id;
        transaction.password = user.password;
        transaction.name = user.name;
        transaction.role = user.role;
        transaction.created = ( user.created ? new Date( user.created ) : currentDate );
        transaction.loggedin = ( user.loggedin ? new Date( user.loggedin ) : oldDate );

        db.insert( transaction, user.id, function( err, body, header ){
          if( err ){
            rejected( err );
          }else{
            console.log('HyperLedgerClient.createUserTx(): reject');
            resolved( body );
          }
        });
      }
    }, rejected);
  };

  vm.deleteUserTx = (id, resolved, rejected) => {
    vm.prepare(() => {
      if( settings.use_blockchain ){
        //let currentDate = new Date();
        let factory = vm.businessNetworkDefinition.getFactory();
        let transaction = factory.newTransaction(NS, 'DeleteUserTx');
        transaction.id = id;
        return vm.businessNetworkConnection.submitTransaction(transaction)
        .then(result => {
          resolved(result);
        }).catch(error => {
          console.log('HyperLedgerClient.deleteUserTx(): reject');
          rejected(error);
        });
      }else{
        db.get( id, function( err, data ){
          if( err ){
            rejected(err);
          }else{
            db.destroy( id, data._rev, function( err, body ){
              if( err ){
                rejected(err);
              }else{
                resolved(body);
              }
            });
          }
        });
      }
    }, rejected);
  };

  vm.createMessageTx = (message, resolved, rejected) => {
    vm.prepare(() => {
      let currentDate = new Date();
      if( settings.use_blockchain ){
        let factory = vm.businessNetworkDefinition.getFactory();
        let transaction = factory.newTransaction(NS, 'CreateMessageTx');
        //console.log( transaction );
        transaction.id = message.id;
        transaction.thread_id = message.thread_id;
        if( message.subject ){
          transaction.subject = message.subject;
        }else{
          transaction.subject = '';
        }
        transaction.body = message.body;
        transaction.user_id = message.user_id;
        transaction.created = currentDate;

        console.log( transaction );

        return vm.businessNetworkConnection.submitTransaction(transaction)
        .then(result => {
          //resolved(result);
          var result0 = {transactionId: transaction.transactionId, timestamp: transaction.timestamp};
          resolved(result0);
        }).catch(error => {
          console.log('HyperLedgerClient.createMessageTx(): reject');
          rejected(error);
        });
      }else{
        let transaction = {};
        transaction.id = message.id;
        transaction.thread_id = message.thread_id;
        if( message.subject ){
          transaction.subject = message.subject;
        }else{
          transaction.subject = '';
        }
        transaction.body = message.body;
        transaction.user_id = message.user_id;
        transaction.created = currentDate;

        console.log( transaction );

        db.insert( transaction, message.id, function( err, body, header ){
          if( err ){
            rejected( err );
          }else{
            console.log('HyperLedgerClient.createMessageTx(): reject');
            resolved( body );
          }
        });
      }
    }, rejected);
  };

  vm.deleteMessageTx = (id, resolved, rejected) => {
    vm.prepare(() => {
      //let currentDate = new Date();
      if( settings.use_blockchain ){
        let factory = vm.businessNetworkDefinition.getFactory();
        let transaction = factory.newTransaction(NS, 'DeleteMessageTx');
        transaction.id = id;
        return vm.businessNetworkConnection.submitTransaction(transaction)
        .then(result => {
          resolved(result);
        }).catch(error => {
          console.log('HyperLedgerClient.deleteMessageTx(): reject');
          rejected(error);
        });
      }else{
        db.get( id, function( err, data ){
          if( err ){
            rejected(err);
          }else{
            db.destroy( id, data._rev, function( err, body ){
              if( err ){
                rejected(err);
              }else{
                resolved(body);
              }
            });
          }
        });
      }
    }, rejected);
  };

  vm.getUser = (id, resolved, rejected) => {
    vm.prepare(() => {
      if( settings.use_blockchain ){
        return vm.businessNetworkConnection.getParticipantRegistry(NS + '.User')
        .then(registry => {
          return registry.resolve(id);
        }).then(user => {
          //delete user["password"];
          user["password"] = settings.maskPattern; //'********';
          resolved(user);
        }).catch(error => {
          console.log('HyperLedgerClient.getUser(): reject');
          rejected(error);
        });
      }else{
        db.get( id, function( err, user ){
          if( err ){
            rejected(err);
          }else{
            user["password"] = settings.maskPattern; //'********';
            resolved(user);
          }
        });
      }
    }, rejected);
  };

  vm.getUserForLogin = (id, resolved, rejected) => {
    vm.prepare(() => {
      if( settings.use_blockchain ){
        return vm.businessNetworkConnection.getParticipantRegistry(NS + '.User')
        .then(registry => {
          return registry.resolve(id);
        }).then(user => {
          //user["password"] = settings.maskPattern; //'********';
          resolved(user);
        }).catch(error => {
          console.log('HyperLedgerClient.getUser(): reject');
          rejected(error);
        });
      }else{
        db.get( id, function( err, user ){
          if( err ){
            rejected(err);
          }else{
            resolved(user);
          }
        });
      }
    }, rejected);
  };

  vm.getAllUsers = ( resolved, rejected ) => {
    vm.prepare(() => {
      if( settings.use_blockchain ){
        return vm.businessNetworkConnection.getParticipantRegistry(NS + '.User')
        .then(registry => {
          return registry.getAll();
        })
        .then(users => {
          let serializer = vm.businessNetworkDefinition.getSerializer();
          var result = [];
          users.forEach(user => {
            //delete user["password"];  "ValidationException"
            user["password"] = settings.maskPattern; //'********';
            result.push(serializer.toJSON(user));
          });
          resolved(result);
        }).catch(error => {
          console.log('HyperLedgerClient.getAllUsers(): reject');
          rejected(error);
        });
      }else{
        db.list( { include_docs: true }, function( err, body ){
          if( err ){
            rejected(err);
          }else{
            var docs = [];
            for( var i = 0; i < body.rows.length; i ++ ){
              if( body.rows[i].doc["password"] ){
                body.rows[i].doc["password"] = settings.maskPattern;
                docs.push( body.rows[i].doc );
              }
            }
            resolved( docs );
          }
        });
      }
    }, rejected);
  };

  vm.getMessage = (id, resolved, rejected) => {
    vm.prepare(() => {
      if( settings.use_blockchain ){
        return vm.businessNetworkConnection.getAssetRegistry(NS + '.Message')
        .then(registry => {
          return registry.resolve(id);
        }).then(message => {
          resolved(message);
        }).catch(error => {
          resolved(null);
        });
      }else{
        db.get( id, function( err, user ){
          if( err ){
            rejected(err);
          }else{
            resolved(user);
          }
        });
      }
    }, rejected);
  };

  vm.getAllMessages = (resolved, rejected) => {
    vm.prepare(() => {
      if( settings.use_blockchain ){
        return vm.businessNetworkConnection.getAssetRegistry(NS + '.Message')
        .then(registry => {
          return registry.getAll();
        })
        .then(messages => {
          let serializer = vm.businessNetworkDefinition.getSerializer();
          var result = [];
          messages.forEach(message => {
            result.push(serializer.toJSON(message));
          });
          resolved(result);
        }).catch(error => {
          console.log('HyperLedgerClient.getAllMessages(): reject');
          rejected(error);
        });
      }else{
        db.list( { include_docs: true }, function( err, body ){
          if( err ){
            rejected(err);
          }else{
            var docs = [];
            for( var i = 0; i < body.rows.length; i ++ ){
              if( body.rows[i].doc["body"] ){
                docs.push( body.rows[i].doc );
              }
            }
            resolved( docs );
          }
        });
      }
    }, rejected);
  };

  vm.getAllThreads = (condition, resolved, rejected) => {
    vm.prepare(() => {
      if( settings.use_blockchain ){
        var params = {};

        //. Prevent open issue: https://github.com/hyperledger/composer/issues/1640
        //var select = "SELECT me.juge.model.Message WHERE (subject != '') ORDER BY [created ASC]";
        var select = "SELECT me.juge.model.Message WHERE (id == thread_id)";
  
        if( condition.limit ){
          select += ( ' LIMIT ' + condition.limit );
          params['limit'] = condition.limit;
        }
        if( condition.skip ){
          select += ( ' SKIP ' + condition.skip );
          params['skip'] = condition.skip;
        }
        var query = vm.businessNetworkConnection.buildQuery( select );

        return vm.businessNetworkConnection.query(query, params)
        .then(messages => {
          let serializer = vm.businessNetworkDefinition.getSerializer();
          var result = [];
          messages.forEach(message => {
            result.push(serializer.toJSON(message));
          });
          resolved(result);
        }).catch(error => {
          console.log('HyperLedgerClient.getAllThreads(): reject');
          console.log( error );
          rejected(error);
        });
      }else{
        db.list( { include_docs: true }, function( err, body ){
          if( err ){
            rejected(err);
          }else{
            var docs = [];
            for( var i = 0; i < body.rows.length; i ++ ){
              if( body.rows[i].doc["body"] && body.rows[i].doc["id"] == body.rows[i].doc["thread_id"] ){
                docs.push( body.rows[i].doc );
              }
            }
            resolved( docs );
          }
        });
      }
    }, rejected);
  };

  vm.getMessagesByThreadId = (condition, resolved, rejected) => {
    vm.prepare(() => {
      if( settings.use_blockchain ){
        var params = {thread_id: condition.thread_id};

        //. Prevent open issue: https://github.com/hyperledger/composer/issues/1640
        //var select = 'SELECT me.juge.model.Message WHERE thread_id == _$thread_id ORDER BY [created ASC]';
        var select = 'SELECT me.juge.model.Message WHERE thread_id == _$thread_id';
        if( condition.limit ){
          select += ( ' LIMIT ' + condition.limit );
          params['limit'] = condition.limit;
        }
        if( condition.skip ){
          select += ( ' SKIP ' + condition.skip );
          params['skip'] = condition.skip;
        }
        var query = vm.businessNetworkConnection.buildQuery( select );

        return vm.businessNetworkConnection.query(query, params)
        .then(messages => {
          let serializer = vm.businessNetworkDefinition.getSerializer();
          var result = [];
          messages.forEach(message => {
            result.push(serializer.toJSON(message));
          });
          resolved(result);
        }).catch(error => {
          console.log('HyperLedgerClient.getMessagesByThreadId(): reject');
          console.log( error );
          rejected(error);
        });
      }else{
        db.list( { include_docs: true }, function( err, body ){
          if( err ){
            rejected(err);
          }else{
            var docs = [];
            for( var i = 0; i < body.rows.length; i ++ ){
              if( body.rows[i].doc["body"] && body.rows[i].doc["thread_id"]  == condition.thread_id ){
                docs.push( body.rows[i].doc );
              }
            }
            resolved( docs );
          }
        });
      }
    }, rejected);
  };
}

module.exports = HyperledgerClient;
