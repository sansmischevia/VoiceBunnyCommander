//var BASE_URL = 'api.voicebunny.com';
var isProd = ''; // keep this as empty string if running on prod
/* var isProd = '/sandbox'; // keep this as empty string if running on prod */

var sys = require('sys'),
http  = require('http'),
https  = require('https'),
request = require('request'),
crypto  = require('crypto'), 
querystring = require('querystring'),
base64  = require('./base64');
  
var VoiceBunny = module.exports = {
	signingKey: false,
	clientId: false,
	baseUrl: 'api.voicebunny.com',
  
	init: function(s, c, u) {
		this.signingKey = s;
		this.clientId = c;
		if(u){
			this.baseUrl = u;
		}
	},

	initialized: function() {
		var isInitialized = (this.signingKey && this.clientId);
		if (!isInitialized) {
			return false;
		}
		return true;
	},

	getUTCTimestamp: function(off) {
		var offset = 0;
		if (off) {
			offset = off;
		}

		var t = new Date();
		var utcDate = parseInt(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), t.getUTCHours() - offset, t.getUTCMinutes() ,t.getUTCSeconds() -10, t.getUTCMilliseconds()) / 1000);
		return utcDate;
	},

	createProject: function(script, title, rewardAmount, rewardCurrency,
		language, genderandage, lifetime, specialInstructions, callback) {

		genderandage = genderandage || "YF";
		
		var postParams = {
			script: script,
			title: title,
			rewardAmount: rewardAmount.toString(),
			rewardCurrency: rewardCurrency,
			language: language,
			genderAndAge: genderandage,
			lifetime: lifetime.toString(),
			user: this.clientId,
			specialInstructions: specialInstructions
		};
    
		console.log('createProject postParams: ' + JSON.stringify(postParams));
		var uri = "projects/add.json";
		//postParams = this.addAuthParams(uri, postParams);
		this.execAuthRequest(uri, postParams, callback, "POST", 201);
	},

	getProject: function(projId, callback) {
		// Retrieves the project from voice bunny
		var u = "https://" + this.baseUrl + isProd + "/projects/" + projId + ".json";
		console.log(u);
		this.execRequest(u, callback);
	},
  
	getReadsForProject: function(projId, callback) {
		var u = "https://" + this.baseUrl + isProd + "/projects/" + projId + "/reads.json";
		this.execRequest(u, callback);
	},
  
	getReadDetails: function(readId, callback) {
		var u = "https://" + this.baseUrl + isProd + "/reads/" + readId + ".json";
		this.execRequest(u, callback);
	},
  
	getProjects: function(callback) {
		var u = "https://" + this.baseUrl + isProd + "/projects.json";
		this.execRequest(u, callback);
	},
  
	approveRead: function(readId, callback) {
		var uri = '/reads/approve/' + readId + '.json';
		this.execAuthRequest(uri, null, callback, "GET", 200);
	},
  
	rejectRead: function(readId, callback) {
		var uri = '/reads/reject/' + readId + '.json';
		this.execAuthRequest(uri, null, callback, "GET", 200);
	},
  
	forceDisposed: function(projId, callback) {
		var uri = 'projects/forceDisposed/' + projId + '.json';
		this.execAuthRequest(uri, null, callback, "GET", 200);
	},
  
	/*
   * Private methods
   */
	execAuthRequest: function(uri, postParams, callback, method, expectedResponse) {
		postParams = postParams || {};
		method = method || "POST";
		expectedResponse = expectedResponse || 200;
		//    var postParams = this.addAuthParams(uri, postParams);
		var requestParams = querystring.stringify(postParams);
		var options = {
			host: this.baseUrl,
			port: 443,
			path: isProd + "/" + uri,
			method: method,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': requestParams.length,
				'Authorization': 'Basic ' + new Buffer(this.clientId + ':' + this.signingKey).toString('base64')
			}
		};
	
		console.log('making ' + method + ' request to: ' + options.host + options.path);
		var req = https.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function(data) {
				console.log('request finished');
				if (res.statusCode == expectedResponse) {
					callback(data);
				}
				else {
					console.log('failed to execute ' + method + ': ' + res.statusCode + '. Expecting: ' + expectedResponse);
					var errMsg = data || '';
					callback(data, Error("Failed to execute " + method + ": " + res.statusCode + " error: " + errMsg));
				}
			});
		});
		req.write(requestParams);
		req.end();
	},
   
	execRequest: function(url, callback) {
		request(url, function(e, res, body) {
			if (!e && res.statusCode == 200) {
				callback(body);
			}
			else {
				console.log('GET request failed: ' + url);
				if (res) {
					console.log('HTTP code: ' + res.statusCode);
				}
				if (e) {
					console.warn('error: ' + e.toString());
				}
        
				callback(null, e);
			}
		});
	},
  
	execPut: function(url, callback) {
		request.put(url, function(e, res, body) {
			if (!e && res.statusCode == 200) {
				callback(body);
			}
			else {
				console.log('PUT request failed: ' + url);
				callback(null, e);
			}
		});
	},
  
	addAuthParams: function(uri, params) {
		var params = params || {};
		var utcDate = this.getUTCTimestamp();
		var sig = this.generateSig(uri, this.clientId, utcDate);
		params.clientid = this.clientId;
		params.timestamp = utcDate;
		params.signature = sig;
    
		return params;
	},

	generateSig: function(uri, clientId, timestamp ) {
		var s = uri + "&" + clientId + "&" + timestamp;
		var hash = crypto.createHmac('sha1', this.signingKey).update(s).digest('base64');
		return hash;
	}
// https://api.voicebunny.com/languages.json
};
