KBE.Hud = (function (window, document) {

function Hud () {
	this.theme = 'light';

	// activate the theme switch
	this.$switchTheme = $('#switchTheme')
		.html(this.theme == 'light' ? 'dark' : 'light')
		.on('click', $.proxy(this.switchTheme, this));

	// create the palette panel
	this.palettes = new Panel({
		title: 'Palettes',
		id: 'palettes',
		className: 'palettes',
		x: KBE.viewportWidth
	});

	// add tabs to palettes panel
	var $tabs = $('<ul>')
		.addClass('tabs cf');

	this.palettes.$element.append($tabs);

	var that = this;

	// add colors to palettes
	$.each(KBE.colors, function (i, val) {
		// create the new tab
		$tabs.append(
			$('<li>')
				.attr('id', 'tab-' + i)
				.html(i == 'KBE' ? '&#8270;' : i)
				.addClass('tab')
				.addClass(i == 'KBE' && 'active')
				.on('click', $.proxy(that.switchPalette, that))
		);

		// create the new palette
		var $palette = $('<ul>')
			.addClass('cf colors palette-' + i)
			.attr('id', 'palette-' + i)
			.on('mousemove', $.proxy(that.hoverColor, that));

		if ( i == 'KBE' ) {
			$palette.addClass('active');
		}

		// attach the color to the palette
		$.each(val, function (name, color) {
			$palette.append(
				$('<li>')
					.css('background', '#' + color)
					.data({
						group: i,
						color: color,
						code: name
					})
					.on('click', function (e) {
						e.preventDefault();
						e.stopPropagation();

						KBE().paintSelected(color);
					})
			);
		});

		that.palettes.$element.append($palette);
	});

	// add the palette footer
	this.palettes.$element.append(
		$('<footer>')
			.addClass('info')
	);

	this.$selectedColor = $('<input>')
		.attr('disabled', true)
		.addClass('selectedColor');

	this.$paintBucket = $('<button>')
		.attr({
			id: 'paintBucket',
			type: 'button'
		})
		.addClass('paintBucket')
		.on('click', $.proxy(this.paintBucket, this));

	$('footer', this.palettes.$element)
		.append(this.$selectedColor)
		.append(this.$paintBucket);

	// the dimensions must be updated every time content changes
	this.palettes.updateDimensions();

	// update palette position margins
	this.palettes.updatePosition(KBE.$wrapper.width(), KBE.$wrapper.height());
}

Hud.prototype = {
	switchTheme: function (e) {
		e.stopPropagation();

		$('#wrapper')
			.toggleClass('lightTheme')
			.toggleClass('darkTheme');

		this.$switchTheme.html( this.$switchTheme.html() == 'dark' ? 'light' : 'dark');
	},

	hoverColor: function (e) {
		e.preventDefault();
		e.stopPropagation();

		var data = $(e.target).data();

		if ( !('color' in data) ) {
			return;
		}

		this.$selectedColor.val(data.code);
	},

	switchPalette: function (e) {
		e.preventDefault();
		e.stopPropagation();

		var id = '#' + e.target.id.replace('tab', 'palette');

		$tab = $(e.target);
		$palette = $(id);

		$('.tab', this.palettes.$element).removeClass('active');
		$tab.addClass('active');

		$('.colors', this.palettes.$element).removeClass('active');
		$palette.addClass('active');
	},

	paintBucket: function (e) {
		KBE().paintBucketMode();
	},

	updatePanels: function () {
		this.palettes.updatePosition();
	}
};

function Panel (options) {
	this.options = $.extend({}, Panel.defaults);
	$.extend(this.options, options);

	this.x = this.options.x;
	this.y = this.options.y;
	this.width = this.options.width;
	this.lockedX = this.options.lockedX;
	this.lockedY = this.options.lockedY;

	// create the element
	this.$element = $('<div>')
		.attr('id', this.options.id)
		.addClass('hud panel')
		.addClass(this.options.className)
		.css({
			left: this.x + 'px',
			top: this.y + 'px',
			width: this.width + 'px'
		});

	// create the header and drag/drop handle
	this.$element.append(
		$('<header>')
			.addClass('title')
			.html(this.options.title)
			.on('mousedown', $.proxy(this.dragStart, this))
	);

	$('#wrapper').append(this.$element);

	this.updateDimensions();
}

Panel.prototype = {
	updateDimensions: function () {
		this.width = this.$element.width();
		this.height = this.$element.height();

		this.maxX = KBE.viewportWidth - this.width - 10;
		this.maxY = KBE.viewportHeight - this.height - 10;
	},

	updatePosition: function () {
		var x, y;

		var newMaxX = KBE.viewportWidth - this.width - 10;
		var newMaxY = KBE.viewportHeight - this.height - 10;

		if ( this.lockedX ) {
			if ( this.x == this.maxX ) {
				x = newMaxX;
				this.x = x;
			} else if ( this.x < 20 ) {
				x = 10;
			} else {
				x = Math.min(this.x, newMaxX);
			}
		} else {
			x = Math.min(this.x, newMaxX);
		}

		if ( this.lockedY ) {
			if ( this.y == this.maxY ) {
				y = newMaxY;
				this.y = y;
			} else if ( this.y == 10 ) {
				y = 10;
			} else {
				Math.min(this.y, Math.max(10, newMaxY));
			}
		} else {
			y = Math.min(this.y, Math.max(10, newMaxY));
		}

		this.maxX = newMaxX;
		this.maxY = newMaxY;

		this.$element.css({
			top: y + 'px',
			left: x + 'px'
		});
	},

	dragStart: function (e) {
		e.preventDefault();
		e.stopPropagation();

		if ( e.which != 1 ) {
			return;
		}

		// sync actual position with stored position. They could go out of sync due to the lock-to-border functionality
		var pos = this.$element.position();
		this.x = pos.left;
		this.y = pos.top;

		this.originX = this.x;
		this.originY = this.y;

		this.pointX = e.pageX;
		this.pointY = e.pageY;

		KBE.$wrapper
			.on('mousemove', $.proxy(this.drag, this))
			.on('mouseup', $.proxy(this.dragEnd, this))
			.on('mousecancel', $.proxy(this.dragReset, this));
	},

	drag: function (e) {
		if ( e.which != 1 ) {
			this.dragReset(e);
			return;
		}

		var deltaX = e.pageX - this.pointX;
		var deltaY = e.pageY - this.pointY;

		this.lockedX = false;
		this.lockedY = false;

		this.x += deltaX;
		this.y += deltaY;

		if ( this.x < 20 ) {
			this.lockedX = true;
			this.x = 10;
		} else if ( this.x > this.maxX - 20 ) {
			this.lockedX = true;
			this.x = this.maxX;
		} else {
			this.pointX = e.pageX;
		}

		if ( this.y < 20 ) {
			this.lockedY = true;
			this.y = 10;
		} else if ( this.y > this.maxY - 20 ) {
			this.lockedY = true;
			this.y = this.maxY;
		} else {
			this.pointY = e.pageY;
		}

		this.$element.css({
			top: this.y + 'px',
			left: this.x + 'px'
		});
	},

	dragReset: function (e) {
		this.x = this.originX;
		this.y = this.originY;

		this.dragEnd(e);
	},

	dragEnd: function (e) {
		this.$element.css({
			top: this.y + 'px',
			left: this.x + 'px'
		});

		KBE.$wrapper
			.off('mousemove', this.drag)
			.off('mouseup', this.dragEnd)
			.off('mousecancel', this.dragReset);
	}
};

Panel.defaults = {
	x: 10,
	y: 10,
	width: 198,
	lockedX: true,
	lockedY: true
};

return Hud;

})(window, document);