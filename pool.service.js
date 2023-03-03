const { queryPools, _tokenSymbol, timeOut} = require('./functions')
const dayjs = require('dayjs')


const poolService = async (limit) => {
    try {
        const result = await queryPools(limit)
        let arr = []
        const dataSet = new Set()
        const interval = result.length * 60 * 2 
    
        for (const data of result) {
            console.log('chamou')
            if(!dataSet.has(data)){
                console.log(data.token1, data.token0, 'aqui')
                const [symbols, _] = await Promise.all([_tokenSymbol(data.token1, data.token0), timeOut(interval)])
            const symbol0 = symbols?.symbol0
            const symbol1 = symbols?.symbol1
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
                symbol0: symbol0,
                symbol1: symbol1,
                tvl: tvl,
                volume24H: volume24H(),
                volume7D: volume7D(),
                fee: fee
            })
            }
        }
        return arr
    } catch (error) {
        console.log(error, 'for pool service')
    }
}


module.exports = poolService