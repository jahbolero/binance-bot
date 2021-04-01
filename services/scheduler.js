const validator = require("./validator");
const constants = require("../shared/constants");
const binance = require("./binance");
var INTERVAL_ID;
var running = false;
var havePosition = false;
module.exports = {
  start: (order) => {
    if (running == false) {
      console.log(`Starting Scheduler for ${order.symbol} at ${order.quantity} quantity`);
      running = true;
      INTERVAL_ID = setInterval(async () => {
          if(!havePosition){
            console.log("Running buy validators")
            if(await validator.ValidateBuy(order.symbol)){
                console.log("Buying");
                var result = await binance.BinanceBuy(order);
                if(result.status ==="FILLED"){
                  console.log(result);
                  havePosition = true;
                }

            }
          }else{
            if(await validator.ValidateSell(order.symbol)){
                console.log("Running sell validators")
                console.log("Selling");
                var result = await binance.BinanceSell(order);
                if(result.status ==="FILLED"){
                  console.log(result);
                  havePosition = false;
                }
            }
          }
      }, constants.INTERVAL);
      return "starting";
    } else {
      return "failed to start";
    }
  },
  stop: () => {
    clearInterval(INTERVAL_ID);
    running = false;
    return "stopped scheduler";
  },
};
