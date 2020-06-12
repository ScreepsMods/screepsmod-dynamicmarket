const baseMinerals = { H: {}, O: {}, X: {}, U: {}, L: {}, K: {}, Z: {} }
const customConfig = {
    // Configure and rename this to 'config.js'
    randomMarketEvents: false, // Not yet implemented
    randomBoostSales: false,
    randomBoostPrices: { // Set prices to 0 to not sell that tier
        0: 0.25, // Tier 1 boosts
        1: 0.5, // Tier 2 boosts
        2: 1.5 // Tier 3 boosts
    },

    // Market Types
    // 'fixed' - Prices do not change from the settings below.
    // 'dynamic' - Prices/demand fluctuate based off supply. (Advanced settings at the bottom)
    // 'random' - Prices are random but close to what is set here.
    // NOTES
    // To remove resources set the prices as 0
    marketType: 'dynamic',

    // Commodity buy prices markup
    commodityMarkup: 1.25,

    // Base minerals sell/buy price ratio 
    marketPriceRatio: 2.0,

    // Set base (buy) prices, used to calculate commodities and sell orders
    basePrices: {
        H: 0.1,
        O: 0.1,
        Z: 0.15,
        L: 0.15,
        U: 0.15,
        K: 0.15,
        X: 0.25,
        energy: 0.01,
        metal: 2.5,
        biomass: 2.5,
        silicon: 2.5,
        mist: 2.5,
    },

    // Set the base order amounts (These fluctuate in dynamic market types and with the number of player terminals ingame)
    sellAmount: 25000, // Consider this a "per user amount" as it is multiplied by the number of active player terminals
    buyAmount: 50000, // Consider this a "per user amount" as it is multiplied by the number of active player terminals
    // Dynamic market settings (Dynamic market is on a NPC terminal room by room basis)
    tradingPeriod: 1000, // The period in which trading is considered for price changes
    saturationPoint: 2000 // ~This amount (some randomness here) triggers market oversaturation, this also automatically scales with terminal count
}

customConfig.sellPrices = setSellPrices(DEFAULTS.basePrices, DEFAULTS.marketPriceRatio)
customConfig.buyPrices = setBuyPrices(DEFAULTS.basePrices, DEFAULTS.commodityMarkup)

function setSellPrices(basePrices, marketPriceRatio) {
    let sellPrices = {};    
    for (var res in baseMinerals) {
        if (!basePrices[res]) { continue; }
        sellPrices[res] = basePrices[res] * marketPriceRatio;
    }
    return sellPrices;
}​
function setBuyPrices(basePrices, commodityMarkup) {
    let buyPrices = {};
    
    const compounds = {"utrium_bar":{"U":5,"energy":2},"lemergium_bar":{"L":5,"energy":2},"zynthium_bar":{"Z":5,"energy":2},"keanium_bar":{"K":5,"energy":2},"ghodium_melt":{"U":5,"L":5,"K":5,"Z":5,"energy":2},"oxidant":{"O":5,"energy":2},"reductant":{"H":5,"energy":2},"purifier":{"X":5,"energy":2},"composite":{"U":5,"energy":5,"Z":5},"crystal":{"L":5,"energy":13.5,"K":5,"X":5},"liquid":{"O":5,"energy":13.5,"H":5,"U":5,"L":5,"K":5,"Z":5},"wire":{"U":5,"energy":4,"silicon":5},"switch":{"U":75,"energy":88,"silicon":40,"O":95},"transistor":{"U":375,"energy":590,"silicon":235,"O":380,"H":425},"microchip":{"U":1585,"energy":1964,"silicon":1055,"O":760,"H":850,"Z":250,"X":125},"circuit":{"U":3760,"energy":5528,"silicon":2390,"O":3615,"H":2975,"Z":250,"X":125},"device":{"U":9265,"energy":13269,"silicon":5555,"O":5895,"H":5525,"Z":1750,"X":1050,"L":1300,"K":1300},"cell":{"L":5,"energy":4,"biomass":5},"phlegm":{"L":90,"energy":96,"biomass":50,"O":90},"tissue":{"L":475,"energy":618,"biomass":275,"O":450,"H":275},"muscle":{"L":1695,"energy":2358,"biomass":975,"O":1620,"H":1075,"Z":250},"organoid":{"L":4070,"energy":6408,"biomass":2350,"O":5150,"H":2450,"Z":250,"X":1040},"organism":{"L":9220,"energy":13445,"biomass":5550,"O":8600,"H":4850,"Z":1000,"X":1040,"U":750,"K":750},"alloy":{"Z":5,"energy":4,"metal":5},"tube":{"Z":140,"energy":100,"metal":100},"fixtures":{"U":100,"energy":594,"Z":305.00000000000006,"metal":205.00000000000003,"O":805},"frame":{"U":200,"energy":2326,"Z":1325,"metal":810,"O":1610,"H":1650.0000000000002},"hydraulics":{"O":3165,"energy":5755,"H":750,"U":1050,"L":750,"K":750,"Z":3765,"metal":2115,"X":1040},"machine":{"O":8800,"energy":13453,"H":4050.0000000000005,"U":1750,"L":750,"K":750,"Z":9010,"metal":5550,"X":1040},"condensate":{"K":5,"energy":4,"mist":5},"concentrate":{"K":75,"energy":90,"mist":50,"H":90},"extract":{"K":450,"energy":578,"mist":325,"H":449.99999999999994,"O":150},"spirit":{"K":1350,"energy":1932,"mist":950,"H":1890,"O":300,"X":100},"emanation":{"K":4385,"energy":5546,"mist":2700,"H":4950,"O":900,"X":200},"essence":{"K":9735,"energy":13191,"mist":5550,"H":10620,"O":1800,"X":1050,"L":1300,"U":750,"Z":750}}
    for (var res in basePrices) {
        if (!basePrices[res]) { continue; }
        buyPrices[res] = basePrices[res];
    }
    
    for (var res in compounds) {
        var commodity = compounds[res]
        buyPrices[res] = 0;
        for (var ingredient in commodity) {
            if (!basePrices[ingredient]) { continue; }
            buyPrices[res] += commodity[ingredient] * basePrices[ingredient];
        }
        buyPrices[res] *= commodityMarkup;
    }
    return buyPrices;
}
module.exports = { settings: customConfig }