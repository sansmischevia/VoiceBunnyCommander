var BASE_URL = 'api.voicebunny.com';
var isProd = ''; // keep this as empty string if running on prod
/* var isProd = '/sandbox'; // keep this as empty string if running on prod */

var sys = require('sys'),
  http  = require('http'),
  request = require('request'),
  crypto  = require('crypto'), 
  querystring = require('querystring'),
  base64  = require('./base64');
  
var VoiceBunny = module.exports = {
  signingKey: false,
  clientId: false,
  init: function(s, c) {
    this.signingKey = s;
    this.clientId = c;
  },

  initialized: function() {
    if (!this.signingKey) {
      return false;
    }
    if (!this.clientId) {
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
    language, voicetype, lifetime, specialInstructions, callback) {

    var postParams = {
      script: script,
      title: title,
      rewardamount: rewardAmount.toString(),
      rewardcurrency: rewardCurrency,
      language: language,
      voicetype: voicetype,
      lifetime: lifetime.toString(),
      specialinstructions: specialInstructions
    };
    
    console.log('createProject postParams: ' + JSON.stringify(postParams));
    var uri = "projects.json";
    postParams = this.addAuthParams(uri, postParams);
    this.execAuthRequest(uri, postParams, callback, "POST", 201);
  },

  getProject: function(projId, callback) {
    // Retrieves the project from voice bunny
    var u = "http://" + BASE_URL + isProd + "/projects/" + projId + ".json";
    this.execRequest(u, callback);
  },
  
  getReadsForProject: function(projId, callback) {
    var u = "http://" + BASE_URL + isProd + "/projects/" + projId + "/reads.json";
    this.execRequest(u, callback);
  },
  
  getReadDetails: function(readId, callback) {
    var u = "http://" + BASE_URL + isProd + "/reads/" + readId + ".json";
    this.execRequest(u, callback);
  },
  
  getProjects: function(callback) {
    var u = "http://" + BASE_URL + isProd + "/projects.json";
    this.execRequest(u, callback);
  },
  
  approveRead: function(readId, callback) {
    var u = "http://" + BASE_URL + isProd + "/read/approve/" + readId + ".json";
    this.execPut(u, callback);
  },
  
  rejectRead: function(readId, callback) {
    var u = "http://" + BASE_URL + isProd + "/reads/reject/" + readId + ".json";
    this.execPut(u, callback);
  },
  
  expireProject: function(projId, callback) {
    var uri = 'projects/expire/' + projId + '.json';
    this.execAuthRequest(uri, null, callback, "PUT", 204);
  },
  
  /*
   * Private methods
   */
  execAuthRequest: function(uri, postParams, callback, method, expectedResponse) {
    postParams = postParams || {};
    method = method || "POST";
    expectedResponse = expectedResponse || 200;
    var postParams = this.addAuthParams(uri, postParams);
    var requestParams = querystring.stringify(postParams);
    var options = {
      host: BASE_URL,
      port: 80,
      path: isProd + "/" + uri,
      method: method,
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': requestParams.length
      }
    };
    console.log('making ' + method + ' request to: ' + options.host + options.path);
    var req = http.request(options, function(res) {
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
// http://api.voicebunny.com/languages.json
};
