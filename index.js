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

var counter = 0;
var serverPromise = Promise.resolve().then(function(){
	return getTemplate(path.normalize('./templates/counter.html'))
		.then(function(template){
			app.get('/counter',function(req,res){
				res.send(template({count:counter}));
			});
			app.post('/counter',function(req,res){
				counter += parseInt(req.body.change);
				res.redirect('/counter');
			});
		});
}).then(function(){
	app.use(express.static('public'));
	app.listen(3000);
	console.log("let's go");
}).catch(function(err){
	console.error(err);
});
