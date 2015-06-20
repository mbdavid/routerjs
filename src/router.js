var router = (function () {

    var routes = [];
    var errors = [];
    var running = false;

    function start() {
        if (running === false) {
            running = true;
            window.addEventListener('hashchange', hashchange);
            hashchange();
        }
        else {
            hashchange();
        }
    }

    function go(url) {
        window.location.hash = url;
        if(running === false) setTimeout(start);
    }

    // route style: add('/view/:id', fn(ctx, next), fn2(ctx, next), ...)
    function add(url) {

        // support for multi-url: add(['#/', '#/:user'], function() { ... })
        if (Array.isArray(url)) {
            var params = Array.prototype.slice.call(arguments).splice(1);
            url.forEach(function (u) {
                var arg = [u];
                params.forEach(function (item) { arg.push(item); });
                add.apply(this, arg);
            });
            return;
        }

        var args = Array.prototype.slice.call(arguments);

        if (args.length == 1) { // error route
            errors.push(args[0]);
            return;
        }

        // args can be an array ou params
        var route = {
            callbacks: Array.isArray(args[1]) ? args[1] : args.slice(1)
        };

        if (url instanceof RegExp) {
            route.regex = url;
            route.vars = [];
        }
        else if(url === '*') {
            route.regex = /.*/;
            route.vars = [];
        }
        else {

            if (url.match(/^#/) == null) throw 'Route must start with # or be only *';

            route.regex = new RegExp('^' +
                    url.replace(/\/$/, '')
                        .replace(/:\w+\?/g, '?([^/]*)')
                        .replace(/:\w+/g, '([^/]+)') +
                    '$', 'i');
            route.vars = url.match(/:\w+/g) || [];
        }

        routes.push(route);
    }

    function hashchange() {

        if (running == false) return;

        var hash = (window.location.hash || "#");

        var path = hash
            .replace(/\?.*$/, '')  // remove ? querystring
            .replace(/\/$/, '');   // remove last / slash

        var qstr = hash.replace(/^[^\?]*\??/, '');  // remove url, keep only query string without ?
        var segments = path.replace(/^#\/?/, '').replace(/\/$/, ''); // names between /
        var queue = [];

        // create context var - is the some across all matches and all callbacks
        var context = {
            url: hash,
            path: path.replace(/^#/, ''),
            segments: segments ? segments.split('/') : [],
            pathQuery: path.replace(/^#/, '') + (qstr ? '?' + qstr : ''),
            queryString: qstr,
            query: parseQueryString(qstr)
        };

        for (var i in routes) { // routes

            var match = path.match(routes[i].regex);
            if (!match) continue;

            var route = routes[i];
            var params = {};

            // get params from route vars
            for (var j = 0; j < route.vars.length; j++) {
                var value = decodeURIComponent(path.replace(route.regex, '$' + (j + 1)));
                params[route.vars[j].substring(1)] = value;
            }

            // no vars? can be a url regex
            if (route.vars.length == 0) {
                for(var m in match) {
                    if(m > 0) { 
                        params[m] = match[m];
                    }
                }
            }
            
            // add all callbacks to a queue
            for(var cb in route.callbacks) {
                queue.push({ fn: route.callbacks[cb], params: params });
            }

        }

        if(queue.length > 0) {
            executeQueue(context, queue, 0);
        }
        else {
            executeErrorQueue('Router not found', context, 0);
        }
    }

    // execute in queue all callbacks in all routes that url match
    function executeQueue(context, queue, index) {

        if (index >= queue.length) return;

        var callback = queue[index];
        var next = function (err) {
            if(err !== undefined) {
                executeErrorQueue(err, context, 0);
            }
            else {
                executeQueue(context, queue, index + 1);
            }
        };
        
        context.params = queue.params;
        callback.fn(context, next);
    }

    // execute error function queue
    function executeErrorQueue(err, context, index) {
        
        if(index >= errors.length) return;
        
        var fn = errors[index];
        var next = function() {
            executeErrorQueue(err, context, index + 1);
        };
        
        fn(err, context, next);
        
    }

    // parse a querystring to an object
    function parseQueryString(str) {

        if (str.trim().length === 0) return {};

        var arr = str.split('&');
        var obj = {};

        for (var i = 0; i < arr.length; i++) {
            var bits = arr[i].split('=');
            obj[decodeURIComponent(bits[0])] = decodeURIComponent(bits[1].replace(/\+/g, ' '));
        }

        return obj;
    }

    function stop() {
        running = false;
    }

    // creating router function initializer
    var router = function () {
        if (arguments.length == 0) return start();
        if (arguments.length == 1 && typeof arguments[0] == 'string') return go(arguments[0]);
        add.apply(this, arguments);
    };

    // adding helper functions
    router.parseQueryString = parseQueryString;
    router.stop = stop;

    return router;

})();
