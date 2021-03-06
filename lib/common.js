const path = require('path')

const DEFAULTS = {
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
    // Set the base sell prices
    sellPrices: {
        H: 0.1,
        O: 0.1,
        U: 0.3,
        L: 0.3,
        K: 0.3,
        Z: 0.3,
        X: 0.95,
        energy: 1,
        metal: 0,
        biomass: 0,
        silicon: 0,
        mist: 0,
        utrium_bar: 0,
        lemergium_bar: 0,
        zynthium_bar: 0,
        keanium_bar: 0,
        ghodium_melt: 0,
        oxidant: 0,
        reductant: 0,
        purifier: 0,
        battery: 0,
        wire: 0,
        cell: 0,
        alloy: 0,
        condensate: 0,
        composite: 0,
        crystal: 0,
        liquid: 0,
        switch: 0,
        transistor: 0,
        microchip: 0,
        circuit: 0,
        device: 0,
        phlegm: 0,
        tissue: 0,
        muscle: 0,
        organoid: 0,
        organism: 0,
        tube: 0,
        fixtures: 0,
        frame: 0,
        hydraulics: 0,
        machine: 0,
        concentrate: 0,
        extract: 0,
        spirit: 0,
        emanation: 0,
        essence: 0
    },
    // Set the base buy prices
    buyPrices: {
        H: 0.02,
        O: 0.02,
        U: 0.05,
        L: 0.05,
        K: 0.05,
        Z: 0.05,
        X: 0.15,
        energy: 0.015,
        metal: 0.65,
        biomass: 0.65,
        silicon: 0.65,
        mist: 0.65,
        utrium_bar: 0.45,
        lemergium_bar: 0.45,
        zynthium_bar: 0.45,
        keanium_bar: 0.45,
        ghodium_melt: 1.75,
        oxidant: 0.275,
        reductant: 0.275,
        purifier: 1.25,
        battery: 0.025,
        wire: 2.75,
        cell: 2.75,
        alloy: 2.75,
        condensate: 2.75,
        composite: 2.25,
        crystal: 7.75,
        liquid: 4.75,
        switch: 70,
        transistor: 345,
        microchip: 2000,
        circuit: 6500,
        device: 12500,
        phlegm: 70,
        tissue: 345,
        muscle: 2000,
        organoid: 6500,
        organism: 12500,
        tube: 70,
        fixtures: 345,
        frame: 2000,
        hydraulics: 6500,
        machine: 12500,
        concentrate: 70,
        extract: 345,
        spirit: 2000,
        emanation: 6500,
        essence: 12500
    },
    // Set the base order amounts (These fluctuate in dynamic market types and with the number of player terminals ingame)
    sellAmount: 25000, // Consider this a "per user amount" as it is multiplied by the number of active player terminals
    buyAmount: 50000, // Consider this a "per user amount" as it is multiplied by the number of active player terminals
    // Dynamic market settings (Dynamic market is on a NPC terminal room by room basis)
    tradingPeriod: 1000, // The period in which trading is considered for price changes
    saturationPoint: 2000 // ~This amount (some randomness here) triggers market oversaturation, this also automatically scales with terminal count
}

module.exports = function (config) {
    try {
        const configPath = path.resolve(process.cwd(), 'dynamicMarketConfig.js')
        console.log("dynamicMarket: looking for dynamicMarketConfig.js in " + configPath)
        config.market = require(configPath).settings
        console.log('dynamicMarket: dynamicMarketConfig.js file found and loaded successfully.')
    } catch (e) {
        console.log('dynamicMarket: dynamicMarketConfig.js file not found, reverting to defaults.')
        config.market = DEFAULTS
    }
}

