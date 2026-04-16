// Simple proxy to thompsonfams.com for the Claude Code Preview panel.
// No dependencies — uses Node built-ins only.
var http = require('http');
var https = require('https');

var PORT = 3456;
var TARGET = 'thompsonfams.com';

var server = http.createServer(function(req, res) {
  var options = {
    hostname: TARGET,
    path: req.url,
    method: req.method,
    headers: Object.assign({}, req.headers, { host: TARGET })
  };
  delete options.headers['accept-encoding']; // avoid compressed responses

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
  console.log('TBM Preview proxy running on http://localhost:' + PORT);
  console.log('Proxying to https://' + TARGET);
});
