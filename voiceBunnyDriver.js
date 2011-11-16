var vb = require('./voiceBunnyClient');
var _ = require('underscore');


var project = vb.createProject("testing script", "title of voice", "5", "US", "EN-us","YF", "3600000", "special instrucitons", postCreateProject);

var projectId = false;
function postCreateProject(data) {
					if (data) {
						console.log('callback: ' + data);
					}
					else {
						console.error('callback: project not created');
						return;
					}
					var proj = JSON.parse(data);
					projectId = proj.project.id;
					vb.getProject(proj.project.id, function(proj) {
						if (proj) {
							console.log('getProject returned: ' + proj);
						}
						else {
							console.error('getProject failed');
							return;
						}

						// expire projects
						proj = JSON.parse(proj);
						vb.expireProject(proj.project.id, function(data) {
							console.log(data);
						});
					});
				}

vb.getProjects(gotProjects);
function gotProjects(body, e) {
  var res = JSON.parse(body);
  _.each(res.projects, function(proj) {
    console.log('project: ' + JSON.stringify(proj));
		if (proj.id < 275) {
			console.log('expiring project: ' + proj.id);
//			vb.expireProject(proj.id, function(body, e) {
	//			console.log('expire project result: ' + body);
		//	});
		}
  });
};