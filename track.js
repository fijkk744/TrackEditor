"use strict";
class Point {
	constructor(x, y) {
		this.x = x || null;
		this.y = y || null;
	}
	toString() {
		return "(" + [this.x, this.y] + ")";
	}
}
class Line {
	constructor() {
		var args = arguments;
		if (args[0] instanceof Array)
			args = args[0];
		this.points = args;
	}
	toString() {
		var a = [];
		for (let i = 0; i < this.points.length; i++)
			a[i] = Track.encode(this.points[i]);
		return a.join(" ");
	}
}
Line.fromString = function(string) {
	var a = string.split(" ");
	for (let i = 0; i < a.length; i++)
		a[i] = Track.decode(a[i]);
	return new this(a);
};
class Group {
	constructor() {
		this.lines = [];
	}
	add(line) {
		if (line instanceof Line)
			this.lines.push(line);
		else if (line instanceof Group)
			for (let i = 0; i < line.lines.length; i++)
				this.add(line.lines[i]);
	}
	toString() {
		var a = [];
		for (let i = 0; i < this.lines.length; i++)
			a[i] = this.lines[i].toString();
		return a.join(",");
	}
}
Group.fromString = function(string) {
	var group = new this();
	if (string == "")
		return group;
	var a = string.split(",");
	for (let i = 0; i < a.length; i++)
		group.add(Line.fromString(a[i]));
	return group;
};
class Powerup {
	constructor() {
		this.type = arguments[0];
		this.x = arguments[1];
		this.y = arguments[2];
		this.data = [];
		for (let i = 3; i < arguments.length; i++)
			this.data.push(arguments[i]);
	}
	set type(type) {
		if (typeof type == "string")
			type = type.toLowerCase();
		if (!(type in this.constructor.types))
			throw new Error("invalid type");
		this.$type = type;
	}
	get type() { return this.$type; }
	get tag() {
		return this.constructor.types[this.type];
	}
	toString() {
		var a = [this.tag, this.x, this.y];
		for (let i = 0; i < this.data.length; i++)
			a.push(this.data[i]);
		for (let i = 1; i < a.length; i++)
			a[i] = Track.encode(a[i]);
		return a.join(" ");
	}
}
Powerup.fromString = function(string) {
	var a = string.split(" ");
	var type = null;
	for (let t in this.types)
		if (a[0] == this.types[t]) {
			type = t;
			break;
		}
	var p = new this(type, a[1], a[2]);
	for (let i = 3; i < a.length; i++)
		p.data.push(a[i]);
	return p;
};
Powerup.types = {
	"goal": "T",
	"boost": "B",
	"gravity": "G",
	"slowmo": "S",
	"bomb": "O",
	"checkpoint": "C",
	"antigravity": "A",
	"teleporter": "W"
};
class Vehicle extends Powerup {
	constructor() {
		super(arguments[0], arguments[1], arguments[2]);
		this.data[0] = this.constructor.types[this.type];
		for (let i = 3; i < arguments.length; i++)
			this.data.push(arguments[i]);
	}
	toString() {
		var d = this.data[1];
		if (d <= 60)
			return super.toString();
		var a = [];
		do {
			let n = d % 60;
			if (n == 0) n = 60;
			var copy = Object.create(this);
			copy.data[1] = n;
			a.push(copy.toString());
			d -= n;
		} while (d > 0);
		return a.join(",");
	}
	get tag() { return "V"; }
}
Vehicle.fromString = function(string) {
	var a = string.split(" ");
	var type = null;
	for (let t in this.types)
		if (a[1] == this.types[t]) {
			type = t;
			break;
		}
	var v = new this(type, a[1], a[2]);
};
Vehicle.types = {
	"helicopter": "1",
	"truck": "2",
	"balloon": "3",
	"blob": "4"
};
class Track {
	constructor() {
		this.clear();
	}
	add(obj, mode) {
		if (mode != 1)
			mode = 0;
		if (obj instanceof Line || obj instanceof Group)
			this[["black", "gray"][mode]].add(obj);
		else if (obj instanceof Powerup)
			this.powerups.push(obj);
		else if (obj instanceof Track) {
			this.black.add(obj.black);
			this.gray.add(obj.gray);
			for (let i = 0; i < obj.powerups.length; i++)
				this.add(obj.powerups[i]);
		}
	}
	clear() {
		this.black = new Group();
		this.gray = new Group();
		this.powerups = [];
	}
	toString() {
		var powerups = [];
		for (let i = 0; i < this.powerups.length; i++)
			powerups[i] = this.powerups[i].toString();
		return [
			this.black.toString(),
			this.gray.toString(),
			powerups.join(",")
		].join("#");
	}
	get length() {
		return this.toString().length;
	}
}
Track.encode = function(n) {
	return parseInt(n).toString(32);
};
Track.decode = function(s) {
	return parseInt(s, 32);
};
Track.fromString = function(string) {
	if (typeof string != "string" || string.match(/#/g).length != 2)
		return;
	var a = string.split("#");
	var track = new this();
	for (let i = 0; i < 2; i++)
		track[["black", "gray"][i]].add(Group.fromString(a[i]));
	var powerups = a[2].split(",");
	if (powerups[0].length > 0) {
		for (let i = 0; i < powerups.length; i++) {
			track.add(Powerup.fromString(powerups[i]));
			console.log(powerups[i]);
		}
	}
	return track;
};
Track.alter = function(obj, key) {
	/* key(point) -> Point */
	if (obj instanceof Line) {
		for (let i = 0; i < obj.points.length - 1; i += 2) {
			var p = key(new Point(obj.points[i], obj.points[i + 1]));
			obj.points[i] = p.x;
			obj.points[i + 1] = p.y;
		}
	} else if (obj instanceof Group) {
		for (let i = 0; i < obj.lines.length; i++)
			this.alter(obj.lines[i], key);
	} else if (obj instanceof Powerup) {
		var p = key(new Point(obj.x, obj.y));
		obj.x = p.x;
		obj.y = p.y;
	} else if (obj instanceof Track) {
		this.alter(obj.black, key);
		this.alter(obj.gray, key);
		for (let i = 0; i < obj.powerups.length; i++)
			this.alter(obj.powerups.length, key);
	}
};
Track.translate = function(obj, x, y) {
	this.alter(obj, function(point) {
		return new Point(point.x + x, point.y + y);
	});
};
Track.scale = function(obj, x, y) {
	this.alter(obj, function(point) {
		return new Point(x * point.x, y * point.y);
	});
};

Track.get = function(id) {
	/* Needs local debugging */
	var url = "https://cdn.freeriderhd.com/free_rider_hd/tracks/prd/" + id + "/track-data-v1.js";
	var track = new Track();
	var response = null;
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (!(this.readyState == 4 && this.status == 200))
			return;
		response = this.responseText;
		track.add(Track.fromString("##"));
	};
	xhttp.open("GET", url, true);
	xhttp.send();
	return track;
};
class Rect extends Line {
	constructor(x, y, w, h) {
		super(x, y, x + w, y, x + w, y + h, x, y + h, x, y);
	}
}
class FilledRect extends Group {
	constructor(x, y, w, h) {
		super();
		for (let i = 0; i <= h; i++)
			this.add(new Line(x, y + i, x + w, y + i));
	}
}
class FilledCircle extends Group {
	constructor(x, y, r) {
		super();
		for (let k = r; k >= 0; k--)
			for (let h = r; h >= 0; h--)
				if (Math.hypot(h, k) <= r) {
					for (let n = -1; n <= 1; n += 2)
						this.add(new Line(x - h, y + n * k, x + h, y + n * k));
					break;
				}
	}
}
class TrackImage extends Track {
	constructor(path) {
		super();
		this.image = new Image();
		this.image.src = path;
		this.ready(function() {
			var can = document.createElement("canvas");
			var ctx = can.getContext("2d");
			can.width = this.image.width;
			can.height = this.image.height;
			ctx.drawImage(this.image, 0, 0);
			var data = ctx.getImageData(0, 0, can.width, can.height).data;
			var weights = [0.2989, 0.5870, 0.1140];
			for (let y = 0; y < can.height; y++) {
				var c = 0;
				var m = 0;
				for (let x = 0; x < can.width; x++) {
					var index = 4 * (x + y * can.width);
					var value = 0;
					for (let i = 0; i < 3; i++)
						value += weights[i] * data[index + i] / 255;
					var mode = 2;
					for (let i = 1; i <= 2; i++)
						if (value <= i / 3) {
							mode = i - 1;
							break;
						}
					if (mode != m || x == can.width - 1) {
						if (m < 2)
							this.add(new Line(c, y, x, y), m);
						c = x;
					}
					m = mode;
				}
			}
		});
	}
	ready(fun) {
		var _self = this;
		this.image.addEventListener("load", function() {
			fun.apply(_self);
		}, false);
		return this;
	}
}