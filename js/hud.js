KBE.Hud = (function (window, document) {

function Hud () {
	this.$hud = KBE.$hud = $('#wrapper');

	this.theme = 'light';

	this.$switchTheme = $('#switchTheme')
		.html(this.theme == 'light' ? 'dark' : 'light')
		.on('click', $.proxy(this.switchTheme, this));

	this.$palettes = $('#palettes');

	// add colors to palettes
	var $tabs = $('.tabs', '#palettes');

	var that = this;
	$.each(KBE.colors, function (i, val) {
		$tabs.append(
			$('<li>').html(i)
		);

		var $palette = $('<ul>')
			.addClass('colors palette-' + i)
			.attr('id', 'palette-' + i);

		that.$palettes.append($palette);

		$.each(val, function (name, color) {
			$palette.append(
				$('<li>')
					.css('background-color', '#' + color)
					.on('click', function (e) {
						e.preventDefault();
						e.stopPropagation();

						KBE().colorSelected(color);
					})
			);
		});
	});

	//this.$hud.append(this.$switchTheme);
}

Hud.prototype = {
	switchTheme: function (e) {
		e.stopPropagation();

		$('#wrapper')
			.toggleClass('lightTheme')
			.toggleClass('darkTheme');

		this.$switchTheme.html( this.$switchTheme.html() == 'dark' ? 'light' : 'dark');
	}
};

return Hud;

})(window, document);