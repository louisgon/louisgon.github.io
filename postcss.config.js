module.exports = {
	map: false,
	plugins: [
		require('autoprefixer'),
		require('cssnano'),
		require('postcss-sort-media-queries')({
			sort: 'mobile-first',
		}),
		require('postcss-sorting')({
			'properties-order': 'alphabetical',
		}),
	],
};
