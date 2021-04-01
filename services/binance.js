const Binance = require('node-binance-api');
const constants = require("../shared/constants");
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_SECRET_KEY
});

module.exports = {
    GetSymbolPrice: async(symbol) => {
        var result = await binance.bookTickers(symbol+constants.FIAT);
        return result;
    },
    BinanceBuy:async({symbol,quantity}) => {
        try{
            var result = await binance.marketBuy(symbol+constants.FIAT,quantity);
            return result;
        }catch(error){
            console.log(error.body);
        }
    },
    BinanceSell:async({symbol,quantity}) => {
        try{
            var result = await binance.marketSell(symbol+constants.FIAT,quantity);
            return result;
        }catch(error){
            console.log(error.body);
        }

    }
}