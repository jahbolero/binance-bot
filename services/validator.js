var binance = require("./binance");
var indicators = require("./indicators");
var constants = require("../shared/constants");

module.exports = {
  ValidateBuy: async (symbol) => {
    
    var indicatorResults = await Promise.all([
      binance.GetSymbolPrice(symbol),
      indicators.getIndicatorValue(
        symbol,
        constants.TIMEFRAME.MINUTE30,
        constants.PERIOD.EMA8,
        constants.INDICATOR.EMA
      ),
      indicators.getIndicatorValue(
        symbol,
        constants.TIMEFRAME.MINUTE30,
        constants.PERIOD.EMA12,
        constants.INDICATOR.EMA
      ),
      indicators.getIndicatorValue(
        symbol,
        constants.TIMEFRAME.MINUTE30,
        constants.PERIOD.EMA21,
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
        binance.GetSymbolPrice(symbol),
        indicators.getIndicatorValue(
          symbol,
          constants.TIMEFRAME.MINUTE30,
          constants.PERIOD.EMA8,
          constants.INDICATOR.EMA
        ),
      ]);
      var price = parseFloat(indicatorResults[0].bidPrice);
      var ema21 = indicatorResults[1].value;
      if(price < ema8){
          console.log(`price:${price}|ema21:${ema21}`)
          return true;
      }
      return false;
  },
};
