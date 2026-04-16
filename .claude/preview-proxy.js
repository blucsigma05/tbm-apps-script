// Proxy to thompsonfams.com for Claude Code Preview panel and Play gate trace capture.
// No dependencies — uses Node built-ins only.
var http = require('http');
var https = require('https');

var PORT = process.env.PROXY_PORT ? parseInt(process.env.PROXY_PORT, 10) : 3456;
var TARGET = 'thompsonfams.com';
var TBM_PIN = process.env.TBM_PIN || '';

var server = http.createServer(function(req, res) {
  var options = {
    hostname: TARGET,
    path: req.url,
    method: req.method,
    headers: Object.assign({}, req.headers, { host: TARGET })
  };
  delete options.headers['accept-encoding'];

  // Inject CF Worker PIN cookie for authenticated finance surfaces
  if (TBM_PIN) {
    var existing = options.headers['cookie'] || '';
    options.headers['cookie'] = (existing ? existing + '; ' : '') + 'tbm_pin=' + TBM_PIN;
  }

  var proxy = https.request(options, function(proxyRes) {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxy.on('error', function(e) {
    res.writeHead(502);
    res.end('Proxy error: ' + e.message);
  });
  req.pipe(proxy);
});

server.listen(PORT, function() {
  console.log('TBM proxy running on http://localhost:' + PORT + ' \u2192 https://' + TARGET);
  console.log('CF PIN injection: ' + (TBM_PIN ? 'enabled' : 'disabled (set TBM_PIN to enable)'));
});
