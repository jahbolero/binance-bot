const validator = require("./validator");
const constants = require("../shared/constants");
const binance = require("./binance");
const schedule = require('node-schedule');
var INTERVAL_ID;
var running = false;
var havePosition = false;
var job;
module.exports = {
  start: (order) => {
    if (running == false) {
      console.log(`Starting Scheduler for ${order.symbol} at ${order.quantity} quantity`);
      running = true;
       job = schedule.scheduleJob('0/5 * * * *', async () => {
        if(!havePosition){
          console.log("Running buy validators")
          if(await validator.ValidateBuy(order.symbol)){
              console.log("Buying");
              var result = await binance.BinanceBuy(order);
              if(result.status ==="FILLED"){
                havePosition = true;
              }
          }
        }else{
          console.log("Running sell validators")
          if(await validator.ValidateSell(order.symbol)){
              console.log("Selling");
              var result = await binance.BinanceSell(order);
              if(result.status ==="FILLED"){
                havePosition = false;
              }
          }
        }
      });
      return "starting";
    } else {
      return "failed to start";
    }
  },
  stop: async (order) => {
    job.cancel();
    running = false;
    havePosition = false;
    console.log(order)
    var result = await binance.BinanceSell(order);
    return "stopped scheduler";
  },
};
