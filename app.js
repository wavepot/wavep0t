process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var http = require('http');
var express = require('express');
var coinvert = require('coinvert');

var coins;
var wallets = {
  doge: 'D6xTowCVvwtNpQe9dKhHH164brvCVapxNr',
  btc: '1K3Vs8tPu2YkAoWmrkjUQVJuxr7wgPP3Wf'
};
var targetUsd = 2000;

var app = express();

app.use(express.logger());
app.use(express.compress());
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/build'));
app.use(express.static(__dirname + '/public/library'));
app.use(express.directory(__dirname + '/public/library'));

app.get('/campaign', function(req, res){
  res.json({
    targetUsd: targetUsd,
    wallets: wallets,
    usd: coins.usd
  });
});

// always serve index.html
app.get('*', function(req, res){
  res.sendfile('/index.html', { root: __dirname + '/public' });
});

function updateWallets(){
  coinvert(targetUsd, wallets, function(err, data){
    console.log('got coin data');
    console.log(data);

    setTimeout(updateWallets, 1000 * 60);

    if (err) {
      console.error(err.stack);
      return;
    }

    coins = data;
  });
}

updateWallets();

var server = http.createServer(app);
server.listen(3333, 'localhost', function(){
  console.log('server listening');
});
