module.exports = function (config) {
    if (config.cronjobs) {
        config.cronjobs.recreateNpcOrders = [300, () => manageOrders(config)]
        config.cronjobs.updateNpcOrders = [60, () => updateOrders(config)]
    }
}

// Manage orders every 5 minutes
async function manageOrders(config) {
    const {common: {storage: {db, env}}, market} = config
    const gameTime = await env.get(env.keys.GAMETIME).then(data => parseInt(data))
    const nowTimestamp = new Date().getTime()
    let queued = []
    let terminals = await db['rooms.objects'].find({$and: [{type: 'terminal'}, {user: {$eq: null}}]})
    let ps = terminals.map(async terminal => {
        let orders = await db['market.orders'].find({roomName: terminal.room})
        orders = orders.reduce((l, v) => {
            l[v.type][v.resourceType] = v
            return l
        }, {buy: {}, sell: {}})
        let mineralOrders = arrayUnique(Object.keys(market.buyPrices).concat(Object.keys(market.sellPrices)))
        // Add mineral orders
        mineralOrders.forEach(mineral => {
            if (Object.keys(market.buyPrices).includes(mineral) && !orders.buy[mineral] && market.buyPrices[mineral] * 1000 > 0) {
                let buyPrice = market.buyPrices[mineral] * 1000
                let buy = {
                    created: gameTime,
                    createdTimestamp: nowTimestamp,
                    active: true,
                    type: 'buy',
                    resourceType: mineral,
                    roomName: terminal.room,
                    remainingAmount: market.buyAmount,
                    totalAmount: market.buyAmount,
                    amount: market.buyAmount
                }
                // Handle pricing
                if (market.marketType === 'fixed') {
                    buy.price = buyPrice
                } else {
                    buy.price = buyPrice * (Math.random() * (+1.2 - +0.8) + +0.8)
                }
                delete buy._id
                // Add to queue
                queued.push(buy)
            } else if (orders.buy[mineral] && (!Object.keys(market.buyPrices).includes(mineral) || market.buyPrices[mineral] * 1000 <= 0)) {
                // Remove bad orders
                db['market.orders'].removeWhere({_id: orders.buy[mineral]._id})
            }
            if (Object.keys(market.sellPrices).includes(mineral) && !orders.sell[mineral] && market.sellPrices[mineral] * 1000 > 0) {
                let sellPrice = market.sellPrices[mineral] * 1000
                let sell = {
                    created: gameTime,
                    createdTimestamp: nowTimestamp,
                    active: true,
                    type: 'sell',
                    resourceType: mineral,
                    roomName: terminal.room,
                    remainingAmount: market.sellAmount,
                    totalAmount: market.sellAmount,
                    amount: market.sellAmount
                }
                // Handle pricing
                if (market.marketType === 'fixed') {
                    sell.price = sellPrice
                } else {
                    sell.price = sellPrice * (Math.random() * (+1.2 - +0.8) + +0.8)
                }
                delete sell._id
                // Add to queue
                queued.push(sell)
            } else if (orders.sell[mineral] && (!Object.keys(market.sellPrices).includes(mineral) || market.sellPrices[mineral] * 1000 <= 0)) {
                // Remove bad orders
                db['market.orders'].removeWhere({_id: orders.sell[mineral]._id})
            }
        })
        // Handle random boost sales
        if (market.randomBoostSales) {
            if (!boosts[0].concat(boosts[1]).concat(boosts[2]).find((b) => orders.sell[b] && !Object.keys(market.sellPrices).includes(b))) {
                let randomBoost, amount, price;
                // Chance it's higher tier (10% for T3, 30% for T2, 60% for T1
                if (market.randomBoostPrices[2] > 0 && Math.random() > 0.9) {
                    amount = (Math.random() * (+1000 - +150) + +150);
                    price = market.randomBoostPrices[2];
                    randomBoost = boosts[2][Math.floor(Math.random()*boosts[2].length)];
                } else if (market.randomBoostPrices[1] > 0 && Math.random() > 0.7) {
                    amount = (Math.random() * (+1500 - +250) + +250);
                    price = market.randomBoostPrices[1];
                    randomBoost = boosts[1][Math.floor(Math.random()*boosts[1].length)];
                } else if (market.randomBoostPrices[0] > 0 && Math.random() > 0.4) {
                    amount = (Math.random() * (+2500 - +450) + +450);
                    price = market.randomBoostPrices[0];
                    randomBoost = boosts[0][Math.floor(Math.random()*boosts[0].length)];
                }
                if (randomBoost) {
                    let sell = {
                        created: gameTime,
                        createdTimestamp: nowTimestamp,
                        active: true,
                        type: 'sell',
                        resourceType: randomBoost,
                        roomName: terminal.room,
                        remainingAmount: amount,
                        totalAmount: amount,
                        amount: amount,
                        price: price
                    }
                    delete sell._id
                    // Add to queue
                    queued.push(sell)
                }
            } else {
                let onSale = boosts[0].find((b) => orders.sell[b] && !Object.keys(market.sellPrices).includes(b));
                if (orders.sell[onSale].created + 1000 < gameTime) {
                    db['market.orders'].removeWhere({_id: orders.sell[onSale]._id})
                }
            }
        }
        // Input new orders
        queued.forEach((o) => db['market.orders'].insert(o))
    })
    return Promise.all(ps)
}

