KBE.Selection = (function (undefined) {

function Selection () {
	this.keys = [];
	this.$selectBox = undefined;
	this.x1 = 99999;
	this.x2 = 0;
	this.y1 = 99999;
	this.y2 = 0;

//	KBE.$stage.on('click', $.proxy(this.clear, this));
}

Selection.prototype = {
	clear: function () {
		if ( !this.keys.length ) {
			return;
		}

		$.each(this.keys, function (i, key) {
			key.$element.removeClass('selected');
		});

		this.keys = [];

		this.$selectBox.remove();	// it seems jquery already removes all events, eventually...
		this.$selectBox = undefined;
	},

	add: function (key) {
		if ( $.inArray(key, this.keys) > -1 ) {
			return;
		}

		this.keys.push(key);
		key.$element.addClass('selected');

		this.updateSelectBox();
	},

	remove: function (key) {
		var pos = $.inArray(key, this.keys);

		if ( pos > -1 ) {
			this.keys.splice(pos, 1);
		}
	},

	isEmpty: function () {
		return !this.$selectBox;
	},

	isSelected: function (key) {
		return $.inArray(key, this.keys) == -1 ? false : true;
	},

	updateSelectBox: function () {
		if ( this.keys.length === 0 ) {
			this.$selectBox.remove();
			this.$selectBox = undefined;
			return;
		}

		// create the select box element if needed
		if ( !this.$selectBox ) {
			this.$selectBox = $('<div>')
				.addClass('marquee')
				.css({
					top: this.y1 + 'px',
					left: this.x1 + 'px',
					width: this.x2 - this.x1 + 1 + 'px',
					height: this.y2 - this.y1 + 1 + 'px'
				})
				.html('<div class="resize-handle resize-se"></div>');

			KBE.$stage.append(this.$selectBox);

			// drag event
			this.$selectBox.on('mousedown', $.proxy(this.dragStart, this));

			// resize event
			$('.resize-se', this.$selectBox)
				.on('mousedown', $.proxy(this.resizeStart, this));
		}

		var that = this;
		var x1 = Infinity;
		var x2 = 0;
		var y1 = Infinity;
		var y2 = 0;

		$.each(this.keys, function (i, key) {
			if ( key.x < x1 ) {
				x1 = key.x;
			}

			if ( key.y < y1 ) {
				y1 = key.y;
			}

			var tmpX = key.x + key.unitX / 25 * KBE.GRID_UNIT_X;
			var tmpY = key.y + key.unitY / 25 * KBE.GRID_UNIT_Y;

			if ( tmpX > x2 ) {
				x2 = tmpX;
			}

			if ( tmpY > y2 ) {
				y2 = tmpY;
			}
		});

		this.x1 = x1;
		this.x2 = x2;
		this.y1 = y1;
		this.y2 = y2;

		this.$selectBox.css({
			top: this.y1 + 'px',
			left: this.x1 + 'px',
			width: this.x2 - this.x1 + 1 + 'px',
			height: this.y2 - this.y1 + 1 + 'px'
		});
	},

	resizeStart: function (e) {
		if ( e.which != 1 ) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		this.pointStartX = e.pageX;
		this.pointStartY = e.pageY;

		$.each(this.keys, function (i, key) {
			key.$element.addClass('resizing');
		});

		KBE.$stage
			.on('mousemove', $.proxy(this.resize, this))
			.on('mouseup', $.proxy(this.resizeEnd, this));
	},

	resize: function (e) {
		var deltaX = e.pageX - this.pointStartX;
		var deltaY = e.pageY - this.pointStartY;

		if ( Math.abs(deltaX) < KBE.GRID_UNIT_X ) {
			deltaX = 0;
		} else {
			this.pointStartX = e.pageX;
		}

		if ( Math.abs(deltaY) < KBE.GRID_UNIT_Y ) {
			deltaY = 0;
		} else {
			this.pointStartY = e.pageY;
		}

		if ( deltaX === 0 && deltaY === 0 ) {
			return;
		}

		// key size is in units so we can change the grid and the code doesn't break. 1 unit = 100, 1 grid unit = 25.
		deltaX = Math.floor(Math.abs(deltaX) / KBE.GRID_UNIT_X) * (deltaX < 0 ? -25 : 25);
		deltaY = Math.floor(Math.abs(deltaY) / KBE.GRID_UNIT_Y) * (deltaY < 0 ? -25 : 25);

		$.each(this.keys, function (i, key) {
			key.resize(deltaX, deltaY);
		});

		this.updateSelectBox();
	},

	resizeEnd: function (e) {
		$.each(this.keys, function (i, key) {
			key.$element.removeClass('resizing');
		});

		KBE.$stage
			.off('mousemove', this.resize)
			.off('mouseup', this.resizeEnd);
	},

	dragStart: function (e) {
		if ( e.which != 1 ) {
			return;
		}

		this.dragged = false;

		this.dragStartX = e.pageX;
		this.dragStartY = e.pageY;

		KBE.$stage
			.on('mousemove', $.proxy(this.drag, this))
			.on('mouseup', $.proxy(this.dragEnd, this));
	},

	drag: function (e) {
		e.preventDefault();
		e.stopPropagation();

		var deltaX = this.dragStartX - e.pageX;
		var deltaY = this.dragStartY - e.pageY;

		deltaX = Math.floor(Math.abs(deltaX) / KBE.GRID_UNIT_X) * KBE.GRID_UNIT_X * (deltaX && deltaX / Math.abs(deltaX));
		deltaY = Math.floor(Math.abs(deltaY) / KBE.GRID_UNIT_Y) * KBE.GRID_UNIT_Y * (deltaY && deltaY / Math.abs(deltaY));

		if ( !deltaX && !deltaY ) {
			return;
		}

		this.dragged = true;

		if ( deltaX !== 0 ) {
			this.dragStartX = e.pageX;
		}

		if ( deltaY !== 0 ) {
			this.dragStartY = e.pageY;
		}

		this.x1 -= deltaX;
		this.y1 -= deltaY;

		if ( this.x1 < 0 ) {
			this.x1 = 0;
			deltaX = 0;
		}

		if ( this.y1 < 0 ) {
			this.y1 = 0;
			deltaY = 0;
		}

		$.each(this.keys, function (i, key) {
			key.move(deltaX, deltaY);
		});

		this.$selectBox.css({
			top: this.y1 + 'px',
			left: this.x1 + 'px'
		});
	},

	dragEnd: function (e) {
		KBE.$stage
			.off('mousemove', this.drag)
			.off('mouseup', this.dragEnd);

		if ( this.dragged ) {
			return;
		}

		// if not dragged try to modify selection

	}

};


return Selection;

})(undefined);