// OLD SHIT
var dataNumItems = $('section.ca__bg').attr('data-num-items');
for (i = 0; i < dataNumItems; i++) {
	$('section.ca__bg').append('<div class="bg-item" />');
}

/* Background Item CSS */
$('section.ca__bg .bg-item').each(function () {
	$(this).css({
		'animation-delay': randomNumber(0, 10) + 's',
		'animation-duration': randomNumber(5, 30) + 's',
		left: randomNumber(5, 95) + '%',
		opacity: randomNumber(0.1, 1),
		transform: 'translate3d(' + randomNumber(-400, 400) + '%, 0, 0) rotateZ(' + randomNumber(-720, 720) + 'deg)',
		width: randomNumber(10, 100) + 'em',
	});
});

/* Bold Span CSS */
var b__sc = $('section.ca__dev b span').length;
$('section.ca__dev b span').each(function (index) {
	index++;
	$(this).css({
		'animation-delay': animationDelay(b__sc, b__sc - index),
	});
});

/* Paragraph Span CSS */
var p__sc = $('section.ca__dev p span').length;
$('section.ca__dev p span').each(function (index) {
	index++;
	$(this).css({
		'animation-delay': animationDelay(p__sc, p__sc - index),
	});
});

/* Hover Class */
$(document)
	.on('mouseenter', 'section.ca__co a', function () {
		$('body').addClass('hover');
	})
	.on('mouseleave', 'section.ca__co a', function () {
		$('body').removeClass('hover');
	});

function animationDelay(sc, index) {
	return (5 / sc) * index + 's';
}
function randomNumber(min, max) {
	return Math.random() * (max - min) + min;
}
