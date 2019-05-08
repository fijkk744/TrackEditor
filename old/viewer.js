class Viewer {
	constructor(track) {
		this.track = track;
		this.mode = "move";
		this.$scale = 1;
		if (!(track instanceof Track)) {
			this.track = new Track();
			if (typeof track == "function")
				track.call(this.track);
		}
		this.screen = document.querySelector("canvas#screen");
		if (!this.screen) {
			this.screen = document.createElement("canvas");
			this.screen.id = "screen";
			document.body.appendChild(this.screen);
		}
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.performanceSaver = false;
		this.render();
		/* EVENTS */
		var _self = this;
		var mousedown = null;
		this.screen.addEventListener("mousedown", function(e) {
			mousedown = new Point(e.offsetX, e.offsetY);
		}, false);
		this.screen.addEventListener("mouseup", function(e) {
			if (_self.performanceSaver) {
				var current = new Point(e.offsetX, e.offsetY);
				_self.translate(mousedown, current);
				_self.render();
			}
			mousedown = null;
		}, false);
		this.screen.addEventListener("mousemove", function(e) {
			if (mousedown === null || _self.performanceSaver)
				return;
			var current = new Point(e.offsetX, e.offsetY);
			_self.translate(mousedown, current);
			mousedown = current;
			_self.render();
		}, false);
		this.screen.addEventListener("wheel", function(e) {
			var point = new Point(e.offsetX, e.offsetY);
			_self.scale(point, e.deltaY);
			_self.render();
		}, false);
		window.addEventListener("keydown", function(e) {
			if (e.key == "Shift") {
				e.preventDefault();
				_self.mode = "transform";
				_self.render();
			}
		}, false);
		window.addEventListener("keyup", function(e) {
			if (e.key == "Shift") {
				e.preventDefault();
				_self.mode = "move";
				_self.render();
			}
		}, false);
		window.addEventListener("resize", function() {
			_self.width = this.innerWidth;
			_self.height = this.innerHeight;
			_self.render();
		}, false);
	}
	scale(point, d) {
		var ctx = this.context;
		var z = 1 - Math.sign(d) / 20;
		if (this.mode == "move") {
			ctx.translate(point.x, point.y);
			ctx.scale(z, z);
			ctx.translate(-point.x, -point.y);
		} else if (this.mode == "transform")
			Track.scale(this.track, z, z);
		this.$scale += z;
	}
	translate(p1, p2) {
		var d = new Point(p2.x - p1.x, p2.y - p1.y);
		var s = 1 + 1 / this.$scale;
		d.x *= s;
		d.y *= s;
		if (this.mode == "move")
			this.context.translate(d.x, d.y);
		else if (this.mode == "transform")
			Track.translate(this.track, d.x, d.y);
		else if (this.mode == "draw")
			this.constructor.brushes[this.brush](p1, p2);
	}
	resetTransform() {
		this.context.setTransform(1, 0, 0, 1, 0, 0);
	}
	clear() {
		var ctx = this.context;
		ctx.save();
		this.resetTransform();
		ctx.clearRect(0, 0, this.width, this.height);
		ctx.restore();
	}
	renderPowerup(p) {
		var ctx = this.context;
		var c = this.center;
		var standard = {
			"goal": "gold",
			"boost": "green",
			"gravity": "blue",
			"slowmo": "white",
			"bomb": "red",
			"checkpoint": "indigo",
			"antigravity": "aqua",
			"teleporter": "magenta"
		};
		var vehicles = {
			"helicopter": "orange",
			"truck": "green",
			"balloon": "red",
			"blob": "purple"
		};
		ctx.save();
		ctx.lineJoin = "round";
		function draw(x, y) {
			ctx.beginPath();
			if (p instanceof Vehicle) {
				ctx.fillStyle = vehicles[p.type];
				ctx.rect(p.x + c.x - 10, p.y + c.y - 10, 20, 20);
			} else {
				ctx.fillStyle = standard[p.type];
				ctx.arc(x + c.x, y + c.y, 10, 0, 2 * Math.PI);
			}
			ctx.fill();
			ctx.stroke();
		}
		draw(p.x, p.y);
		if (p.type == "teleporter")
			draw(p.data[0], p.data[1]);
		ctx.restore();
	}
	render() {
		var ctx = this.context;
		var center = this.center;
		this.clear();
		ctx.save();
		ctx.lineWidth = 2;
		ctx.lineCap = ctx.lineJoin = "round";
		for (let n = 1; n >= 0; n--) {
			var g = ["black", "gray"][n];
			ctx.strokeStyle = g;
			for (let p = 0; p < this.track[g].lines.length; p++) {
				var line = this.track[g].lines[p];
				ctx.beginPath();
				for (let i = 0; i < line.points.length - 1; i += 2) {
					var method = i == 0 ? "moveTo" : "lineTo";
					ctx[method](center.x + line.points[i], center.y + line.points[i + 1]);
				}
				ctx.stroke();
			}
		}
		for (let i = 0; i < this.track.powerups.length; i++)
			this.renderPowerup(this.track.powerups[i]);
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.fillStyle = this.mode == "move" ? "red" : "blue";
		ctx.strokeStyle = "black";
		ctx.arc(center.x, center.y, 2.5, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
	get center() {
		return new Point(this.width / 2, this.height / 2);
	}
	get context() {
		return this.screen.getContext("2d");
	}
	get width() { return this.screen.width; }
	get height() { return this.screen.height; }
	set width(n) { this.screen.width = n; }
	set height(n) { this.screen.height = n; }
}