"use strict";
class Canvas {
	constructor(canvas) {
		if (!(canvas instanceof HTMLCanvasElement)) {
			canvas = document.querySelector("canvas#screen");
			if (!(canvas instanceof HTMLCanvasElement))
				canvas = document.createElement("canvas");
		}
		this.screen = canvas;
		this.onresize = function() {};
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
	}
	line() {
		this.beginPath().moveTo(arguments[0], arguments[1]);
		for (let i = 2; i < arguments.length - 1; i += 2)
			this.lineTo(arguments[i], arguments[i + 1]);
		return this.closePath();
	}
	set fullscreen(bool) {
		var _self = this;
		var resize = function() {
			_self.width = window.innerWidth;
			_self.height = window.innerHeight;
			_self.onresize();
		};
		resize();
		var a = ["add", "remove"][bool ? 0 : 1];
		window[a + "EventListener"]("resize", resize, false);
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
class Viewer extends Canvas {
	constructor(canvas) {
		super(canvas);
		this.track = new Track();
		this.onresize = this.render;
	}
	render() {
		this.save()
			.clearRect(0, 0, this.width, this.height)
		this.save()
			.translate(this.center.x, this.center.y)
			.strokeWidth(2)
			.lineCap("round");
		for (let n = 1; n >= 0; n--) {
			var color = ["black", "gray"][n];
			var group = this.track[color];
			this.strokeStyle(color);
			for (let i = 0; i < group.lines.length; i++) {
				var line = group.lines[i];
				this.line.apply(this, line.points).stroke();
			}
		}
		this.restore();
	}
}

var viewer = new Viewer();
viewer.track = Track.fromString("-1i 1i 1i 1i##");
viewer.screen.style.border = "1px solid black";
document.body.appendChild(viewer.screen);
viewer.fullscreen = true;