//var BASE_URL = 'api.voicebunny.com';
var isProd = ''; // keep this as empty string if running on prod
/* var isProd = '/sandbox'; // keep this as empty string if running on prod */

var http = require('http'),
    https = require('https'),
    request = require('request'),
    crypto = require('crypto'), 
    querystring = require('querystring'),
    base64 = require('./base64');
  
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
    var utcDate = parseInt(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), t.getUTCHours() - offset, t.getUTCMinutes() ,t.getUTCSeconds() -10, t.getUTCMilliseconds()) / 1000, 10);
    return utcDate;
  },

  /*
   * opts:
   *  script (required)
   *  title (required)
   *  genderAndAge (default: middleAgeAnyGender)
   *  language (default: eng-us)
   *  lifetime (default 84600)
   *  secret (default 0)
   *  syncedRecording (0)
   *  test (0)
   *  ping  (email|url)
   *  price (rewardAmaount)
   *  remarks 
   */
  createProject: function(opts, callback) {
    if (!opts) {
      return callback(new Error('cannot have empty opts'));
    }

    if (!opts.script) {
      return callback(new Error('must define a script')); 
    }

    if (!opts.title) {
      return callback(new Error('must define a title')); 
    }
    
    var params = {
      script: opts.script.trim(),
      title: opts.title.trim(),
      price: (opts.price || 10).toString(),
      genderAndAge: opts.genderAndAge,
      language: opts.language,
      lifetime: (opts.lifetime || 84600).toString(),
      secret: opts.secret || 0,
      syncedRecording: opts.syncedRecording || 0,
      test: opts.test || 0,
      ping: opts.ping || "",
      remarks: opts.remarks || ""
    };
    console.dir(params);
    var uri = "/projects/addSpeedy";
    this.execAuthRequest(uri, params, callback, "POST", 201);
  },

  getProject: function(projId, callback) {
    this.execAuthRequest('/projects/' + projId, {}, callback, "GET", 200);
  },
  
  getReadDetails: function(readId, callback) {
    var u = "https://" + this.baseUrl + isProd + "/reads/" + readId;
    this.execRequest(u, callback);
  },
  
  getProjects: function(status, page, itemsPerPage, callback) {
    var uri = "/projects";
    status = status || 'disposed';
    var params = {
      status: status,
      page: page,
      itemsPerPage: itemsPerPage
    };
    
    this.execAuthRequest(uri, params, callback, "GET", 200);   
  },
  
  approveRead: function(readId, callback) {
    var uri = '/reads/approve/' + readId;
    this.execAuthRequest(uri, null, callback, "GET", 200);
  },
  
  /*
   *  opts:
   *    readId
   *    rejectComments
   */
  rejectRead: function(opts, callback) {
    if (!opts.readId) {
      return callback(new Error('readId cannot be null'));
    }
    if (!opts.rejectComments) {
      return callback(new Error('rejectComments cannot be null'));
    }

    var uri = '/reads/reject/' + opts.readId;

    var params = {
      rejectComments: opts.rejectComments.toString() || "",
      readId: opts.readId.toString()
    };
    
    this.execAuthRequest(uri, params, callback, "POST", 200);
  },
  
  forceDispose: function(projId, callback) {
    var uri = '/projects/forceDispose/' + projId;
    this.execAuthRequest(uri, null, callback, "GET", 200);
  },
  
  quote: function(script, callback) {
    // Retrieves the project from voice bunny
    var uri = "/projects/quote";
    
    var params = {
      script: script
    };    
    
    //params = this.addAuthParams(uri, params);
    this.execAuthRequest(uri, params, callback, "POST", 201);
  },  

  balance: function(callback) {
    var uri = "/balance";
    this.execAuthRequest(uri, null, callback, "POST", 200);   
  },

  /*
   * Private methods
   */
  execAuthRequest: function(uri, params, callback, method, expectedResponse) {
    params = params || {};
    method = method || "POST";
    expectedResponse = expectedResponse || 200;
    var requestParams = querystring.stringify(params);
    var options = {
      host: this.baseUrl,
      port: 443,
      path: uri,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': requestParams.length,
        'Authorization': 'Basic ' + new Buffer(this.clientId + ':' + this.signingKey).toString('base64')
      }
    };
  
    // console.log('exec: ' + options.path);
    var req = https.request(options, function(res) {
      res.setEncoding('utf8');
      var body = '';
      // console.dir(res);
      res.on('data', function(chunk) {
        body += chunk;
        // console.log('%s body len: %d', options.path, body.length);
      });
      res.on('end', function() {
        // console.log('---end: %s %s', options.path, body);
        if (res.statusCode == expectedResponse) {
          if (callback) {
            return callback(null, body);
          }
        }
        else {
          var errMsg = body || '';
          var e = new Error("Failed to execute " + method + ": " + res.statusCode + " error: " + errMsg + ". Check http://voicebunny.com/doc.html for status code definitions");
          if (callback) {
            callback(e, null);            
          }
          else {
            throw e;
          }
        }
      });
    });
    req.on('error', function(err) {
      callback(err);
    });
    req.write(requestParams);
    req.end();
  },
   
  execRequest: function(url, callback) {
    request(url, function(e, res, body) {
      if (!e && res.statusCode == 200) {
        callback(null, body);
      }
      else {
        console.log('GET request failed: ' + url);
        if (res) {
          console.log('HTTP code: ' + res.statusCode);
        }
        if (e) {
          console.warn('error: ' + e.toString());
        }
        
        callback(e, null);
      }
    });
  },
  
  execPut: function(url, callback) {
    request.put(url, function(e, res, body) {
      if (!e && res.statusCode == 200) {
        callback(null, body);
      }
      else {
        console.log('PUT request failed: ' + url);
        callback(e, body);
      }
    });
  },
  
  addAuthParams: function(uri, params) {
    params = params || {};
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
// https://api.voicebunny.com/languages
};
