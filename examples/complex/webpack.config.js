module.exports = {
	mode: 'production',
	entry: './index.js',
	output: {
		path: __dirname,
		filename: 'bundle.js',
	},
	resolve: {
		extensions: ['.js'],
	}
};