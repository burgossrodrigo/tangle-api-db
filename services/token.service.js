const { getWethPriceAndLiquidity, timeOut, queryPools } = require('../functions/functions')
const dayjs = require('dayjs')


const WETH_ADDRESS = process.env.WETH_ADDRESS

const tokenService = async () => {
    try {
            const poolRes = await queryPools(1000)
            const tokenSet = new Set()
            const interval = ((poolRes.length * 9) * 40 ) + ((poolRes.length * 40 )* 2) * 3
        
            let tokenArr = []
            for(const pool of poolRes){
                let _tokenAddress
                let _tokenDecimals
                if(pool.token1 === WETH_ADDRESS){
                    _tokenAddress = pool.token0
                    _tokenDecimals = pool.decimals0
                }
                else
                if(pool.token0 === WETH_ADDRESS){
                    _tokenAddress = pool.token1
                    _tokenDecimals = pool.decimals1
                }
                else
                if(pool.token0 !== WETH_ADDRESS && pool.token0 !== WETH_ADDRESS){
                    _tokenAddress = pool.token0
                    _tokenDecimals = pool.decimals0
                }
                console.log(_tokenAddress, 'tokenAddress')
                if(_tokenAddress !== undefined && _tokenDecimals !== undefined){
                        await Promise.all([getWethPriceAndLiquidity(_tokenAddress, _tokenDecimals), timeOut(interval)]).then((promises) => {
                            console.log(promises, 'promises')
                            const wethPriceAndLiquidity = promises[0]
                                    const priceArr = pool.price
                                    const tvlArr = pool.tvl || []
                                    const liquidityArr = pool.liquidity || []
                                    const lastPrice = () => {
                                        if(wethPriceAndLiquidity?.length > 0){
                                            const result = wethPriceAndLiquidity[0]?.price ?? 0
                                            return result
                                        }
                                        return 0
                                    }
                            
                                    const priceChange = () => {
                                        let percent
                                        for(let i = 0; i < priceArr.length; i++){
                                            if(dayjs(priceArr[i].time).format('DD') !== dayjs(priceArr[priceArr.length - 1].time).format('DD')){
                                                percent = ( 100 * lastPrice() ) / priceArr[i].price
                                                break
                                            }
                                        }
                                        return percent
                                    }
                            
                                    const TVL = () => {
                                        if(wethPriceAndLiquidity.length > 0){
                                            const accBalance = wethPriceAndLiquidity?.reduce((acc, cur) => {
                                                return acc + cur.wethBalance
                                            }, 0)
                                        return accBalance
                                        }
                                    }
                                    
                                    const volume24H = () => {
                                        let volume
                                        for(let i = 0; i < tvlArr.length; i++){
                                            if(dayjs(liquidityArr[i].time).format('DD') !== dayjs(liquidityArr[liquidityArr.length - 1].time).format('DD')){
                                                volume = Number(liquidityArr[liquidityArr.length - 1].liquidity) - Number(liquidityArr[i].liquidity)
                                                break
                                            }
                                        }
                                        return volume            
                                    }

                                    const _tokenName = pool.token1 === WETH_ADDRESS && pool.token0 !== WETH_ADDRESS ? pool.name0 : pool.name1
                                    const _tokenSymbol = pool.token1 === WETH_ADDRESS && pool.token0 !== WETH_ADDRESS ? pool.symbol0 : pool.symbol1
                                    const _tokenAdddress = pool.token1 === WETH_ADDRESS && pool.token0 !== WETH_ADDRESS ? pool.token0 : pool.token1

                                    if(!tokenSet.has(_tokenAdddress)){
                                        console.log('chamou')
                                        tokenArr.push({
                                            tokenName: _tokenName,
                                            tokenSymbol: _tokenSymbol,
                                            tokenAddress: _tokenAdddress,
                                            lastPrice: lastPrice(),
                                            priceChange: priceChange(),
                                            volume24H: volume24H(),
                                            TVL: TVL()
                                        })
                                        tokenSet.add(_tokenAdddress)
                                    }
                        })
                }  
        }
            return tokenArr
    } catch (error) {
        console.log(error, 'tokenService')
    }
}



module.exports = tokenService