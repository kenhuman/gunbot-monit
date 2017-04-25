var getPolData = function() {
    $.get('/api/poloniex/balances', function(data) { 
        $('#polValue').text(data.value); 
        $('table#polTable tbody').empty();
        for(var row in data.balances) {
            var curRow = data.balances[row];
            var markup = '<tr><td>' + curRow.pair + '</td><td>' + curRow.available + '</td><td>' + curRow.onOrders + '</td><td>' + curRow.btcValue + '</td></tr>';
            $('table#polTable tbody').append(markup);
        }
    });
}
var getBitData = function() {
    $.get('/api/bittrex/balances', function(data) {
        $('#bitValue').text(data.value.toFixed(8));
        $('table#bitTable tbody').empty();
        for(var row in data.balances) {
            var curRow = data.balances[row];
            var markup = '<tr><td>' + curRow.pair + '</td><td>' + curRow.available.toFixed(8) + '</td><td>' + (curRow.balance - curRow.available).toFixed(8) + '</td><td>' + (curRow.balance * (curRow.last || 1)).toFixed(8) + '</td></tr>';
            $('table#bitTable tbody').append(markup);
        }
    });
}
var getKraData = function() {
    $.get('/api/kraken/balances', function(data) {
        $('#kraValue').text(data.total.toFixed(8));
        $('table#kraTable tbody').empty();
        for(var row in data.balances) {
            var curRow = data.balances[row];
            var markup = '<tr><td>' + curRow.pair + '</td><td>' + curRow.balance + '</td></tr>';
            $('table#kraTable tbody').append(markup);
        }
    });
}

var getTotalValue = function() {
    var kraValue = parseFloat($('#kraValue').text());
    var bitValue = parseFloat($('#bitValue').text());
    var polValue = parseFloat($('#polValue').text());
    $('#totalValue').text((kraValue + bitValue + polValue).toFixed(8));
}

getPolData();
setInterval(getPolData, 10000);
getBitData();
setInterval(getBitData, 10000);
getKraData();
setInterval(getKraData, 10000);
getTotalValue();
setInterval(getTotalValue, 10000);
