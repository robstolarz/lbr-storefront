var RELEASE_MODE = process.env.NODE_ENV == 'production';
var Promise = require('bluebird');

var path = require('path');
var fsPromise = Promise.promisifyAll(require('fs'));
var Goatee = require('goatee');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var loadedTemplates = {};
function getTemplate(filename){
	if(loadedTemplates[filename])
		return loadedTemplates[filename];
	var promise = fsPromise.readFileAsync(filename)
		.then(String)
		.then(Goatee.parseTemplate)
		.then(function(ast){
			return Goatee.buildFn(ast);
		});
	loadedTemplates[filename] = promise;
	return promise;
}

var serverPromise = Promise.resolve().then(function(){
	var session = require('express-session');
	app.use(session({
		store: new (require('connect-pg-simple')(session))({
			pg: require('pg').native || require('pg')
		}),
		secret: process.env.COOKIE_SECRET,
		resave: false,
		cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 },
		saveUninitialized: false // so CloudFlare can cache the site!
	}));
}).then(function(){
	// set up database
	var pgp = require('pg-promise')({
		// TODO: pg-native ?
	});

	var db = pgp({ // TODO: fork lib to use psql-type defaults
		host: process.env.PGHOST,
		database: process.env.PGDATABASE,
		user: process.env.PGUSER,
		password: process.env.PGPASSWORD
	});
	return db.query('SELECT EXISTS ( SELECT 1 FROM information_schema.tables WHERE table_name = \'session\' )').then(function(data){
		var sessionTableExists = data[0].exists;
		if(!sessionTableExists){
			console.log("Session table didn't exist. Creating one now...");
			return db.any(new pgp.QueryFile(path.join(__dirname,'node_modules/connect-pg-simple/table.sql')));
		}
	}).then(Promise.resolve(db));
}).then(function(db){
	return getTemplate(path.normalize('./templates/counter.html'))
		.then(function(template){
			app.get('/counter',function(req,res){
				var user = (req.session || {}).flurbos ? req.session : {id: "unregistered user", flurbos: 0};
				res.send(template({user:user}));
			});
			app.post('/api/changeCounter',function(req,res){
				if(!req.session)
					req.session.regenerate(fn);
				else
					fn();

				function fn(){ // callbacks, man.
					var flurbos = req.session.flurbos || 0;
					req.session.flurbos = flurbos + parseInt(req.body.change);
					res.redirect(req.header('Referer') || '/');
				}
			});
			app.post('/api/logout',function(req,res){
				req.session.destroy();
				res.redirect(req.header('Referer') || '/');
			});
		});
}).then(function(){
	app.use(express.static('public'));
	app.listen(3000);
	console.log("let's go");
}).catch(function(err){
	console.error(err);
});
