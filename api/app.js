//. app.js

//. Run following command to deploy business network before running this app.js
//. $ composer network deploy -p hlfv1 -a ./bbbs-network.bna -i PeerAdmin -s secret

var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    cfenv = require( 'cfenv' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    http = require( 'http' ),
    uuid = require( 'node-uuid' ),
    jwt = require( 'jsonwebtoken' ),
    app = express();
var settings = require( './settings' );
var appEnv = cfenv.getAppEnv();

const HyperledgerClient = require( './hyperledger-client' );
const client = new HyperledgerClient();

app.set( 'superSecret', settings.superSecret );

var port = /*appEnv.port ||*/ 3001;

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );

app.use( express.static( __dirname + '/public' ) );

app.get( '/', function( req, res ){
  res.write( 'OK' );
  res.end();
});

var apiRoutes = express.Router();

apiRoutes.post( '/login', function( req, res ){
  var id = req.body.id;
  var password = req.body.password;
  //console.log( 'id=' + id + ',password=' + password);
  client.getUserForLogin( id, user => {
    if( user.password == password ){
      var token = jwt.sign( user, app.get( 'superSecret' ), { expiresIn: '24h' } );
      //console.log( 'token=' + token);

      //. 現在時刻
      var dt = new Date();

      //. loggedin 更新
      user.loggedin = dt;
      client.createUserTx( user, result => {
        //console.log( 'createUserTx success: ' + JSON.stringify( result, 2, null ) );
        res.write( JSON.stringify( { status: true, token: token }, 2, null ) );
        res.end();
      }, error => {
        console.log( 'createUserTx error: ' + JSON.stringify( error, 2, null ) );
        res.write( JSON.stringify( { status: true, token: token }, 2, null ) );
        res.end();
      });
    }else{
      res.status( 401 );
      res.write( JSON.stringify( { status: false, message: 'Not valid id/password.' }, 2, null ) );
      res.end();
    }
  }, error => {
    console.log( 'getUserForLogin error: ' + JSON.stringify( error, 2, null ) );
    res.status( 401 );
    res.write( JSON.stringify( { status: false, message: 'Not valid id/password.' }, 2, null ) );
    res.end();
  });
});

apiRoutes.post( '/adminuser', function( req, res ){
  var id = 'admin'; //req.body.id;
  var password = req.body.password;
  client.getUser( id, user => {
    res.status( 400 );
    res.write( JSON.stringify( { status: false, message: 'User ' + id + ' already existed.' }, 2, null ) );
    res.end();
  }, error => {
    var dt = new Date();
    var user = { id: id, password: password, name: 'admin', role: 0, loggedin: null, created: dt };

    client.createUserTx( user, result => {
      res.write( JSON.stringify( { status: true }, 2, null ) );
      res.end();
    }, error => {
      console.log( error );
      res.status( 500 );
      res.write( JSON.stringify( { status: false, message: error }, 2, null ) );
      res.end();
    });
  });
});

//. ここより上で定義する API には認証フィルタをかけない
//. ここより下で定義する API には認証フィルタをかける

apiRoutes.use( function( req, res, next ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    return res.status( 403 ).send( { status: false, message: 'No token provided.' } );
  }

  jwt.verify( token, app.get( 'superSecret' ), function( err, decoded ){
    if( err ){
      return res.json( { status: false, message: 'Invalid token.' } );
    }

    req.decoded = decoded;
    next();
  });
});

apiRoutes.post( '/user', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.status( 401 );
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id && user.role == 0 ){
        console.log( 'POST /user : user.id = ' + user.id );

        var dt = new Date();

        var id = req.body.id;
        var password = req.body.password;
        var name = req.body.name;
        var role = 1; //req.body.role;

        var started = req.body.started;
        var finished = req.body.finished;

        started = ( started ? started.split('/').join('-') : "1970-01-01" );
        finished = ( finished ? finished.split('/').join('-') : "1970-01-01" );
        //var loggedin = ""; //req.body.loggedin;

        client.getUser( id, user0 => {
          //. 更新
          var user1 = {
            id: id,
            password: ( password ? password : user0.password ),
            name: ( name ? name : user0.name ),
            role: role,
            loggedin: user0.loggedin,
            created: user0.created
          };
          client.createUserTx( user1, result => {
            //console.log( 'result(1)=' + JSON.stringify( result, 2, null ) );
            res.write( JSON.stringify( { status: true, result: result }, 2, null ) );
            res.end();
          }, error => {
            console.log( error );
            res.status( 500 );
            res.write( JSON.stringify( { status: false, message: error }, 2, null ) );
            res.end();
          });
        }, error => {
          //. 新規作成
          if( id && password && name ){
            var user1 = {
              id: id,
              password: password,
              name: name,
              role: role,
              loggedin: new Date( 0 ),
              created: dt
            };
            client.createUserTx( user1, result => {
              //console.log( 'result(0)=' + JSON.stringify( result, 2, null ) );
              res.write( JSON.stringify( { status: true, result: result }, 2, null ) );
              res.end();
            }, error => {
              res.status( 500 );
              res.write( JSON.stringify( { status: false, message: error }, 2, null ) );
              res.end();
            });
          }else{
            //. 必須項目が足りない
            res.status( 400 );
            res.write( JSON.stringify( { status: false, message: 'Failed to create/update new user.' }, 2, null ) );
            res.end();
          }
        });
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});

apiRoutes.get( '/users', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id ){
        client.getAllUsers( result => {
          res.write( JSON.stringify( result, 2, null ) );
          res.end();
        }, error => {
          res.status( 500 );
          res.write( JSON.stringify( error, 2, null ) );
          res.end();
        });
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});

