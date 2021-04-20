const validator = require("./validator");
const constants = require("../shared/constants");
const binance = require("./binance");
const schedule = require('node-schedule');
var positions = [];
var runningJobs = [];
module.exports = {
  start: (orders) => {
      orders.forEach(order => {
        if(runningJobs.find(job=>job.job.name === order.symbol) == undefined){
          console.log(`Starting Scheduler for ${order.symbol} at ${order.amount} amount`);
          var job = schedule.scheduleJob(order.symbol,'0/5 * * * *', async () =>{validatorJob(order)});
          runningJobs.push({job,balance:order.balance});
        }else{
          console.log(`There is an existing bot for ${order.symbol}`);
        }
      })
  },
  stop: async (orders) => {
    orders.forEach( async order => {
      var runningJob = runningJobs.find(job=>job.job.name === order.symbol);
      if(runningJob === undefined){
        console.log(`No job for ${order.symbol}`);
        return;
      }
      var position = positions.find(position => position.symbol === order.symbol)
      if(position){
        let stepSize = global.minimums[order.symbol+constants.FIAT].stepSize;
        var quantity = (position.quantity*0.999);
        quantity = binance.convertQuantityStep(quantity,stepSize);
        var result = await binance.BinanceSell(order.symbol,quantity);
        if(result.status == constants.FILLED){

          console.log(`Stopped and sold ${order.symbol}`);
        }else{
          console.log(`Couldn't fill order ${order.symbol}`);
        }
      }else{
         console.log(`No ${order.symbol} position, stopped scheduler`);
      }
      runningJob.job.cancel();
      runningJobs = runningJobs.filter(job => job.job.name !== order.symbol);
    })
  },
};
async function validatorJob(order){
  var position = positions.find(position => position.symbol === order.symbol)
  if(position == undefined){
    runningJob = runningJobs.find(job => job.job.name === order.symbol);
    order.amount = runningJob.balance == undefined? order.amount : runningJob.balance;
    console.log(`Running buy validators for ${order.symbol}`);
    quantity = await validator.ValidateBuy515(order)
    if(quantity){
        var result = await binance.BinanceBuy(order.symbol,quantity);
        if(result.status ===constants.FILLED){
        console.log(`Buying symbol:${order.symbol}|total:${result.cummulativeQuoteQty}|`)
        var newPosition = {symbol:order.symbol,quantity:parseFloat(result.executedQty)};
        positions.push(newPosition);
      }
    }
  }else{
    console.log(`Running sell validators ${order.symbol}`)
    order.quantity = position.quantity;
    var quantity = await validator.ValidateSell515(order);
    if(quantity){
        var result = await binance.BinanceSell(order.symbol,quantity);
        if(result.status === constants.FILLED){
        console.log(`Selling symbol:${order.symbol}|total:${result.cummulativeQuoteQty}|`)
        runningJob = runningJobs.find(job => job.job.name === order.symbol);
        runningJob.balance = parseFloat(result.cummulativeQuoteQty);
        positions = positions.filter(position => position.symbol != order.symbol);
        }
    }
  }
}
