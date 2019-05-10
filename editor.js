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
		for (let name in this.context) {
			var a = name.match(/[a-z]+[A-Z]?/g);
			
			var sub = name.substring(name.indexOf(s) + s.length);
			if 
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
			scale: 1
		};
	}
	sprite(id, x, y, size, radians) {
		var img = document.querySelector("img.sprite#" + id);
		this.save();
		if (typeof rotation == "number")
			this.rotate(radians);
		try {
			this.beginPath()
			.drawImage(img, x - size / 2, y - size / 2, size, size)
			.restore();
		} catch(err) {
			console.warn("Could not load image \"" + id + "\"");
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
		this.beginPath().moveTo(arguments[0], arguments[1]);
		for (let i = 2; i < arguments.length - 1; i += 2)
			this.lineTo(arguments[i], arguments[i + 1]);
		return this.closePath();
	}
	render() {}
	set fullscreen(bool) {
		var _self = this;
		var a = ["add", "remove"][bool ? 0 : 1];
		function resize() {
			_self.width = _self.screen.parentElement.clientWidth - 10;
			_self.height = _self.screen.parentElement.clientHeight - 10;
			console.log(_self.width, _self.height);
		}
		resize();
		window[a + "EventListener"]("resize", resize, false);
	}
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
		this.track = new Track();
		this.gridSize = 200;
		this.showGrid = true;
		//EVENTS
		var _self = this;
		var mousedown = null;

		function pan(e) {
			if (!mousedown) return;
			var scale = _self.transform.scale;
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
		this.screen.addEventListener("mouseup", function() {
			mousedown = null;
		}, false);
		this.screen.addEventListener("mousemove", pan, false);
		/*this.screen.addEventListener("wheel", function(e) {
			var scale = 1 + 1 / e.deltaY;
			_self.scale(scale, scale);
			_self.render();
		}, false);*/
		this.lineCap("round");
	}
	render() {
		this.save()
			.setTransform(1, 0, 0, 1, 0, 0)
			.clearRect(0, 0, this.width, this.height)
			.restore();
		this.save()
			.translate(this.center.x, this.center.y)
			.scale(this.transform.scale, this.transform.scale)
			.sprite("biker", 0, 0, 100)
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
}

/*
function(){
	var t = window.innerHeight,
		e = window.innerWidth;
	if (!this.settings.fullscreen && !this.settings.isStandalone) {
		var i = this.gameContainer;
		t = i.clientHeight,
		e = i.clientWidth
	}
	if (this.currentScene) {
		var s = this.currentScene.getCanvasOffset();
		t -= s.height
	}
	var n = 1;
	if (window.devicePixelRatio !== void 0)
		n = window.devicePixelRatio;
	if (this.settings.lowQualityMode)
		n = 1;
	//void 0 !== window.devicePixelRatio && (n=window.devicePixelRatio),this.settings.lowQualityMode && (n=1);

	var r = e * n,
		o = t * n;
	(r !== this.width || o !== this.height) && 
	(this.width = r, 
	this.height = o,
	this.canvas.width = r,
	this.canvas.height = o),

	this.pixelRatio = n,this.canvas.style.width=e+"px",this.canvas.style.height=t+"px",this.currentScene&&this.currentScene.command("resize")}
*/
