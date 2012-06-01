#!/usr/bin/env node

var program = require('commander');
var vb = require('./lib/voiceBunnyClient');
var color = require('colors');

program
    .version('0.0.1')
    .option('-c, --create', 'Create Project')
    .option('-x, --dispose', 'Dispose Project')
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
    .option('-m, --languages', 'Get languages list')
    .option('-n, --gender-and-ages', 'Get gender and ages list')
    .option('-k, --signing-key <signingKey>', 'Signing Key')
    .option('-j, --client-id <clientId>', 'Client ID')
    .option('-u, --host-url <hostUrl>', 'Host Url')
    .parse(process.argv);

var signingKey = program.signingKey || process.env.SIGNING_KEY;
var clientId = program.clientId || process.env.CLIENT_ID;
var hostUrl = program.hostUrl || process.env.HOST_URL;

if (!vb.initialized()) {
    vb.init(signingKey, clientId, hostUrl);
}

function handleResponse(err, data) {
    if (err) {
        console.log('There was an error with your request:');
        console.log(err.message);
    } else {
        console.log(data);
    }
    exit();
}

if (program.create) {
    program.prompt('title: ', function(title) {
        program.prompt('script: ', function(script) {
            program.prompt('rewardAmount: ', Number, function(rewardAmount) {
                program.prompt('ping: ', function(ping) {
                    program.prompt('test: ', function(test) {
                        vb.createProject(script, title, rewardAmount, "usd", "urd-pk","middleAgeMale", "360000", "special instructions for test project", ping, test, handleResponse);
                    });
                });
            });
        });
    });
}

if (program.quote) {
    program.prompt('script: ', function(script) {
        program.prompt('maxContestEntries: ', function(maxContestEntries) {
            program.prompt('contest: ', function(contest) {
                vb.quote(script, maxContestEntries, contest,
                    function(err, data) {
                        console.log(data);
                        exit();
                    });
            });
        });
    });
}

if (program.balance) {
    vb.balance(
        function(err, data) {
            console.log(data);
            exit();
        });
}


if (program.dispose) {
    program.prompt('project id: ', Number, function(id) {
        vb.forceDispose(id, handleResponse);
    });
}

if (program.get) {
    program.prompt('project id: ', Number, function(id) {
        vb.getProject(id, handleResponse);
    });
}

if (program.getReads) {
    program.prompt('project id: ', Number, function(id) {
        vb.getReadsForProject(id, handleResponse);
    });
}

if (program.getProjects) {
    program.prompt('status: ', function(status) {
        program.prompt('page: ', Number, function(page) {
            program.prompt('itemsPerPage: ', Number, function(itemsPerPage) {
                program.prompt('includeTests: ', function(includeTests) {
                    vb.getProjects(status, page, itemsPerPage, includeTests, handleResponse);
                });
            });
        });
    });
}

if (program.approveRead) {
    program.prompt('read id: ', Number, function(id) {
        vb.approveRead(id, handleResponse);
    });
}

if (program.rejectRead) {
    program.prompt('read id: ', Number, function(id) {
        program.prompt('rejectComments: ', function(rejectComments) {
            vb.rejectRead(id, rejectComments, handleResponse);
        });
    });
}

if (program.getReadDetails) {
    program.prompt('read id: ', Number, function(id) {
        vb.getReadDetails(id, handleResponse);
    });
}

if (program.languages) {
    vb.languages(handleResponse);
}

if (program.genderAndAges) {
    vb.genderAndAges(handleResponse);
}

// static methods
function exit(code) {
    code = code || 0;
    console.warn('exiting...'.yellow);
    process.exit();
}
