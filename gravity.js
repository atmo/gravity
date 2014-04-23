var canvas, context;
var size = 700;
var height = size, width = size;
var center = new Vector(Math.floor(width/2), Math.floor(height/2));

var cluster;
var mass = 5;
var G = 100;
var bodiesCount = 50;
var t = 0, dt = 0.1;

function init() {
	canvas = document.getElementById('canvas');
	canvas.width = width;
	canvas.height = height;

	context = canvas.getContext('2d');
	cluster = new Cluster(bodiesCount, width, height, G);
	run();
}

function run() {
	context.fillStyle="white";
	context.fillRect(0,0,width,height);
	cluster.draw(context);
	cluster.nextPosition(dt);
	cluster.checkHit();
	cluster.checkBounce(width, height);
	t += dt;
	requestAnimationFrame(run);
}

function Cluster(bodiesCount, width, height, G) {
	this.bodies = createBodies(bodiesCount);
	this.width = width;
	this.height = height;
	this.G = G;

	function createBodies(bodiesCount) {
		var b = new Array(bodiesCount);

		var R = size/8, alpha;
		for (var i = bodiesCount-1; i>=0; --i) {
			b[i] = new Body(i, randomCenter(center, R),
				new Vector(0, 0), mass);
		}

		return b;

		function randomCenter (center, s) {
			return center.add(new Vector(Math.floor(2*s*(Math.random()-0.5)), Math.floor(2*s*(Math.random()-0.5))));
		}
	}

	this.F = function(b) {
		var result = new Array(b.length);
		for (var i = b.length-1; i>=0; --i) {
			for (var j = b.length-1; j>=0; --j) 
				if (i != j) {
					result[i] = b[i].F(b[j], this.G);
			}
		}
		return result;
	}

	this.add = function(b, that) {
		var result = new Array(b.length);
		for (var i = b.length-1; i>=0; --i) {
			result[i] = b[i].add(that[i].pos, that[i].v);
		}
		return result;
	}

	this.multiply = function (b, a) {
		var result = new Array(b.length);
		for (var i = b.length-1; i>=0; --i) {
			result[i] = new Body(i, b[i].pos.multiply(a), b[i].v.multiply(a), b[i].m);
		}
		return result;
	}
	 
	this.draw = function(context) {
		for (var i = this.bodies.length-1; i>=0; --i) {
			this.bodies[i].draw(context);
		}
	}

	this.checkBounce = function (width, height) {
		for (var i = 0; i<this.bodies.length; ++i) {
			var n = this.bodies[i].checkHitWall(width, height); 
			if (n != undefined) 
				this.bodies[i].bounce(n);
		}
	}

	this.checkHit = function () {
		for (var i = 0; i<this.bodies.length; ++i) {
			for (var j = i+1; j<this.bodies.length; ++j) {
				if (this.bodies[i].checkHit(this.bodies[j])) {
					this.bodies[i].merge(this.bodies[j]);
					this.bodies.splice(j, 1);
					--j;
				}
			}
		}
	}
	this.nextPosition = function (dt) {
		var k1 = this.multiply(this.F(this.bodies, this.G), dt);
		var k2 = this.multiply(this.F(this.add(this.bodies, this.multiply(k1, 0.5)), this.G), dt);
		var k3 = this.multiply(this.F(this.add(this.bodies, this.multiply(k2, 0.5)), this.G), dt);
		var k4 = this.multiply(this.F(this.add(this.bodies, k3), this.G), dt);
		this.bodies = this.add(this.bodies, 
			this.multiply(this.add(k1, this.add(this.multiply(k2, 2.0), this.add(this.multiply(k3, 2.0), k4))), 1.0/6.0));
	}

	this.draw = function (context) {
		for (var i = this.bodies.length-1; i>=0; --i) {
			this.bodies[i].draw(context);
		}
	}
}

function Body (id, pos, v, m) {
	this.id = id;
	this.pos = pos;
	this.v = v;
	this.m = m;
	this.radius = Math.pow(m, 1/3.0);

	this.draw = function (context) {
		context.fillStyle="black";

        context.beginPath();
        context.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI);
        context.fill();
        context.restore();
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

	this.checkHit = function (that) {
		return this.pos.subtract(that.pos).norm() < (this.radius + that.radius);
	}

	this.merge = function (that) {
		this.m += that.m;
		this.radius = Math.pow(this.m, 1.0/3.0);
		this.v = this.v.multiply(this.m).add(that.v.multiply(that.m)).multiply(1.0/(this.m + that.m));
	}

	this.checkHitWall = function (w, h) {
		if (this.pos.x-this.radius<=0)
			return new Vector(1, 0);
		else if (this.pos.x+this.radius>=w)
			return new Vector(-1, 0);
		else if (this.pos.y-this.radius<=0)
			return new Vector(0, 1);
		else if (this.pos.y+this.radius>=h)
			return new Vector(0, -1);
		else
			return undefined;
	}

	this.bounce = function (n) {;
		this.v = this.v.add(n.multiply(-2*this.v.scalar(n)));
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

	this.scalar = function (that) {
		return this.x*that.x + this.y*that.y;
	}

	this.norm = function (){
		return Math.sqrt(this.scalar(this));
	}
}
