//. app.js

var express = require( 'express' ),
    basicAuth = require( 'basic-auth-connect' ),
    cfenv = require( 'cfenv' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    ejs = require( 'ejs' ),
    request = require( 'request' ),
    session = require( 'express-session' ),
    app = express();
var settings = require( './settings' );
//var appEnv = cfenv.getAppEnv();

var port = /*appEnv.port ||*/ 3000;

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );

app.use( session({
  secret: settings.superSecret,
  resave: false,
  saveUnitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,  //. https で使う場合は true
    maxage: 1000 * 60 * 60   //.  60min
  }
}) );

app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/public' );
app.set( 'view engine', 'ejs' );

app.get( '/', function( req, res ){
  if( req.session && req.session.token ){
    res.render( 'index', {} );
  }else{
    res.redirect( '/login' );
  }
});

app.get( '/admin', function( req, res ){
  if( req.session && req.session.token ){
    res.render( 'admin', {} );
  }else{
    res.redirect( '/login' );
  }
});

app.get( '/login', function( req, res ){
  var message = ( req.query.message ? req.query.message : '' );
  res.render( 'login', { message: message } );
});

app.post( '/login', function( req, res ){
  var id = req.body.id;
  var password = req.body.password;
  //console.log( 'id=' + id + ',password=' + password);

  var options1 = {
    url: settings.api_url + '/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    json: {
      id: id,
      password: password,
    }
  };
  request( options1, ( err1, res1, body1 ) => {
    if( err1 ){
      console.log( err1 );
      res.redirect( '/login?message=' + err1.message );
    }else{
      //console.log( body1 );
      if( body1.status && body1.token ){
        req.session.token = body1.token;
        res.redirect( '/' );
      }else{
        res.redirect( '/login?message=' + body1.message );
      }
    }
  });
});

app.post( '/post', function( req, res ){
  var token = req.session.token; //req.body.token;
  var json1 = { token: token };
  if( req.body.subject ){ json1['subject'] = req.body.subject; }
  if( req.body.body ){ json1['body'] = req.body.body; }
  if( req.body.thread_id ){ json1['thread_id'] = req.body.thread_id; }

  var options1 = {
    url: settings.api_url + '/message',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    json: json1
  };
  request( options1, ( err1, res1, body1 ) => {
    if( err1 ){
      console.log( err1 );
    }else{
      //console.log( body1 );
    }
    res.redirect( '/' );
  });
});

app.post( '/queryThreads', function( req, res ){
  var token = req.session.token; //req.body.token;
  var limit = ( req.body.limit ? req.body.limit : '' );
  var skip = ( req.body.skip ? req.body.skip : 0 );

  var json1 = { token: token };
  if( limit ){ json1['limit'] = limit; }
  if( skip ){ json1['skip'] = skip; }
  var options1 = {
    url: settings.api_url + '/queryThreads',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    json: json1
  };
  request( options1, ( err1, res1, body1 ) => {
    if( err1 ){
      console.log( err1 );
      res.status( 403 );
      res.write( JSON.stringify( err1, 2, null ) );
      res.end();
    }else{
      //console.log( body1 );
      res.write( JSON.stringify( body1, 2, null ) );
      res.end();
    }
  });
});

app.post( '/queryByThreadId', function( req, res ){
  var token = req.session.token; //req.body.token;
  var thread_id = ( req.body.thread_id ? req.body.thread_id : '' );
  var limit = ( req.body.limit ? req.body.limit : '' );
  var skip = ( req.body.skip ? req.body.skip : 0 );

  if( thread_id ){
    var json1 = { token: token, thread_id: thread_id };
    if( limit ){ json1['limit'] = limit; }
    if( skip ){ json1['skip'] = skip; }
    var options1 = {
      url: settings.api_url + '/queryByThreadId',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      json: json1
    };
    request( options1, ( err1, res1, body1 ) => {
      if( err1 ){
        console.log( err1 );
        res.status( 403 );
        res.write( JSON.stringify( err1, 2, null ) );
        res.end();
      }else{
        res.write( JSON.stringify( body1, 2, null ) );
        res.end();
      }
    });
  }else{
    res.status( 403 );
    res.write( JSON.stringify( [], 2, null ) );
    res.end();
  }
});

app.listen( port );
console.log( "server starting on " + port + " ..." );

