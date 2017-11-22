module.exports = {
	'settings': {
		io: {
			extensions: {
				js: ['condcomments:read', 'importer:read']
			}
		}
	},
	'build runtime': {
		action: 'import',
		files: 'src/runtime.es6',
		output: 'lib/runtime.js'
	},
	'build optimize': {
		action: 'import',
		files: 'src/optimize.es6',
		output: 'lib/optimize.js'
	},

	'watch': {
		files: 'src/**',
		actions: ['build runtime', 'build optimize']
	},
	
	'defaults': ['build runtime', 'build optimize'],	
};