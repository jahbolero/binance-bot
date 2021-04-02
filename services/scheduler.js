const validator = require("./validator");
const constants = require("../shared/constants");
const binance = require("./binance");
const schedule = require('node-schedule');
var INTERVAL_ID;
var running = false;
var positions = [];
var runningJobs = [];
module.exports = {
  start: (order) => {
      if(runningJobs.find(job=>job.name === order.symbol) == undefined){
        console.log(`Starting Scheduler for ${order.symbol} at ${order.quantity} quantity`);
        var job = schedule.scheduleJob(order.symbol,'0/30 * * * *', async () =>{validatorJob(order)});
        runningJobs.push(job);
        return `Starting Scheduler for ${order.symbol} at ${order.quantity} quantity`;
      }else{
        return `There is an existing bot for ${order.symbol}`;
      }
  },
  stop: async (order) => {
    var runningJob = runningJobs.find(job=>job.name === order.symbol);
    if(runningJob === undefined){
     return "No job for this symbol";
    }
    runningJob.cancel();
    runningJobs = runningJobs.filter(job => job.name !== order.symbol);
    if(positions.find(position => position.symbol === order.symbol) != undefined){
      var result = await binance.BinanceSell(order);
      console.log(`Stopped and sold ${order.symbol}`);
      return "Sold remaining position, stopped scheduler";
    }else{
      return "No position, stopped scheduler";
    }
  },
};
async function validatorJob(order){
  
  if(positions.find(position => position.symbol === order.symbol) == undefined){
    console.log(`Running buy validators for ${order.symbol}`);
    if(await validator.ValidateBuy(order.symbol)){
        console.log("Buying");
        var result = await binance.BinanceBuy(order);
        if(result.status ==="FILLED"){
        var newPosition = {symbol:order.symbol};
        positions.push(newPosition);
        }
    }
  }else{
    console.log(`Running sell validators ${order.symbol}`)
    if(await validator.ValidateSell(order.symbol)){
        console.log("Selling");
        order.quantity = order.quantity * 0.998;//Take fees into consideration.
        var result = await binance.BinanceSell(order);
        if(result.status ==="FILLED"){
        positions = positions.filter(position => position.symbol != order.symbol);
        }
    }
  }
}
