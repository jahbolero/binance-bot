var express = require('express');
var router = express.Router();
var binance = require("../services/binance");
var scheduler = require("../services/scheduler");
var validator = require("../services/validator");
var screener = require("../services/screener");

router.post('/buy', async function(req, res, next) {
  console.log(req.body)
  if(!req.body){
    res.status(400)
    res.send("Error");
  }else{
    res.send(await binance.BinanceBuy(req.body.symbol,req.body.quantity));
  }
  
});

router.post('/sell', async function(req, res, next) {
  console.log(req.body)
  if(!req.body){
    res.status(400)
    res.send("Error");
  }else{
    res.send(await binance.BinanceSell(req.body.symbol,req.body.quantity));
  }
  
});
router.post('/symbol', async function(req, res, next) {
  console.log(req.body.symbol);
  var data = await binance.GetSymbolPrice(req.body.symbol)
  console.log(data);
  res.json(data);
});

router.get('/start', async function(req, res, next) {
  res.send(scheduler.start(req.body))
});
router.get('/stop', async function(req, res, next) {
  var data = await scheduler.stop(req.body)
  res.send(data);
});
router.post('/validateBuy', async function(req, res, next) {
  res.send(validator.ValidateBuy515(req.body));
});
router.post('/validateSell', async function(req, res, next) {
  res.send(validator.ValidateSell515(req.body));
});

router.get('/screen', async function(req, res, next) {
  try {
    let data = await screener.authorize();
    console.log(data);
    res.send(JSON.stringify(data));
  } catch(err) {
      res.send(err, 'error getting screens');
  }
});



module.exports = router;
