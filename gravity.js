var canvas, context;
var size = 700;
var height = size, width = size;
var center = [Math.floor(width/2), Math.floor(height/2)];

var masses;
var bodies;
var radius = 5, mass = 10;
var G = 1;
var bodiesCount = 30;
var t = 0, dt = 0.05;

function init() {
	canvas = document.getElementById('canvas');
	context = canvas.getContext('2d');
	canvas.width = width;
	canvas.height = height;

	context.fillStyle="white";
	context.fillRect(0,0,width,height);
	createBodies(bodiesCount);
	run();
}

function createBodies(bodiesCount) {
	bodies = new Array(bodiesCount);
	masses = new Array(bodiesCount);

	var R = size/10, alpha;
	for (var i = bodiesCount-1; i>=0; --i) {
		masses[i] = (Math.random()-0.5)*10;
		bodies[i] = new Array(2);
		alpha = 2*Math.PI*i/bodiesCount;
		bodies[i][0] = [center[0] + (Math.random()-0.5)*100, center[1] + (Math.random()-0.5)*100];
		// bodies[i][0] = [center[0] + Math.round(R*Math.sin(alpha)), center[1] - Math.round(R*Math.cos(alpha))];
		bodies[i][1] = [0, 0];
	}

	console.debug(bodies);
}

function run() {
	context.fillStyle="white";
	context.fillRect(0,0,width,height);
	drawBodies(bodies);
	bodies = nextPosition(bodies, masses, dt);
	t += dt;
	requestAnimationFrame(run);
}

function nextPosition (bodies, masses, dt) {

	var m = masses;
	var c = new Array(4);
	c[0] = F(bodies, masses);
	for (var i = bodiesCount-1; i>=0; --i) {
		for (var j = 1; j>=0; --j) {
			for (var k = 1; k>=0; --k) {
				c[0][i][j][k]*= dt;
			}
		}
	}

	var xn = bodies.concat();
	for (var i = bodiesCount-1; i>=0; --i) {
		for (var j = 1; j>=0; --j) {
			for (var k = 1; k>=0; --k) {
				xn[i][j][k] += c[0][i][j][k]/2.0;
			}
		}
	}
	c[1] = F(xn, masses);
	for (var i = bodiesCount-1; i>=0; --i) {
		for (var j = 1; j>=0; --j) {
			for (var k = 1; k>=0; --k) {
				c[1][i][j][k] *= dt;
			}
		}
	}

	xn = bodies.concat();
	for (var i = bodiesCount-1; i>=0; --i) {
		for (var j = 1; j>=0; --j) {
			for (var k = 1; k>=0; --k) {
				xn[i][j][k] += c[1][i][j][k]/2.0;
			}
		}
	}
	c[2] = F(xn, masses);
	for (var i = bodiesCount-1; i>=0; --i) {
		for (var j = 1; j>=0; --j) {
			for (var k = 1; k>=0; --k) {
				c[2][i][j][k]*= dt;
			}
		}
	}

	xn = bodies.concat();
	for (var i = bodiesCount-1; i>=0; --i) {
		for (var j = 1; j>=0; --j) {
			for (var k = 1; k>=0; --k) {
				xn[i][j][k] += c[2][i][j][k];
			}
		}
	}
	c[3] = F(xn, masses);
	for (var i = bodiesCount-1; i>=0; --i) {
		for (var j = 1; j>=0; --j) {
			for (var k = 1; k>=0; --k) {
				c[3][i][j][k]*= dt;
			}
		}
	}

	for (var i = bodiesCount-1; i>=0; --i) {
		for (var j = 1; j>=0; --j) {
			for (var k = 1; k>=0; --k) {
				bodies[i][j][k] += (c[0][i][j][k] + 2.0*c[1][i][j][k] + 2.0*c[2][i][j][k] + c[3][i][j][k])/6.0;
			}
		}
	}

	return bodies;
}


function F(x, masses) {
	var result = new Array(bodiesCount);
	for (var i = bodiesCount-1; i>=0; --i) {
		result[i] = new Array(2);
		for (var j = 1; j>=0; --j)
			result[i][j] = new Array(2);

		for (var k = 1; k>=0; --k) {
			result[i][0][k] = x[i][1][k];
		}
		result[i][1][0] = 0;
		result[i][1][1] = 0;
		for (var j = bodiesCount-1; j>=0; --j) 
			if (i != j) {
				var cd = cube(distance(x[i][0], x[j][0]));
				for (var k = 1; k>=0; --k) {
					result[i][1][k] += G*masses[j]*(x[j][0][k] - x[i][0][k])/cd; 
				}
			}
		}
	return result;
}

function drawBodies(bodies) {
	context.fillStyle="black";
	context.beginPath();
	for (var i = bodiesCount-1; i>=0; --i) {
		context.moveTo(bodies[i][0][0], bodies[i][0][1]);
		context.arc(bodies[i][0][0], bodies[i][0][1], radius, 0, 2*Math.PI);
	}
	context.fill();
}

function distance(a, b) {
	return Math.sqrt((a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]));
}

function cube(a) {
	return a*a*a;
}
