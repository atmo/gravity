var canvas, context;
var size = 700;
var height = size, width = size;
var center = new Vector(Math.floor(width/2), Math.floor(height/2));

var bodies;
var mass = 5;
var G = 100;
var bodiesCount = 2;
var t = 0, dt = 0.05;
var c = 0;

function init() {
	canvas = document.getElementById('canvas');
	canvas.width = width;
	canvas.height = height;

	context = canvas.getContext('2d');
	createBodies(bodiesCount);
	run();
}

function createBodies(bodiesCount) {
	bodies = new Array(bodiesCount);

	var R = size/4, alpha;
	for (var i = bodiesCount-1; i>=0; --i) {
		bodies[i] = new Body(i, center.add(new Vector(Math.floor(R*Math.random()), Math.floor(R*Math.random()))),
			new Vector(0, 0), mass);
	}
}

function run() {
	context.fillStyle="white";
	context.fillRect(0,0,width,height);
	draw(bodies, context);
	console.log(bodies[0].pos, bodies[0].v)
	bodies = nextPosition(bodies, dt);
	t += dt;
	requestAnimationFrame(run);
}

function nextPosition (bodies, dt) {
	var k1 = multiply(F(bodies, G), dt);
	var k2 = multiply(F(add(bodies, multiply(k1, 0.5)), G), dt);
	var k3 = multiply(F(add(bodies, multiply(k2, 0.5)), G), dt);
	var k4 = multiply(F(add(bodies, k3), G), dt);
	return add(bodies, multiply(add(k1, add(multiply(k2, 2.0), add(multiply(k3, 2.0), k4))), 1.0/6.0));
}

function F(bodies, G) {
	var result = new Array(bodies.length);
	for (var i = bodies.length-1; i>=0; --i) {
		for (var j = bodies.length-1; j>=0; --j) 
			if (i != j) {
			result[i] = bodies[i].F(bodies[j], G);
		}
	}
	return result;
}

function add(bodies, that) {
	var result = new Array(bodies.length);
	for (var i = bodies.length-1; i>=0; --i) {
		result[i] = bodies[i].add(that[i].pos, that[i].v);
	}
	return result;
}

function multiply(bodies, a) {
	var result = new Array(bodies.length);
	for (var i = bodies.length-1; i>=0; --i) {
		result[i] = new Body(i, bodies[i].pos.multiply(a), bodies[i].v.multiply(a), bodies[i].m);
	}
	return result;
}
 
function draw (bodies, context) {
	for (var i = bodies.length-1; i>=0; --i) {
		bodies[i].draw(context);
	}
}

function Body (id, pos, v, m) {
	this.id = id;
	this.pos = pos;
	this.v = v;
	this.m = m;
	this.radius = m;

	this.draw = function (context) {
		context.fillStyle="black";

		// context.save();
        // context.translate(this.pos.x, this.pos.y);
        context.beginPath();
        context.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI);
        // context.closePath();
        context.fill();
        // context.restore();
	}

	this.F = function (that, G) {
		var result = new Body(id, this.v, new Vector(0, 0), m);
		var diff = this.pos.subtract(that.pos);
		result.v = result.v.add(diff.multiply(-G*that.m/cube(diff.norm())));
		return result;

		function cube(a) {
			return a*a*a;
		}
	}

	this.add = function(sp, sv) {
		return new Body(id, this.pos.add(sp), this.v.add(sv), this.m);
	}	
}

function Vector(x, y) {
	this.x = x;
	this.y = y;

	this.add = function (that) {
		return new Vector(this.x+that.x, this.y+that.y);
	}

	this.subtract = function (that) {
		return new Vector(this.x-that.x, this.y-that.y);
	}

	this.multiply = function (a) {
		return new Vector(this.x*a, this.y*a);
	}

	this.norm = function (){
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}
}
