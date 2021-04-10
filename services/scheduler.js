const validator = require("./validator");
const constants = require("../shared/constants");
const binance = require("./binance");
const schedule = require('node-schedule');
var positions = [];
var runningJobs = [];
module.exports = {
  start: (orders) => {
      orders.forEach(order => {
        if(runningJobs.find(job=>job.name === order.symbol) == undefined){
          console.log(`Starting Scheduler for ${order.symbol} at ${order.amount} amount`);
          var job = schedule.scheduleJob(order.symbol,'0/5 * * * *', async () =>{validatorJob(order)});
          runningJobs.push(job);
          return `Starting Scheduler for ${order.symbol} at ${order.amount} amount`;
        }else{
          return `There is an existing bot for ${order.symbol}`;
        }
      })
  },
  stop: async (orders) => {
    orders.forEach( async order => {
      var runningJob = runningJobs.find(job=>job.name === order.symbol);
      if(runningJob === undefined){
       return "No job for this symbol";
      }

      var position = positions.find(position => position.symbol === order.symbol)
      if(position){
        let stepSize = global.minimums[order.symbol+constants.FIAT].stepSize;
        var quantity = (position.quantity*0.999);
        quantity = binance.convertQuantityStep(quantity,stepSize);
        var result = await binance.BinanceSell(order.symbol,quantity);
        if(result.status == constants.FILLED){
          runningJob.cancel();
          runningJobs = runningJobs.filter(job => job.name !== order.symbol);
          console.log(`Stopped and sold ${order.symbol}`);
          return "Sold remaining position, stopped scheduler";
        }else{
          console.log("Couldn't fill order");
        }
      }else{
        return "No position, stopped scheduler";
      }
    })
  },
};
async function validatorJob(order){
  var position = positions.find(position => position.symbol === order.symbol)
  if(position == undefined){
    console.log(`Running buy validators for ${order.symbol}`);
    quantity = await validator.ValidateBuy515(order)
    if(quantity){
        console.log("Buying");
        var result = await binance.BinanceBuy(order.symbol,quantity);
        if(result.status ===constants.FILLED){
        var newPosition = {symbol:order.symbol,quantity:parseFloat(result.executedQty)};
        positions.push(newPosition);
      }
    }
  }else{
    console.log(`Running sell validators ${order.symbol}`)
    order.quantity = position.quantity;
    var quantity = await validator.ValidateSell515(order);
    if(quantity){
        console.log("Selling");
        var result = await binance.BinanceSell(order.symbol,quantity);
        if(result.status === constants.FILLED){
        positions = positions.filter(position => position.symbol != order.symbol);
        }
    }
  }
}
