KBE.Key = (function (window, document) {

var _count = 0;

function Key (options) {
	this.options = $.extend({}, Key.defaults);
	$.extend(this.options, options);

	_count++;

	this.unitX = this.options.unitX;
	this.unitY = this.options.unitY;
	this.x = this.options.x;
	this.y = this.options.y;
	this.width = this.unitX / 25 * KBE.GRID_UNIT_X;
	this.height = this.unitY / 25 * KBE.GRID_UNIT_Y;

	this.$element = $('<div>')
		.attr('id', 'key-' + _count)
		.addClass('key')
		.addClass('unitX-' + this.unitX)
		.addClass('unitY-' + this.unitY)
		.css({
			top: this.y + 'px',
			left: this.x + 'px',
			width: this.width + 'px',
			height: this.height + 'px'
		})
		.html('<div class="cap"><span></span></div><div class="dimensions"><span>' + (this.unitX / 100) + '&#215;' + (this.unitY / 100) + '</span></div>');

	KBE.$stage.append(this.$element);
}

Key.prototype = {
	resize: function (x, y) {
		this.unitX += x;
		this.unitY += y;

		if ( this.unitX < 100 ) {
			this.unitX = 100;
		} else if ( this.unitX > 1000 ) {
			this.unitX = 1000;
		}

		if ( this.unitY < 50 ) {
			this.unitY = 50;
		} else if ( this.unitY > 400 ) {
			this.unitY = 400;
		}

		this.width = this.unitX / 25 * KBE.GRID_UNIT_X;
		this.height = this.unitY / 25 * KBE.GRID_UNIT_Y;

		this.$element.css({
			'width': this.width + 'px',
			'height': this.height + 'px'
		});

		$('.dimensions span', this.$element).html((this.unitX / 100) + '&#215;' + (this.unitY / 100));
	},

	move: function (x, y) {
		this.x += x;
		this.y += y;

		this.$element.css({
			top: this.y + 'px',
			left: this.x + 'px'
		});
	},

	remove: function () {
		this.$element.remove();
	},

	color: function (value) {
		this.$element
			.find('.cap,.cap span')
				.css('background-color', '#' + value);
	}
};

Key.defaults = {
	unitX: 100,
	unitY: 100,
	x: 0,
	y: 0
};

return Key;

})(window, document);