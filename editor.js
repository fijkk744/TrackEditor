"use strict";

class Renderer {
	constructor(canvas) {
		if (!(canvas instanceof HTMLCanvasElement)) {
			canvas = document.querySelector("canvas#screen");
			if (!(canvas instanceof HTMLCanvasElement)) {
				canvas = document.createElement("canvas");
				console.log("Canvas needs to be appended");
			}
		}
		this.screen = canvas;
		var parent = this.screen.parentNode;
		this.resize(
			parent.clientWidth || window.innerWidth,
			canvas.clientHeight * 4 || window.innerHeight
		);
		for (let name in this.context) {
			if (typeof this.context[name] == "function")
				this[name] = function() {
					this.context[name].apply(this.context, arguments);
					return this;
				};
			else
				this[name] = function() {
					var arg = arguments[0];
					if (arg === void 0)
						return this.context[name];
					this.context[name] = arg;
					return this;
				};
		}
		this.devMode = true;
		this.transform = {
			scale: 1,
			translate: {
				x: 0,
				y: 0
			}
		};
		this.cursor = {
			x: null,
			y: null
		};
		var _self = this;
		this.screen.addEventListener("mousemove", function(e) {
			_self.cursor.x = e.offsetX;
			_self.cursor.y = e.offsetY;
		}, false);
	}
	sprite(id, x, y, size, radians) {
		var img = document.querySelector("img.sprite#" + id);
		try {
			this.save();
			if (typeof rotation == "number")
				this.rotate(radians);
			this.beginPath()
				.drawImage(img, x - size / 2, y - size / 2, size, size)
				.restore();
		} catch(e) {
			return this;
		}
		if (this.devMode)
			this.save()
				.strokeStyle("blue")
				.strokeRect(x - size / 2, y - size / 2, size, size)
				.restore();
		return this;
	}
	line() {
		this.beginPath()
			.moveTo(arguments[0], arguments[1]);
		for (let i = 2; i < arguments.length - 1; i += 2)
			this.lineTo(arguments[i], arguments[i + 1]);
		return this;
	}
	render() {}
	/*
	set fullscreen(bool) {
		var _self = this;
		var resize = function() {
			var b = _self.screen.parentElement.getBoundingClientRect();
			_self.width = b.width;
			_self.height = b.height;
			_self.onresize.call(_self);
		};
		resize();
		var a = ["add", "remove"][bool ? 0 : 1];
		window[a + "EventListener"]("resize", resize, false);
	}*/
	resize(width, height) {
		this.width = width;
		this.height = height;
	}
	get width() { return this.screen.width; }
	get height() { return this.screen.height; }
	set width(n) { this.screen.width = n; }
	set height(n) { this.screen.height = n; }
	get context() { return this.screen.getContext("2d"); }
	get center() {
		return {
			x: this.width / 2,
			y: this.height / 2
		};
	}
}

class Viewer extends Renderer {
	constructor(canvas) {
		super(canvas);
		var _self = this;
		this.track = new Track();
		this.screen.style.background = "blue";
		console.log(this.width, this.height);
		this.cursor.show = false;
		this.grid = {
			size: 200,
			show: true
		};
		//EVENTS

		
		this.screen.addEventListener("mouseover", function() {
			_self.cursor.show = true;
		}, false);
		this.screen.addEventListener("mouseout", function() {
			_self.cursor.show = false;
		}, false);

		var mousedown = null;
		function zoom(e) {
			var z = 1 + Math.sign(e.deltaY) / 20;
			var future = _self.transform.scale + z - 1;
			if (future < 0 || future > 3)
				return;
			_self.translate(e.offsetX, e.offsetY)
				.scale(z, z)
				.translate(-e.offsetX, -e.offsetY);
			_self.transform.scale = future;
			_self.render();
		}

		function pan(e) {
			if (!mousedown) return;
			var scale = 1 / _self.transform.scale;
			_self.translate(
				scale * (e.offsetX - mousedown.offsetX),
				scale * (e.offsetY - mousedown.offsetY)
			);
			_self.render();
			mousedown = e;
		}

		this.screen.addEventListener("mousedown", function(e) {
			mousedown = e;
		}, false);
		this.screen.addEventListener("mouseup", function(e) {
			mousedown = null;
		}, false);
		this.screen.addEventListener("mousemove", pan, false);
		this.screen.addEventListener("wheel", zoom, false);
		this.lineCap("round")
			.textAlign("left")
			.textBaseline("top")
			.font("20px Arial Black");
	}
	render() {
		var point = this.contextualize(this.cursor.x, this.cursor.y);
		this.save()
			.setTransform(1, 0, 0, 1, 0, 0)
			.clearRect(0, 0, this.width, this.height)
			.fillText(Math.round(this.transform.scale * 10000) / 100 + "%", 0, 0)
			.fillText(point.x + ", " + point.y, 0, 40)
			.fillText(this.cursor.x + ", " + this.cursor.y, 0, 80)
			.restore()
			.save()
			.translate(this.center.x, this.center.y);
		if (this.grid.show) {
			for (let n = -20; n <= 20; n++) {
				var s = this.grid.size;
				this.line(s * n, -20 * s, s * n, 20 * s)
					.stroke()
					.line(-20 * s, s * n, 20 * s, s * n)
					.stroke();
			}
		}
		this.sprite("biker", 0, 0, 100)
			.lineWidth(2);
		for (let n = 1; n >= 0; n--) {
			var color = ["black", "gray"][n];
			var group = this.track[color];
			this.strokeStyle(color);
			for (let i = 0; i < group.lines.length; i++)
				this.line.apply(this, group.lines[i].points)
					.stroke();
		}
		this.restore();
	}
	contextualize(x, y) {
		return {
			x: x - this.center.x + this.transform.translate.x,
			y: y - this.center.y + this.transform.translate.y
		};
	}
}