apiRoutes.get( '/user', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id ){
        var id = req.query.id;

        client.getUser( id, result => {
          res.write( JSON.stringify( result, 2, null ) );
          res.end();
        }, error => {
          res.status( 404 );
          res.write( JSON.stringify( error, 2, null ) );
          res.end();
        });
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});

apiRoutes.delete( '/user', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id && user.role == 0 ){
        console.log( 'DELETE /user : user.id = ' + user.id );

        var id = req.body.id;

        client.deleteUserTx( id, result => {
          res.write( JSON.stringify( { status: true }, 2, null ) );
          res.end();
        }, error => {
          res.status( 404 );
          res.write( JSON.stringify( { status: false, message: error }, 2, null ) );
          res.end();
        });
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});



apiRoutes.get( '/messages', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id ){
        client.getAllMessages( result => {
          res.write( JSON.stringify( result, 2, null ) );
          res.end();
        }, error => {
          res.status( 500 );
          res.write( JSON.stringify( message, 2, null ) );
          res.end();
        });
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});

apiRoutes.get( '/message', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id ){
        var id = req.query.id;

        client.getMessage( id, result => {
          res.write( JSON.stringify( result, 2, null ) );
          res.end();
        }, error => {
          res.status( 404 );
          res.write( JSON.stringify( message, 2, null ) );
          res.end();
        });
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});

apiRoutes.post( '/message', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.status( 401 );
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id ){
        console.log( 'POST /message : user.id = ' + user.id );
        if( req.body.body ){
          //var id = uuid.v1();
          var thread_id = req.body.thread_id;
          var subject = req.body.subject;
          var body = req.body.body;
          var user_id = user.id;
          var id = uuid.v1();
          var message = {
            id: id,
            body: body,
            user_id: user_id
          };
          message['thread_id'] = ( thread_id ? thread_id : id );
          if( subject ){
            message['subject'] = subject;
          }

          client.createMessageTx( message, result => {
            res.status( 202 ); //Accepted??
            res.write( JSON.stringify( { status: true, result: result }, 2, null ) );
            res.end();
          }, error => {
            res.status( 500 );
            res.write( JSON.stringify( { status: false, message: error }, 2, null ) );
            res.end();
          });
        }else{
          //. 必須項目が足りない(#40)
          res.status( 400 );
          res.write( JSON.stringify( { status: false, message: 'Failed to create new record.' }, 2, null ) );
          res.end();
        }
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});


apiRoutes.delete( '/message', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.status( 401 );
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id ){
        console.log( 'DELETE /message : user.id = ' + user.id );

        var id = req.body.id;

        client.getMessage( id, message => {
          //console.log( 'getMessage: message = ' + JSON.stringify( message, 2, null ) );
          if( message && ( message.user_id == user.id || user.role == 0 ) ){
            client.deleteMessageTx( id, result => {
              res.write( JSON.stringify( { status: true }, 2, null ) );
              res.end();
            }, error => {
              res.status( 404 );
              res.write( JSON.stringify( { status: false, error: error }, 2, null ) );
              res.end();
            });
          }else{
            res.status( 404 );
            res.write( JSON.stringify( { status: false, error: 'Access control denied.' }, 2, null ) );
            res.end();
          }
        }, error => {
          res.status( 400 );
          res.write( JSON.stringify( { status: false, message: 'Failed to find message.' }, 2, null ) );
          res.end();
        });
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});

apiRoutes.post( '/queryThreads', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.status( 401 );
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id ){
        var condition = {};
        if( req.body.limit ){ condition['limit'] = req.body.limit };
        if( req.body.skip ){ condition['skip'] = req.body.skip };
        client.getAllThreads( condition, result => {
          res.write( JSON.stringify( result, 2, null ) );
          res.end();
        }, error => {
          res.status( 403 );
          res.write( JSON.stringify( error, 2, null ) );
          res.end();
        });
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});

apiRoutes.post( '/queryByThreadId', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.status( 401 );
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id ){
        //console.log( 'POST /query : user.id = ' + user.id );

        var condition = {};
        if( req.body.thread_id ){ condition['thread_id'] = req.body.thread_id };
        if( req.body.limit ){ condition['limit'] = req.body.limit };
        if( req.body.skip ){ condition['skip'] = req.body.skip };

        client.getMessagesByThreadId( condition, result => {
          res.write( JSON.stringify( result, 2, null ) );
          res.end();
        }, error => {
          res.status( 403 );
          res.write( JSON.stringify( error, 2, null ) );
          res.end();
        });
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});

apiRoutes.get( '/userinfo', function( req, res ){
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    res.status( 401 );
    res.write( JSON.stringify( { status: false, message: 'No token provided.' }, 2, null ) );
    res.end();
  }else{
    //. トークンをデコード
    jwt.verify( token, app.get( 'superSecret' ), function( err, user ){
      if( err ){
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Invalid token.' }, 2, null ) );
        res.end();
      }else if( user && user.id ){
        //. デコードして id が存在していれば成功とみなして、その user を返す
        res.write( JSON.stringify( { status: true, user: user }, 2, null ) );
        res.end();
      }else{
        res.status( 401 );
        res.write( JSON.stringify( { status: false, message: 'Valid token is missing.' }, 2, null ) );
        res.end();
      }
    });
  }
});


app.use( '/api', apiRoutes );

app.listen( port );
console.log( "server starting on " + port + " ..." );
