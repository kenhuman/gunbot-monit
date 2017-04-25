var express     = require('express'),
    handlebars  = require('express-handlebars'),
    poloniex    = require('poloniex-api-node'),
    bittrex     = require('node.bittrex.api'),
    krakenApi   = require('kraken-api'),
    bigInt      = require('big-integer'),
    path        = require('path');

var app = express();
app.engine('handlebars', handlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, 'public')));

var PORT = 3150;

var polKey = '';
var polSecret = '';
var bitKey = '';
var bitSecret = '';
var kraKey = '';
var kraSecret = '';

var papi = new poloniex(polKey, polSecret);
bittrex.options({
    'apikey' : bitKey,
    'apisecret' : bitSecret,
    'stream' : false,
    'verbose' : true,
    'cleartext' : false
});
var kraken = new krakenApi(kraKey, kraSecret);

app.get('/', function(req, res) {
    res.render('index');
});

app.get('/api/poloniex/balances', function(req, res) {
    papi.returnCompleteBalances(null, function(err, balances) {
        if(err) res.send(err);
        else {
            var polBalances = [];
            var polValue = 0;
            for(var bal in balances) {
                var available = balances[bal].available.replace(/\./g, '');
                var availableInt = bigInt(available);
                if(availableInt.compare(0) == 1) {
                    var btcValue = bigInt(balances[bal].btcValue.replace(/\./g, ''));
                    polValue += btcValue;
                    var polBalance = {};
                    polBalance.pair = bal;
                    polBalance.available = balances[bal].available;
                    polBalance.onOrders = balances[bal].onOrders;
                    polBalance.btcValue = balances[bal].btcValue;
                    polBalances.push(polBalance);
                }
            }
            polValueStr = polValue.toString();
            var ctx = {
                value: [polValueStr.slice(0, polValueStr.length - 8), '.', polValueStr.slice(polValueStr.length - 8)].join(''),
                balances: polBalances
            }
            res.json(ctx);
        }
    });
});

app.get('/api/bittrex/balances', function(req, res) {
    bittrex.getbalances(function(data) {
        if(!data.success) res.send({status: 'error', message: data.message});
        else {
            var bitBalances = [];
            for(cur in data.result) {
                bitBalances['BTC-' + data.result[cur].Currency] = {
                    pair: data.result[cur].Currency,
                    balance: data.result[cur].Balance,
                    available: data.result[cur].Available,
                    pending: data.result[cur].Pending
                }
            }
            bittrex.getmarketsummaries(function(data) {
                if(!data.success) res.send({status: 'error', message: data.message});
                else {
                    var btcTotal = bitBalances['BTC-BTC'].balance || 0;
                    for(cur in data.result) {
                        if(bitBalances[data.result[cur].MarketName]) {
                            bitBalances[data.result[cur].MarketName].last = data.result[cur].Last;
                            btcTotal += bitBalances[data.result[cur].MarketName].last * bitBalances[data.result[cur].MarketName].balance;
                        }
                    }
                    var bitBalances2 = [];
                    for(var pair in bitBalances) bitBalances2.push(bitBalances[pair]);
                    var ctx = {
                        value: btcTotal,
                        balances: bitBalances2
                    }
                    res.json(ctx);
                }
            });
        }
    });
});

app.get('/api/kraken/balances', function(req, res) {
    kraken.api('Balance', null, function(err, data) {
        if(err) res.json({status: 'error', message: err});
        else {
            var pairs = '';
            var kraBalances = [];
            for(var pair in data.result) {
                if(pair != 'XXBT') pairs += pair + 'XXBT,';
                kraBalances[pair] = data.result[pair];
            }
            kraken.api('Ticker', {'pair': pairs.slice(0, pairs.length - 1)}, function(err, data) {
                if(err) res.json({status: 'error', message: err});
                var kraTotal = parseFloat(kraBalances['XXBT']) || 0;
                for(var pair in data.result) {
                    kraTotal += parseFloat(kraBalances[pair.slice(0, pair.length - 4)]) * parseFloat(data.result[pair].l[0]);
                }
                
                var kraBalances2 = [];
                for(var pair in kraBalances) kraBalances2.push({pair: pair, balance: kraBalances[pair]});
                var ctx = {
                    total: kraTotal,
                    balances: kraBalances2
                }
                
                res.json(ctx);
            });
        }
    });
});

app.listen(PORT, function() {
    console.log('Listening on port: ' + PORT);
});
