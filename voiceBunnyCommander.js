#!/usr/bin/env node

var program = require('commander');
var vb = require('./voiceBunnyClient');
var color = require('colors');

program
  .version('0.0.1')
  .option('-c, --create', 'Create Project')
  .option('-x, --expire', 'Expire Project')
  .option('-t, --title [title]', 'Title of project [tit]', 'AngryBirds 15s')
  .option('-s, --script [script]', 'Script [scp]', 'Test Script')
  .option('-r, --reward [reward]', 'Reward [rew]', '15')
  .option('-i, --id [id]', 'ID of project')
  .option('-g, --get', 'Get Project')
  .option('-l, --get-reads', 'Get Reads for project')
  .option('-d, --get-read-details', 'Get read details for read id')
  .option('-w, --get-projects', 'Get a list of projects')
  .option('-a, --approve-read', 'Approve a read by ID')
  .option('-z, --reject-read', 'Reject a read by read ID')
  .option('-k, --signing-key', 'Signing Key')
  .option('-j, --client-id', 'Client ID')
  .parse(process.argv);

var signingKey = program.signingKey || process.env.SIGNING_KEY;
var clientId = program.clientId || process.env.CLIENT_ID;

if (!vb.initialized()) {
  vb.init(signingKey, clientId);
}

if (program.create) {
  program.prompt('title: ', function(title) {
    program.prompt('script: ', function(script) {
      program.prompt('reward: ', Number, function(reward) {
        vb.createProject(script, title, reward, "US", "EN-us","YF", "3600000", "special instrucitons", 
          function(data) {
            console.log(data);
            exit();
          });
        });
      });
    });
}

if (program.expire) {
  program.prompt('project id: ', Number, function(id) {
    vb.expireProject(id, function(data) {
      console.log(data);
      exit();
    });
  });
}

if (program.get) {
  program.prompt('project id: ', Number, function(id) {
    vb.getProject(id, function(data) {
      console.log(data);
      exit();
    });
  });
}

if (program.getReads) {
  program.prompt('project id: ', Number, function(id) {
    vb.getReadsForProject(id, function(data) {
      console.log(data);
      exit();
    });
  });
}

if (program.getProjects) {
  vb.getProjects(function(data) {
    var res = JSON.parse(data);
    console.log('Number of projects: ' + res.projects.length);
    console.log(JSON.stringify(res.projects));
    exit();
  });
}

if (program.approveRead) {
  program.prompt('read id: ', Number, function(id) {
    vb.approveRead(id, function(data) {
      console.log(data);
      exit();
    });
  });
}

if (program.rejectRead) {
  program.prompt('read id: ', Number, function(id) {
    vb.rejectRead(id, function(data) {
      console.log(data);
      exit();
    });
  });
}

if (program.getReadDetails) {
  program.prompt('read id: ', Number, function(id) {
    vb.getReadDetails(id, function(data) {
      console.log(data);
      exit();
    });
  });
}

// static methods
function exit() {
  console.warn('exiting...'.yellow);
  process.exit();
}
