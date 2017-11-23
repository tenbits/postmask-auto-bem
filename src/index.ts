import * as AutoBem from "auto-bem"

let _mask = null;
let _io = null;
let _settings = null;
const PLUGIN_NAME = 'postmask-auto-bem';

export function initialize (optimizer, settings, mask, io) {
    _mask = mask;
    _io = io;

    optimizer.registerOptimizer('*:after', optimize);
    
};

export function configurate (config) {
    if (config == null) {
        return;
    }
    _mask = config.mask || _mask;
    _io = config.io || _io;
    _settings = config[PLUGIN_NAME] || {};
}


function optimize (root, ctx, next) {
    let bemImports = [],
        bemDecos = [];

    _mask.TreeWalker.walk(root, function(node){
        if (Ast.isBemImport(node)) {
            let path = Ast.getFilePathForImport(node, ctx.filename);
            let file = AutoBemUtil.createFile(path, node);
            bemImports.push(node);
            return;
        }
        if (Ast.isBemDeco(node)) {
            bemDecos.push(node);
        }
    });
    if (bemImports.length === 0 && bemDecos.length === 0) {
        next();
        return;
    }
    if (bemImports.length === 0) {
        ctx.error('Bem Decorator expects Bem Import', bemDecos[0]);
        next();
        return;
    }
    if (bemDecos.length === 0) {
        ctx.error('We do not support sources with no bem decorators', bemDecos[0]);
        next();
        return;
    }
    _mask.TreeWalker.walk(root, function(node){
        if (Ast.isBemDeco(node)) {            
            try {
                let name = Ast.getBemNameFromDeco(node);
                let import_ = Ast.getBemImportForDeco(node, name);    
                let path = Ast.getFilePathForImport(import_, ctx.filename);
                let file = AutoBemUtil.createFile(path, import_);
                let element = Ast.getElementForDeco(node);
                
                file.bemCss.transformAst(element);
            }
            catch (error) {                
                ctx.error(error.message, node);
                return;
            }

            return { remove: true }
        }
    });
    bemImports.forEach(x => x.moduleType = null);

    
    next();
}
namespace Ast {
    export function isBemImport (node) {
        return node.type === _mask.Dom.COMPONENT && node.tagName === 'import' && node.moduleType === 'bem';
    }
    export function getBemNameFromDeco (node) {
        let bemName = /bem\s*\((.+)\)/.exec(node.expression);
        if (bemName) {
            let arg = bemName[1];
            let str = /['"](.+)['"]/.exec(arg);
            if (str == null) {
                throw Error('String argument expected');
            }
            return str[1];
        }
        return null;
    }
    export function getFilePathForImport (node, sourceFilename) {
        return _mask.Module.resolvePath(node, { filename: sourceFilename });
    }
    export function getBemImportForDeco (node, name) {        
		for(let cursor = node; cursor != null; cursor = cursor.parent) {
			if (cursor.tagName !== 'imports') {
				continue;
			}

			let nodes = cursor.nodes;
			for(let i = 0; i < nodes.length; i++) {
                let import_ = nodes[i];
                if (isBemImport(import_) === false) {
					continue;
				}				
				if (name != null && import_.alias !== name) {
					continue;
				}
				return import_;
			}
		}		
		throw Error('Import not found');
    }
    export function isBemDeco (node) {
        return node.type === _mask.Dom.DECORATOR && /bem\s*($|\()/.test(node.expression)
    }
    export function getElementForDeco(node) {
        let cursor = node.nextSibling
        while(cursor !== null && cursor.type === _mask.Dom.DECORATOR) {
            cursor = cursor.nextSibling;
        }
        return cursor;
    }
}
namespace AutoBemUtil {
    export function createFile (path, maskImport) {
        let file = new _io.File(path);
        if (file.bemCss != null) {
            return file;
        }        
        if (file.exists() === false) {            
            throw new Error(`CSS File not found ${path}`);
        }
        let style = file.read();
        let bemCss = new AutoBem.BemCss(style, {
            filename: path,
            salt: maskImport.attr && maskImport.attr.salt,
            ..._settings
        });
        file.bemCss = bemCss;
        file.content = bemCss.getStyle();
        return file;
    }
}