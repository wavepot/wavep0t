var ejs = require('./ejs');
var request = require('superagent');
var domify = require('domify');

var client = {
    pathPrefix:'',
    ejsExtension:'.ejs'
};
var cache = {};

var renderFromCache = function(fullPath, locals) {
    return ejs.render(cache[fullPath], locals);
};

client.render = function(file, locals, callback) {
    if (typeof locals === 'function') {
        callback = locals;
        locals = {};
    }

    var fullPath = client.pathPrefix+file+client.ejsExtension;
    if (cache[fullPath]) {
        var rendered = renderFromCache(fullPath, locals);
        return callback && callback(null, rendered) || rendered;
    }
    if (callback) {
        return request.get(fullPath, function(res) {
            if (res.status !== 200) {
                return callback(res);
            }
            cache[fullPath] = res.text;
            return callback(null, renderFromCache(fullPath, locals));
        });
    }
    var res = request.get(fullPath).async(false).end();
    if (res.status !== 200) {
        return new Error('Failed to load '+fullPath);
    }
    cache[fullPath] = res.text;
    return renderFromCache(fullPath,locals);
};

client.domify = function(file, locals, callback) {
    if (typeof locals === 'function' || callback) {
        return client.render(file, locals, function(err, html) {
            if (err) {
                return callback(err);
            }
            return callback(null, domify(html)[0]);
        });
    }
    var html = client.render(file, locals, callback);
    if (html instanceof Error) {
        return html;
    }
    return domify(html)[0];
};

client.clearCache = function() {
    cache = {};
};

module.exports = client;