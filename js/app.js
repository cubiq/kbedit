/*
	 _____ _____ _____ ____  __ _____
	|  |  | __  |   __|    \|  |_   _|
	|    —| __ —|   __|  |  |  | | |
	|__|__|_____|_____|____/|__| |_|

	KBEdit ~ Keyboard Designer
	Copyright (C) 2014 Matteo Spinelli

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

var KBE = {};

(function (window, document) {

// main application instance
var _instance;

// singleton
function KBE () {
	_instance = _instance || new KBE.Class();

	return _instance;
}

// grid size
KBE.GRID_UNIT_X = 14;	// equals to 0.25u
KBE.GRID_UNIT_Y = 14;
KBE.UNIT_WIDTH = KBE.GRID_UNIT_X * 4;	// 1u key
KBE.UNIT_HEIGHT = KBE.GRID_UNIT_Y * 4;

// max number of keys on stage
KBE.MAX_KEYS = 300;

// our main app class
KBE.Class = function () {
	KBE.$stage = this.$stage = $('#stage');

	// holds all the keyboard keys
	this.keys = [];

	// current mouse position
	this.mouseX = 0;
	this.mouseY = 0;

	// stage X/Y position
	this.stageX = 0;
	this.stageY = 0;

	// stage margins
	this.stageMaxX = $('#wrapper').width() - this.$stage.width();
	this.stageMaxY = $('#wrapper').height() - this.$stage.height();

	// update margins on window resize
	$(window).on('resize', $.proxy(this.resize, this));

	// create the hud
	this.hud = new KBE.Hud();

	// initiate the stage drag/drop and selection
	this.$stage.on('mousedown', $.proxy(this.stageMouseAction, this));

	// create the selection manager
	KBE.select = this.select = new KBE.Selection();

	$('body')
		// update the current mouse position
		.on('mousemove', $.proxy(this.mouse, this))
		// register keyboard shortcuts
		.on('keydown', $.proxy(this.shortcuts, this));
};

KBE.Class.prototype = {
	resize: function (e) {
		this.stageMaxX = $('#wrapper').width() - this.$stage.width();
		this.stageMaxY = $('#wrapper').height() - this.$stage.height();
	},

	mouse: function (e) {
		this.mouseX = e.pageX;
		this.mouseY = e.pageY;
	},

	shortcuts: function (e) {
		//console.log(e.which);

		switch ( e.which ) {
			// DEL: delete selected keys
			case 8:
			case 46:
				e.preventDefault();
				this.deleteSelectedKey();
				break;
			// 1: create a 1x1 units key
			case 49:
				e.preventDefault();
				this.createKey({
					unitX: 100,
					x: this.mouseX,
					y: this.mouseY
				});
				break;
			// 2: create a 2x1 units key
			case 50:
				e.preventDefault();
				this.createKey({
					unitX: 625,
					x: this.mouseX,
					y: this.mouseY
				});
				break;
			// 3: create a 1x2 units key
			case 51:
				e.preventDefault();
				this.createKey({
					unitY: 200,
					x: this.mouseX,
					y: this.mouseY
				});
				break;
			// 4: create an ISO return
		}
	},

	createKey: function (options) {
		if ( this.keys.length >= KBE.MAX_KEYS ) {
			alert('I can\'t display more than ' + KBE.MAX_KEYS + ' keys on stage.');
			return;
		}

		options = options || {};
		options.x = Math.floor(((options.x || 0) - this.stageX) / KBE.UNIT_WIDTH) * KBE.UNIT_WIDTH;
		options.y = Math.floor(((options.y || 0) - this.stageY) / KBE.UNIT_HEIGHT) * KBE.UNIT_HEIGHT;
		options.unitX = options.unitX || 100;
		options.unitY = options.unitY || 100;

		var key = new KBE.Key(options);
		this.keys.push(key);

		// update the selection
		this.select.clear();
		this.select.add(key);
	},

	deleteSelectedKey: function () {
		var that = this;

		$.each(this.select.keys, function (i, key) {
			var pos = $.inArray(key, that.keys);

			if ( pos > -1 ) {
				key.remove();				// delete the DOM element
				that.keys[pos] = null;		// help the garbage collector?
				that.keys.splice(pos, 1);	// remove from the array of keys
			}
		});

		this.select.clear();
	},

	colorSelected: function (value) {
		$.each(this.select.keys, function (i, key) {
			key.color(value);
		});
	},

	stageMouseAction: function (e) {
		e.preventDefault();
		e.stopPropagation();

		this.startX = e.pageX;
		this.startY = e.pageY;

		// left click + CTRL = pan stage
		if ( e.which == 1 && e.ctrlKey ) {
			this.$stage
				.on('mousemove', $.proxy(this.pan, this))
				.on('mouseup', $.proxy(this.panEnd, this));

		// left click = start box select
		} else if ( e.which == 1 ) {
			this.startX -= this.stageX;
			this.startY -= this.stageY;

			// check if we clicked over a key
			var rect1 = {};
			var rect2 = {
				x1: this.startX,
				y1: this.startY,
				x2: this.startX,
				y2: this.startY
			};

			var that = this;
			var newSelection;
			// check if we clicked over a key
			$.each(this.keys, function (i, key) {
				rect1 = {
					x1: key.x,
					y1: key.y,
					x2: key.x + key.width,
					y2: key.y + key.height
				};

				if ( KBE.collision(rect1, rect2) ) {
					if ( that.select.isSelected(key) ) {
						return false;
					}

					if ( !e.shiftKey ) {
						that.select.clear();
					}

					that.select.add(key);
					newSelection = true;

					return false;	// exit the $.each loop
				}
			});

			// if we clicked on a key we initiate the drag sequence
			if ( !this.select.isEmpty() && ( e.target == this.select.$selectBox.get(0) || newSelection ) ) {
				that.select.dragStart(e);
				return;
			}

			if ( !e.shiftKey ) {
				this.select.clear();
			}

			// create the selection box
			this.$selectBox = $('<div>')
				.addClass('selectBox include')
				.css({
					top: this.startY + 'px',
					left: this.startX + 'px'
				});

			this.$stage.append(this.$selectBox);

			this.$stage
				.on('mousemove', $.proxy(this.selectBox, this))
				.on('mouseup', $.proxy(this.selectBoxEnd, this));
		}
	},

	selectBox: function (e) {
		var width = e.pageX - this.stageX - this.startX;
		var height = e.pageY - this.stageY - this.startY;
		var css = {
			width: Math.abs(width) + 'px',
			height: Math.abs(height) + 'px'
		};
		var type = 'include';

		if ( width < 0 ) {
			css.left = 'auto';
			css.right = this.$stage.width() - this.startX;
			type = 'hit';
		} else {
			css.left = this.startX;
			css.right = 'auto';
		}

		if ( height < 0 ) {
			css.top = 'auto';
			css.bottom = this.$stage.height() - this.startY;
		} else {
			css.top = this.startY;
			css.bottom = 'auto';
		}

		this.$selectBox
			.css(css)
			.removeClass('hit')
			.removeClass('include')
			.addClass(type);
	},

	selectBoxEnd: function (e) {
		this.$stage
			.off('mousemove', this.selectBox)
			.off('mouseup', this.selectBoxEnd);

		var deltaX = e.pageX - this.stageX - this.startX;
		var deltaY = e.pageY - this.stageY - this.startY;
		var type = (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) || deltaX < 0 ? 'hit' : 'include';

		var pos = this.$selectBox.position();

		var rect1 = {};
		var rect2 = {
			x1: pos.left,
			y1: pos.top,
			x2: pos.left + this.$selectBox.width(),
			y2: pos.top + this.$selectBox.height()
		};

		this.$selectBox.remove();

		$.each(this.keys, function (i, key) {
			rect1 = {
				x1: key.x,
				y1: key.y,
				x2: key.x + key.width,
				y2: key.y + key.height
			};

			if ( KBE.collision(rect1, rect2, type) ) {
				KBE.select.add(key);
			}
		});
	},

	pan: function (e) {
		// user released the mouse button outside of the window
		if ( !e.which ) {
			this.panEnd(e);
			return;
		}

		var deltaX = this.startX - e.pageX;
		var deltaY = this.startY - e.pageY;

		this.stageX -= deltaX;
		this.stageY -= deltaY;

		if ( this.stageX > 0 ) {
			this.stageX = 0;
		} else if ( this.stageX < this.stageMaxX ) {
			this.stageX = this.stageMaxX;
		}

		if ( this.stageY > 0 ) {
			this.stageY = 0;
		} else if ( this.stageY < this.stageMaxY ) {
			this.stageY = this.stageMaxY;
		}

		this.startX = e.pageX;
		this.startY = e.pageY;

		this.$stage.css({
			top: this.stageY + 'px',
			left: this.stageX + 'px'
		});
	},

	panEnd: function (e) {
		e.preventDefault();
		e.stopPropagation();

		this.$stage
			.off('mousemove', this.pan)
			.off('mouseup', this.panEnd);
	}
};

KBE.collision = function (a, b, type) {
	if ( type == 'include' ) {
		return a.x1 >= b.x1 && a.x2 <= b.x2 && a.y1 >= b.y1 && a.y2 <= b.y2;
	}

	return a.x1 <= b.x2 && b.x1 <= a.x2 && a.y1 <= b.y2 && b.y1 <= a.y2;
};

window.KBE = KBE;

})(window, document);