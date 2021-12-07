// Create BG Items
const lg_bg = document.querySelector('.page__background');
const lg_bgItems = lg_bg.dataset.items;
for (i = 0; i < lg_bgItems; i++) {
	const lg_bgElement = document.createElement('i');
	lg_bg.appendChild(lg_bgElement);
}

// Generate Random Number
function randomNumber(min, max) {
	return Math.random() * (max - min) + min;
}
