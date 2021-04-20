const Binance = require('node-binance-api');
const constants = require("../shared/constants");
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_SECRET_KEY
});
global.ticker = {};
global.balance = {};
global.minimums = {};
loadExchangeInfo();
module.exports = {
    GetSymbolPrice: async(symbol) => {
        var result = await binance.bookTickers(symbol+constants.FIAT);
        return result;
    },
    BinanceBuy:async(symbol,quantity) => {
        try{
            var result = await binance.marketBuy(symbol+constants.FIAT,quantity);
            return result;
        }catch(error){
            console.log(error.body);
        }
    },
    BinanceSell:async(symbol,quantity) => {
        try{
            var result = await binance.marketSell(symbol+constants.FIAT,quantity);
            return result;
        }catch(error){
            console.log(error.body);
        }
    }, 
    convertQuantityStep:(quantity,stepSize)=>{
       return binance.roundStep(quantity,stepSize);
    },
    getBalance:async (symbol) =>{
        await binance.useServerTime();
        balances = await binance.balance();
        return balances[symbol].available;
    }
}
function loadExchangeInfo(){
    // Get exchangeInfo on startup
    //minNotional = minimum order value (price * quantity)
    binance.exchangeInfo((error, data) => {
        if ( error ) console.error(error);
        let minimums = {};
        for ( let obj of data.symbols ) {
            let filters = {status: obj.status};
            for ( let filter of obj.filters ) {
                if ( filter.filterType == "MIN_NOTIONAL" ) {
                    filters.minNotional = filter.minNotional;
                } else if ( filter.filterType == "PRICE_FILTER" ) {
                    filters.minPrice = filter.minPrice;
                    filters.maxPrice = filter.maxPrice;
                    filters.tickSize = filter.tickSize;
                } else if ( filter.filterType == "LOT_SIZE" ) {
                    filters.stepSize = filter.stepSize;
                    filters.minQty = filter.minQty;
                    filters.maxQty = filter.maxQty;
                }
            }
            filters.orderTypes = obj.orderTypes;
            filters.icebergAllowed = obj.icebergAllowed;
            minimums[obj.symbol] = filters;
        }
        global.minimums = minimums;
    });
}