// Update orders amount and prices only occurs every 500 ticks
async function updateOrders(config) {
    const {common: {storage: {db, env}}, market} = config
    const gameTime = await env.get(env.keys.GAMETIME).then(data => parseInt(data))
    const nowTimestamp = new Date().getTime()
    let queued = []
    let NPCTerminals = await db['rooms.objects'].find({$and: [{type: 'terminal'}, {user: {$eq: null}}]})
    let playerTerminals = await db['rooms.objects'].find({$and: [{type: 'terminal'}, {user: {$ne: null}}]})
    let ps = NPCTerminals.map(async terminal => {
        let marketData = terminal['marketData']
        // If room market has never been managed or is due for an update
        if (!marketData || marketData['nextUpdate'] < gameTime) {
            if (!marketData) marketData = {}
            let orders = await db['market.orders'].find({roomName: terminal.room})
            orders = orders.reduce((l, v) => {
                l[v.type][v.resourceType] = v
                return l
            }, {buy: {}, sell: {}})
            let mineralOrders = arrayUnique(Object.keys(market.buyPrices).concat(Object.keys(market.sellPrices)))
            mineralOrders.forEach(mineral => {
                // Handle fixed/random markets
                let activeOrder = orders.buy[mineral] || orders.sell[mineral]
                if (activeOrder) {
                    if (market.marketType !== 'dynamic') {
                        if (orders.sell[mineral]) {
                            let order = orders.sell[mineral]
                            let baseSellPrice = market.sellPrices[mineral] * 1000
                            order.created = gameTime
                            order.createdTimestamp = nowTimestamp
                            order.remainingAmount = market.sellAmount * (playerTerminals.length + 1)
                            order.totalAmount = market.sellAmount * (playerTerminals.length + 1)
                            order.amount = market.sellAmount * (playerTerminals.length + 1)
                            if (market.marketType === 'random') {
                                let randomAmount = market.sellAmount * (Math.random() * (+1.2 - +0.8) + +0.8) * (playerTerminals.length + 1)
                                order.remainingAmount = randomAmount
                                order.totalAmount = randomAmount
                                order.amount = randomAmount
                                order.price = baseSellPrice * (Math.random() * (+1.2 - +0.8) + +0.8)
                            } else {
                                order.price = baseSellPrice
                            }
                            queued.push(order)
                        }
                        if (orders.buy[mineral]) {
                            let order = orders.buy[mineral]
                            let baseBuyPrice = market.buyPrices[mineral] * 1000
                            order.created = gameTime
                            order.createdTimestamp = nowTimestamp
                            order.remainingAmount = market.buyAmount * (playerTerminals.length + 1)
                            order.totalAmount = market.buyAmount * (playerTerminals.length + 1)
                            order.amount = market.buyAmount * (playerTerminals.length + 1)
                            if (market.marketType === 'random') {
                                let randomAmount = market.buyAmount * (Math.random() * (+1.2 - +0.8) + +0.8) * (playerTerminals.length + 1)
                                order.remainingAmount = randomAmount
                                order.totalAmount = randomAmount
                                order.amount = randomAmount
                                order.price = baseBuyPrice * (Math.random() * (+1.2 - +0.8) + +0.8)
                            } else {
                                order.price = baseBuyPrice
                            }
                            queued.push(order)
                        }
                    } else {
                        // Handle dynamic buy orders
                        if (orders.buy[mineral]) {
                            let order = orders.buy[mineral]
                            let resourceData = marketData[mineral]
                            // Check if past data exists or if this is the first run
                            if (!resourceData) {
                                resourceData = {}
                                resourceData['stockpiled'] = order.totalAmount - order.remainingAmount
                                resourceData['stockpileUseTick'] = gameTime + market.tradingPeriod
                            }
                            // Get stockpile info
                            let oldStockpile = resourceData['stockpiled'] || 0
                            let newStockpile = order.totalAmount - order.remainingAmount
                            let totalStockpile = oldStockpile + newStockpile
                            // Get saturation point based off rarity
                            let saturationPoint = market.saturationPoint
                            if (commodityTiers[0].includes(mineral)) {
                                saturationPoint = (market.saturationPoint * (Math.random() * (+0.95 - +0.85) + +0.85)) * Math.ceil((playerTerminals.length + 1) * 0.5)
                            } else if (commodityTiers[1].includes(mineral)) {
                                saturationPoint = (market.saturationPoint * (Math.random() * (+0.8 - +0.65) + +0.65)) * Math.ceil((playerTerminals.length + 1) * 0.5)
                            } else if (commodityTiers[2].includes(mineral)) {
                                saturationPoint = (market.saturationPoint * (Math.random() * (+0.6 - +0.35) + +0.35)) * Math.ceil((playerTerminals.length + 1) * 0.5)
                            } else if (commodityTiers[3].includes(mineral)) {
                                saturationPoint = (market.saturationPoint * (Math.random() * (+0.4 - +0.2) + +0.2)) * Math.ceil((playerTerminals.length + 1) * 0.5)
                            } else if (commodityTiers[4].includes(mineral)) {
                                saturationPoint = (market.saturationPoint * (Math.random() * (+0.25 - +0.05) + +0.05)) * Math.ceil((playerTerminals.length + 1) * 0.5)
                            }
                            // Use some of the stockpile every trade cycle
                            if (resourceData['useStockpile'] < gameTime) {
                                totalStockpile -= saturationPoint * (Math.random() * (+1.1 - +0.35) + +0.35) // Use between 110%/35% of the saturation point
                                if (totalStockpile < 0) totalStockpile = 0
                                resourceData['stockpileUseTick'] = gameTime + market.tradingPeriod
                            }
                            resourceData['stockpiled'] = totalStockpile;
                            // Adjust price based on saturation point
                            // If saturationPoint is not met adjust price between 100% and 180% based on randomness and proximity to saturation point
                            let saturationModifier = (Math.random() * (+1.3 - +1) + +1) + ((Math.random() * (+((totalStockpile / saturationPoint) * 0.5) - +((totalStockpile / saturationPoint) * 0.25)) + +((totalStockpile / saturationPoint) * 0.25)))
                            // If saturationPoint is met adjust price between 99% and 0.01% based on randomness and proximity to saturation point
                            if (totalStockpile > saturationPoint) {
                                saturationModifier = (Math.random() * (+(saturationPoint / totalStockpile) - +((saturationPoint / totalStockpile) * 0.75)) + +((saturationPoint / totalStockpile) * 0.75)) + (Math.random() * (+0.2 - +0.01) + +0)
                                // This can't be more than 1
                                if (saturationModifier > 1) {
                                    saturationModifier = 1
                                }
                            }
                            order.remainingAmount = market.buyAmount * (playerTerminals.length + 1)
                            order.totalAmount = market.buyAmount * (playerTerminals.length + 1)
                            order.amount = market.buyAmount * (playerTerminals.length + 1)
                            order.price = (market.buyPrices[mineral] * 1000) * saturationModifier
                            marketData[mineral] = resourceData
                            queued.push(order)
                        }
                        // Handle dynamic sell orders
                        if (orders.sell[mineral]) {
                            let order = orders.sell[mineral]
                            let baseSellPrice = market.sellPrices[mineral] * 1000
                            let resourceData = marketData[mineral]
                            // Check if past data exists or if this is the first run
                            if (!resourceData) {
                                resourceData = {}
                                resourceData['totalSold'] = order.totalAmount - order.remainingAmount
                                resourceData['restockTick'] = gameTime + market.tradingPeriod
                            }
                            // Get stockpile info
                            let oldSold = resourceData['stockpiled'] || 0
                            let newSold = order.totalAmount - order.remainingAmount
                            let totalSold = oldSold + newSold
                            let saturationPoint = market.saturationPoint * 2.5
                            // Simulate Restocking
                            if (resourceData['restockTick'] < gameTime) {
                                totalSold -= saturationPoint * (Math.random() * (+1.1 - +0.35) + +0.35) // Use between 110%/35% of the saturation point
                                if (totalSold < 0) totalSold = 0
                                resourceData['stockpileUseTick'] = gameTime + market.tradingPeriod
                            }
                            order.created = gameTime
                            order.createdTimestamp = nowTimestamp
                            order.remainingAmount = market.sellAmount * (playerTerminals.length + 1)
                            order.totalAmount = market.sellAmount * (playerTerminals.length + 1)
                            order.amount = market.sellAmount * (playerTerminals.length + 1)
                            // Adjust price based on saturation point
                            // If saturationPoint is not met adjust price between 100% and 180% based on randomness and proximity to saturation point
                            let saturationModifier = (Math.random() * (+1.3 - +1) + +1) + ((Math.random() * (+((totalSold / saturationPoint) * 0.5) - +((totalSold / saturationPoint) * 0.25)) + +((totalSold / saturationPoint) * 0.25)))
                            // If saturationPoint is met adjust price between 99% and 0.01% based on randomness and proximity to saturation point
                            if (totalSold > saturationPoint) {
                                saturationModifier = (Math.random() * (+(saturationPoint / totalSold) - +((saturationPoint / totalSold) * 0.75)) + +((saturationPoint / totalSold) * 0.75)) + (Math.random() * (+0.2 - +0.01) + +0)
                                // This can't be more than 1
                                if (saturationModifier > 1) {
                                    saturationModifier = 1
                                }
                            }
                            order.price = baseSellPrice * saturationModifier
                            queued.push(order)
                        }
                    }
                }
            })
            // Update room object
            marketData['nextUpdate'] = Math.round(gameTime + (500 * (Math.random() + 0.05)))
            terminal['marketData'] = marketData
            await db['rooms.objects'].update({_id: terminal._id}, {$set: terminal})
        }
        // Update orders
        queued.forEach((o) => db['market.orders'].update({_id: o._id}, {$set: o}))
    })
    return Promise.all(ps)
}

const commodityTiers = {
    0: ['switch', 'phlegm', 'tube', 'concentrate'],
    1: ['transistor', 'tissue', 'fixtures', 'extract'],
    2: ['microchip', 'muscle', 'frame', 'spirit'],
    3: ['circuit', 'organoid', 'hydraulics', 'emanation'],
    4: ['device', 'organism', 'machine', 'essence']
}

const boosts = {
    0: ['ZK', 'UL', 'UH', 'UO', 'KH', 'KO', 'LH', 'LO', 'ZH', 'ZO', 'GH', 'GO'],
    1: ['UH2O', 'UHO2', 'KH2O', 'KHO2', 'LH2O', 'LHO2', 'ZH2O', 'ZHO2', 'GH2O', 'GHO2'],
    2: ['XUH2O', 'XUHO2', 'XKH2O', 'XKHO2', 'XLH2O', 'XLHO2', 'XZH2O', 'XZHO2', 'XGH2O', 'XGHO2']
};

// https://stackoverflow.com/a/1584377
function arrayUnique(array) {
    var a = array.concat()
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1)
        }
    }
    return a
}
