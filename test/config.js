module.exports = {	
	suites: {
		node: {
			exec: 'node',
			env: [
				'/node_modules/maskjs/lib/mask.node.js::mask'
			],
			tests: 'test/node.test'
		}
	}
}