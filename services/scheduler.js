const validator = require("./validator");
const constants = require("../shared/constants");
const binance = require("./binance");
const schedule = require('node-schedule');
var INTERVAL_ID;
var running = false;
var havePosition = false;
var runningJobs = [];
module.exports = {
  start: (order) => {
      if(runningJobs.find(job=>job.name === order.symbol) == undefined){
        console.log(`Starting Scheduler for ${order.symbol} at ${order.quantity} quantity`);
        running = true;
        var job = schedule.scheduleJob(order.symbol,'0/30 * * * *', validatorJob());
        runningJobs.push(job);
        return `Starting Scheduler for ${order.symbol} at ${order.quantity} quantity`;
      }else{
        return `There is an existing bot for ${order.symbol}`;
      }
  },
  stop: async (order) => {
    var job = runningJobs.find(job=>job.name === order.symbol);
    running = false;
    havePosition = false;
    console.log(order)
    var result = await binance.BinanceSell(order);
    return "stopped scheduler";
  },
};
async function validatorJob(){
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
}
