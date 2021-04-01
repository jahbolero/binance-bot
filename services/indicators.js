const axios = require('axios');
const CONSTANTS = require ('../shared/constants');
module.exports={
    getIndicatorValue: async (symbol,interval,period,indicator) =>{
        try{
            var query = `${CONSTANTS.TAAPI_URL}/${indicator}?secret=${process.env.TAAPI_KEY}&exchange=${CONSTANTS.BINANCE}&symbol=${symbol}/${CONSTANTS.FIAT}&interval=${interval}`;
            if(period!=null){
                query = query+`&optInTimePeriod=${period}`
            }
            var result =await axios.get(query);
            return result.data;
        }catch(error){
            console.log(error);
        } 
    },
    getEma12: async () =>{

    },
    getEma21: async () =>{

    },
    getRsi: async() =>{

    }
}