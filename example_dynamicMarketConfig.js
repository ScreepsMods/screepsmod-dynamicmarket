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
    for (let res in baseMinerals) {
        if (!basePrices[res]) { continue; }
        sellPrices[res] = basePrices[res] * marketPriceRatio;
    }
    return sellPrices;
}
const commodities = {
    "utrium_bar":{"U":5,"energy":2},"lemergium_bar":{"L":5,"energy":2},"zynthium_bar":{"Z":5,"energy":2},"keanium_bar":{"K":5,"energy":2},"ghodium_melt":{"U":5,"L":5,"K":5,"Z":5,"energy":2},
    "oxidant":{"O":5,"energy":2},"reductant":{"H":5,"energy":2},"purifier":{"X":5,"energy":2},
    "composite":{"utrium_bar":1,"energy":1,"zynthium_bar":1},"crystal":{"lemergium_bar":1,"energy":7.5,"keanium_bar":1,"purifier":1},"liquid":{"oxidant":1,"energy":7.5,"reductant":1,"ghodium_melt":1},
    "wire":{"utrium_bar":1,"energy":2,"silicon":5},"switch":{"utrium_bar":7,"energy":4,"wire":8,"oxidant":19},"transistor":{"energy":8,"switch":4,"wire":15,"reductant":85},"microchip":{"transistor":2, "composite":50, "wire":117, "purifier": 25, "energy": 16},"circuit":{"microchip":1, "transistor":5, "switch":4, "oxidant":115, "energy": 32},"device":{"circuit":1, "microchip":3, "crystal":110, "ghodium_melt":150, "energy": 64},
    "cell":{"lemergium_bar":1,"energy":2,"biomass":5},"phlegm":{"lemergium_bar":8,"energy":4,"cell":10,"oxidant":18},"tissue":{"cell":5,"phlegm":5,"reductant":55,"energy":8},"muscle":{"tissue":3,"phlegm":3,"zynthium_bar":50,"reductant":50,"energy":16},"organoid":{"muscle":1,"tissue":5,"purifier":208,"oxidant":256,"energy":32},"organism":{"organoid":1,"liquid":150,"tissue":6,"cell":310,"energy":64},
    "alloy":{"zynthium_bar":1,"energy":2,"metal":5},"tube":{"zynthium_bar":8,"energy":4,"alloy":20},"fixtures":{"composite":20,"alloy":41,"oxidant":161,"energy":8},"frame":{"fixtures":2,"tube":4,"reductant":330,"zynthium_bar":31,"energy":16},"hydraulics":{"liquid":150,"fixtures":3,"tube":15,"purifier":208,"energy":32},"machine":{"hydraulics":1,"frame":2,"fixtures":3,"tube":12,"energy":64},
    "condensate":{"keanium_bar":1,"energy":2,"mist":5},"concentrate":{"condensate":10,"keanium_bar":5,"reductant":18,"energy":4},"extract":{"concentrate":5,"condensate":15,"oxidant":30,"energy":8},"spirit":{"extract":2,"concentrate":6,"reductant":90,"purifier":20,"energy":16},"emanation":{"spirit":2,"extract":2,"concentrate":3,"keanium_bar":112,"energy":32},"essence":{"emanation":1,"spirit":3,"crystal":110,"ghodium_melt":150, "energy": 64}
}

function setBuyPrices(basePrices) {
    let buyPrices = {};
    for (let res in basePrices) {
        if (!basePrices[res]) { continue; }
        buyPrices[res] = basePrices[res];
    }
    // Loop thru commodities to set their prices based on ingredient cost
    for (let commodity in commodities) {
        buyPrices[commodity] = getCommoditiesPrice(commodity, basePrices, buyPrices);
    }
    return buyPrices;
}

function getCommoditiesPrice(commodity, basePrices, buyPrices) {
    // If we already have it return it otherwise loop thru ingredients
    if (buyPrices[commodity]) return buyPrices[commodity];
    for (let ingredient in commodity) {
        if (buyPrices[ingredient]) {
            buyPrices[commodity] += (buyPrices[ingredient] * commodity[ingredient]);
        } else {
            buyPrices[ingredient] = 0;
            if (!basePrices[ingredient]) { continue; }
            // If the ingredient is a commodity, get its price based on ingredients
            if (commodities[ingredient]) {
                buyPrices[commodity] += (getCommoditiesPrice(ingredient, basePrices, buyPrices) * commodity[ingredient]);
            } else {
                buyPrices[commodity] += (basePrices[ingredient] * commodity[ingredient]);
            }
        }
    }
    buyPrices[commodity] *= DEFAULTS.commodityMarkup;
    return buyPrices[commodity];
}

module.exports = { settings: customConfig }