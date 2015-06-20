# routerjs

A simple client side router based on pagejs and node.js express. Works with hashtag.

```javascript
// register a new route
router('#/customer/:id', function(ctx, next) {
	// ctx is same object in all callbacks
	...
	next();
});

// support for multi callbacks
router('#/customer/:id', fn1, fn2, fn3, ...);

// support for multi route pattern
router(['#/customer/:id', '#/products/:id'], fn1, fn2, fn3, ...);

// capture all routes	
router('*', function(ctx, next) {
	auth().then(function() { next(); });
});

// capture errors
router(function(err, ctx, next) {
	console.error(err);
});

// throw an error
router('#/customer/:id', function(ctx, next) {
	try {
		...
		next(); // go no next callback
	}
	catch(e) {
		next(e); // if next() are called with argument, go to error queue list
	}
});

// start routing
router();

// stoping
router(false);

// redirect
router('#/customer/1');

// context object
ctx = {
	url: '#/customer/1?page=22',
    path: '#/customer/1',
    segments: ['customer', '1'],
    queryString: 'page=22',
    query: { page: '22' },
	params: { id: '1' }
};

```