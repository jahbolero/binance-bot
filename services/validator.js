var binanceService = require("./binance");
var indicators = require("./indicators");
var constants = require("../shared/constants");


module.exports = {
  ValidateBuy515: async(order) => {
    var indicatorResults = await Promise.all([
      binanceService.GetSymbolPrice(order.symbol),
      indicators.getIndicatorValue(order.symbol,constants.TIMEFRAME.MINUTE5,5,constants.INDICATOR.MA),
      indicators.getIndicatorValue(order.symbol,constants.TIMEFRAME.MINUTE5,15,constants.INDICATOR.MA),
      indicators.getIndicatorValue(order.symbol,constants.TIMEFRAME.MINUTE5,null,constants.INDICATOR.STOCHRSI)
    ])
    var price = parseFloat(indicatorResults[0].askPrice);
    var ma5 = indicatorResults[1].value;
    var ma15 = indicatorResults[2].value;
    var stochRsiFast = indicatorResults[3].valueFastK;
    var percentDiff = (((price - ma5)/ma5)*100);
    if((price > ma5 && price > ma15 && ma5 > ma15)){
      if(percentDiff > 0.8 && stochRsiFast > 50){
        return;
      }
      let minNotional = global.minimums[order.symbol+constants.FIAT].minNotional;
      let minQty = global.minimums[order.symbol+constants.FIAT].minQty;
      let stepSize = global.minimums[order.symbol+constants.FIAT].stepSize;
      var quantity = (order.amount * 0.999) / price;
      if ( quantity < minQty ) return;
      if ( price * quantity < minNotional ) {
        quantity = minNotional / price;
      }
      quantity = binanceService.convertQuantityStep(quantity, stepSize);
      return quantity;
    }
    return;
  },
  ValidateSell515: async(order) => {
    var indicatorResults = await Promise.all([
      binanceService.GetSymbolPrice(order.symbol),
      indicators.getIndicatorValue(order.symbol,constants.TIMEFRAME.MINUTE5,5,constants.INDICATOR.MA),
    ])
    var balance = parseFloat(await binanceService.getBalance(order.symbol));
    let stepSize = global.minimums[order.symbol+constants.FIAT].stepSize;
    var quantity = (order.quantity * 0.999);
    if(balance < quantity) quantity = balance;
    var price = parseFloat(indicatorResults[0].bidPrice);
    var ma5 = indicatorResults[1].value;
    if(price < ma5){
      quantity = binanceService.convertQuantityStep(parseFloat(quantity), stepSize);
      return quantity;
    }
    return;
  },
  ValidateBuy: async (symbol) => {
    
    var indicatorResults = await Promise.all([
      binanceService.GetSymbolPrice(symbol),
      indicators.getIndicatorValue(
        symbol,
        constants.TIMEFRAME.MINUTE30,
        8,
        constants.INDICATOR.EMA
      ),
      indicators.getIndicatorValue(
        symbol,
        constants.TIMEFRAME.MINUTE30,
        12,
        constants.INDICATOR.EMA
      ),
      indicators.getIndicatorValue(
        symbol,
        constants.TIMEFRAME.MINUTE30,
        21,
        constants.INDICATOR.EMA
      ),
      indicators.getIndicatorValue(
        symbol,
        constants.TIMEFRAME.MINUTE30,
        null,
        constants.INDICATOR.RSI
      ),
    ]);
    
    var price = parseFloat(indicatorResults[0].askPrice);
    var ema8 = indicatorResults[1].value;
    var ema12 = indicatorResults[2].value;
    var ema21 = indicatorResults[3].value;
    var rsi = indicatorResults[4].value;
    if((price > ema8 && ema8 > ema12 && ema12 > ema21) && rsi >= 50){
        console.log(`price:${price}|ema8:${ema8}|ema12:${ema12}|ema21:${ema21}|rsi:${rsi}`)
        return true;
    }
    return false;
  },
  ValidateSell: async (symbol) => {
    var indicatorResults = await Promise.all([
        binanceService.GetSymbolPrice(symbol),
        indicators.getIndicatorValue(
          symbol,
          constants.TIMEFRAME.MINUTE30,
          21,
          constants.INDICATOR.EMA
        ),
      ]);
      var price = parseFloat(indicatorResults[0].bidPrice);
      var ema21 = indicatorResults[1].value;
      if(price < ema21){
          console.log(`price:${price}|ema21:${ema21}`)
          return true;
      }
      return false;
  },
};

function decimalCount(num){
   // Convert to String
   const numStr = String(num);
   // String Contains Decimal
   if (numStr.includes('.')) {
      return numStr.split('.')[1].length;
   };
   // String Does Not Contain Decimal
   return 0;
}