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
	.option('-q, --quote', 'Quote Project')
	.option('-b, --balance', 'Check Balance')
	.option('-a, --approve-read', 'Approve a read by ID')
	.option('-z, --reject-read', 'Reject a read by read ID')
	.option('-k, --signing-key <signingKey>', 'Signing Key')
	.option('-j, --client-id <clientId>', 'Client ID')
	.option('-u, --host-url <hostUrl>', 'Host Url')
	.parse(process.argv);

var signingKey = program.signingKey || process.env.SIGNING_KEY;
var clientId = program.clientId || process.env.CLIENT_ID;
var hostUrl = program.hostUrl || process.env.HOST_URL;

console.log(program.signingKey);

if (!vb.initialized()) {
	vb.init(signingKey, clientId, hostUrl);
	console.log("Initalized voiceBunnyClient with clientId %s and signingKey %s".green, signingKey, clientId);
}

if (program.create) {
	program.prompt('title: ', function(title) {
		program.prompt('script: ', function(script) {
			program.prompt('rewardAmount: ', Number, function(rewardAmount) {
				program.prompt('ping: ', function(ping) {
					vb.createProject(script, title, rewardAmount, "usd", "en-us","middleAgeMale", "3600000", "special instructions", ping,
						function(data) {
							console.log(data);
							exit();
						});
				});
			});
		});
	});
}

if (program.quote) {
	program.prompt('script: ', function(script) {
		vb.quote(script,
			function(data) {
				console.log(data);
				exit();
			});
	});
}

if (program.balance) {
	vb.balance(
		function(data) {
			console.log(data);
			exit();
		});
}


if (program.expire) {
	program.prompt('project id: ', Number, function(id) {
		vb.forceDispose(id, function(data) {
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
	program.prompt('status: ', function(status) {
		program.prompt('page: ', Number, function(page) {
			program.prompt('itemsPerPage: ', Number, function(itemsPerPage) {
				vb.getProjects(status, page, itemsPerPage, function(data) {
					console.log(data);
					var res = JSON.parse(data);
					console.log('Number of projects: ' + res.projects.length);
					console.log(JSON.stringify(res.projects));
					exit();
				});
			});
		});
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
