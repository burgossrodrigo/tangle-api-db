const { queryPools, _tokenSymbol, timeOut, tokenBalance} = require('../functions/functions')
const dayjs = require('dayjs')


const poolService = async (limit) => {
    try {
        const result = await queryPools(limit)
        let arr = []
        const dataSet = new Set()
        const interval = ((result.length * 40 )* 2) * 3
    
        for (const data of result) {
            console.log('chamou')
            if(!dataSet.has(data)){
                await Promise.all([
                    tokenBalance(data.token0, data.pool), 
                    tokenBalance(data.token1, data.pool), 
                    timeOut(interval)
                ]).then((promise) => {
                    console.log(promise, 'promise')
                    const symbol0 = data.symbol0
                    const symbol1 = data.symbol1
                    const balance0 = promise[0]
                    const balance1 = promise[1]
                    const tvl = data.liquidity[data.liquidity.length - 1].liquidity
                    const fee = data.fee
                    const volume24H = () => {
                        let volume;
                        for (let i = 0; i < data.liquidity.length; i++) {
                            if(dayjs(data.liquidity[i].time).format('DD') !== dayjs(data.liquidity[data.liquidity.length - 1].liquidity).format('DD')){
                                volume = Number(data.liquidity[data.liquidity.length - 1].liquidity) - Number(data.liquidity[i].liquidity)
                                break
                            }
                        }
                        return volume
                    }
                    const volume7D = () => {
                        let volume;
                        for (let i = 0; i < data.liquidity.length; i++) {
                            if(dayjs(data.liquidity[data.liquidity.length - 1].liquidity - dayjs(data.liquidity[i].time).format('DD')).format('DD') === 7){
                                volume = Number(liquidityArr[liquidityArr.length - 1].liquidity) - Number(liquidityArr[i].liquidity)
                                break
                            }
                            else
                            {
                                volume = volume24H()
                            }
                        }
                        return volume
                    }
                    dataSet.add(data)
                    arr.push({
                        symbol0: data.symbol0,
                        symbol1: data.symbol1,
                        token0: data.token0,
                        token1: data.token1,
                        balance0: Number(balance0._hex),
                        balance1: Number(balance1._hex),
                        pool: data.pool,
                        tvl: tvl,
                        priceArr: data.price,
                        liquidityArr: data.liquidity,
                        volume24H: volume24H(),
                        volume7D: volume7D(),
                        fee: fee
                    })
                })
            }
        }
        return arr
    } catch (error) {
        console.log(error, 'for pool service')
    }
}


module.exports = poolService