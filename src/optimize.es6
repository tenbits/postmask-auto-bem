module.exports = function (mask) {
	
	[ 'style' ].forEach(method => {

		mask.registerOptimizer(method, optimizeNode);
	});
};

function optimizeNode (node, next) {
	
	var config = mask.cfg('postmask-less') || { 
		async: true,
	};

	var less = require('less');

	less.render(node.content, config, (error, result) => {
		node.content = error ? error.toString() : result.css;
		next();
	});
}
