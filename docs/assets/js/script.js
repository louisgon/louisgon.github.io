// Create BG Items
const lg_bg = document.querySelector('.page__background');
const lg_bgItems = lg_bg.dataset.items;
for (i = 0; i < lg_bgItems; i++) {
	const lg_bgElement = document.createElement('i');
	lg_bg.appendChild(lg_bgElement);
}

// Accordion
const lg_accordion = document.querySelector('.block__accordion');
const lg_accordionButtons = lg_accordion.querySelectorAll('.accordion__nav__button');
if (lg_accordionButtons.length > 0) {
	lg_accordionButtons.forEach(function (lg_accordionButton) {
		lg_accordionButton.addEventListener('click', function () {
			if (!lg_accordionButton.classList.contains('is-active')) {
				const id = lg_accordionButton.dataset.id;
				const prev = lg_accordion.querySelector('.accordion__nav__button.is-active');

				// Remove Previous
				prev.classList.remove('is-active');
				lg_accordion.querySelector('.accordion__content[data-id="' + prev.dataset.id + '"]').classList.remove('is-active');

				// Update Current
				lg_accordionButton.classList.add('is-active');
				lg_accordion.querySelector('.accordion__content[data-id="' + id + '"]').classList.add('is-active');
			}
		});
	});
}

// Onload
window.addEventListener('load', function () {
	setTimeout(function () {
		document.body.classList.add('has-loaded');
	}, 2000);
});

// Generate Random Number
function randomNumber(min, max) {
	return Math.random() * (max - min) + min;
}
