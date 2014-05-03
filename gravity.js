var canvas, context;
var size = 500;
var height = size, width = size;
var center = new Vector(Math.floor(width/2), Math.floor(height/2));

var cluster, prevcluster;
var mass = 5;
var G = 100;
var bodiesCount = 50;
var t = 0, dt = 0.1;

var running = true, showTraces = false;

function init() {
    canvas = document.getElementById('canvas');
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext('2d');
    cluster = new Cluster(bodiesCount, width, height, G);
    run();
}

function run() {
    if (!showTraces) {
        context.fillStyle="white";
        context.fillRect(0,0,width,height);
    }
    if (showTraces)
        prevcluster.trace(context);
    cluster.draw(context);
    prevcluster = cluster;
    cluster = cluster.nextPosition(dt);
    cluster.checkHit();
    cluster.checkWallHit(bounce);
    t += dt;
    if (running)
        requestAnimationFrame(run);
}

function toggleRunning() {
    running = !running;
    var button = document.getElementById('runButton');
    if (running) {
        button.value = "Pause";
        run();
    }
    else {
        button.value = "Run";
    }
}


function onBodiesCountChanged(v) {
    bodiesCount = parseInt(v, 10);
}

function restart() {
    running = true;
    cluster = new Cluster(bodiesCount, width, height, G);
    context.fillStyle="white";
    context.fillRect(0,0,width,height);
    run();
}

function setShowTraces() {
    var checkbox = document.getElementById('traces');
    showTraces = checkbox.checked;
}

function setBounce() {
    var checkbox = document.getElementById('bounce');
    bounce = checkbox.checked;
}

function Cluster(bodies, width, height, G) {
    this.bodies = typeof bodies == "number" ? createBodies(bodies) : bodies;
    this.width = width;
    this.height = height;
    this.G = G;

    function createBodies (bodiesCount) {
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

    this.F = function() {
        var result = new Array(this.bodies.length);
        for (var i = this.bodies.length-1; i>=0; --i) {
            for (var j = this.bodies.length-1; j>=0; --j)
                if (i != j) {
                    result[i] = this.bodies[i].F(this.bodies[j], this.G);
            }
        }
        return new Cluster(result, this.width, this.height, this.G);
    }

    this.add = function(that) {
        var result = new Array(this.bodies.length);
        for (var i = this.bodies.length-1; i>=0; --i) {
            result[i] = this.bodies[i].add(that.bodies[i].pos, that.bodies[i].v);
        }
        return new Cluster(result, this.width, this.height, this.G);
    }

    this.multiply = function (a) {
        var result = new Array(this.bodies.length);
        for (var i = this.bodies.length-1; i>=0; --i) {
            result[i] = new Body(i, this.bodies[i].pos.multiply(a), this.bodies[i].v.multiply(a), this.bodies[i].m);
        }
        return new Cluster(result, this.width, this.height, this.G);
    }

    this.draw = function(context) {
        for (var i = this.bodies.length-1; i>=0; --i) {
            this.bodies[i].draw(context);
        }
    }

    this.checkWallHit = function (bounce) {
        for (var i = 0; i<this.bodies.length; ++i) {
            if (this.bodies[i].checkWallHit(this.width, this.height))
            {
                if (bounce)
                    this.bodies[i].bounce(this.width, this.height);
                else
                    this.bodies[i].goThrough(this.width, this.height);
            }
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
        var k1 = this.F().multiply(dt);
        var k2 = this.add(k1.multiply(0.5)).F().multiply(dt);
        var k3 = this.add(k2.multiply(0.5)).F().multiply(dt);
        var k4 = this.add(k3).F().multiply(dt);
        return this.add(k1.add(k2.multiply(2.0)).add(k3.multiply(2.0)).add(k4).multiply(1.0/6.0));
    }

    this.draw = function (context) {
        for (var i = this.bodies.length-1; i>=0; --i) {
            this.bodies[i].draw(context);

            var n = this.bodies[i].checkWallHit(this.width, this.height);
            if (n) {
                new Body(i, bodies[i].pos.add(n.multiply(n.x != 0 ? this.width : this.height)), bodies[i].v, bodies[i].m).draw(context);
            }
        }
    }

    this.trace = function (context) {
        for (var i = this.bodies.length-1; i>=0; --i) {
            this.bodies[i].trace(context);
            var n = this.bodies[i].checkWallHit(this.width, this.height);
            if (n) {
                new Body(i, bodies[i].pos.add(n.multiply(n.x != 0 ? this.width : this.height)), bodies[i].v, bodies[i].m).clear(context);
            }
        }
    }
}

function Body (id, pos, v, m) {
    this.id = id;
    this.pos = pos;
    this.v = v;
    this.m = m;
    this.radius = Math.pow(m, 1/3.0);

    this.F = function (that, G) {
        var result = new Body(id, this.v, new Vector(0, 0), m);
        var diff = this.pos.subtract(that.pos);
        result.v = result.v.add(diff.multiply(-G*that.m/cube(diff.norm())));
        return result;

        function cube(a) {
            return a*a*a;
        }
    }

    this.add = function(p, v) {
        return new Body(id, this.pos.add(p), this.v.add(v), this.m);
    }

    this.checkHit = function (that) {
        return this.pos.subtract(that.pos).norm() < (this.radius + that.radius);
    }

    this.merge = function (that) {
        this.m += that.m;
        this.radius = Math.pow(this.m, 1.0/3.0);
        this.v = this.v.multiply(this.m).add(that.v.multiply(that.m)).multiply(1.0/(this.m + that.m));
    }

    this.checkWallHit = function (w, h) {
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

    this.bounce = function (w, h) {
        var n = this.checkWallHit(w, h);
        this.v = this.v.add(n.multiply(-2*this.v.scalar(n)));
    }

    this.goThrough = function (w, h) {
        var n = this.checkWallHit(w, h);
        this.pos = this.pos.add(n.multiply(n.x != 0 ? w : h));
    }

    this.draw = function (context) {
        context.fillStyle="black";

        context.beginPath();
        context.arc(this.pos.x, this.pos.y, this.radius, 0, 2*Math.PI);
        context.fill();
    }

    this.clear = function (context) {
        context.fillStyle="white";

        context.beginPath();
        context.arc(this.pos.x, this.pos.y, this.radius+1, 0, 2*Math.PI);
        context.fill();
    }

    this.trace = function (context) {
        this.clear(context);
        context.fillStyle="red";

        context.beginPath();
        var ev = this.v.multiply(-this.radius/this.v.norm());
        context.arc(this.pos.x+ev.x, this.pos.y+ev.y, 0.5, 0, 2*Math.PI);
        context.fill();
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
