const ethers  = require("ethers")

const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC)


const { MongoClient, ServerApiVersion } = require('mongodb')
const uri = `mongodb+srv://burgossrodrigo:BeREmhPli0p3qFTq@tangle.hkje2xt.mongodb.net/?retryWrites=true&w=majority`
const mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

const POOL_ABI = require('../artifacts/POOLV3.json')
const FACTORY_ABI = require('../artifacts/FACTORYV3.json')
const ERC20_ABI = require('../artifacts/ERC20.json')

const WETH_ADDRESS = process.env.WETH_ADDRESS
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const queryTVL = async (limit) => {
    try {
        const collection = await mongoClient.db("tangle-db").collection("tvl")
        const documents = await collection.find({})
        .sort({ time: -1 }) // Sort by blockNumber in descending order
        .limit(limit) // Limit to the first 10 results
        .toArray()
        let docArr = []
            documents.map((data) => {
                    docArr.push({
                        tvl: data.tvl,
                        time: data.time
                    })
            })
      
        return docArr
    } catch (error) {
        console.log(error, 'for getLastTVL')
    }
}

const queryFee = async () => {
    try {
        const collection = await mongoClient.db("tangle-db").collection("fees-generated")
        const documents = await collection.find({})
        .toArray()
        let docArr = []
        documents.map((data) => {
                docArr.push({
                    fee: data.fee,
                    time: data._id.getTimestamp(),
                    poolAddress: data.poolAddress
                })
        })
        return docArr
    } catch (error) {
        console.log(error, 'queryFee')
    }
}

const queryLiquidityTransactions = async (limit) => {
    try {
        const collection = await mongoClient.db("tangle-db").collection("liquidity-transactions")
        const documents = await collection.find({})
        .sort({ block: -1 }) // Sort by blockNumber in descending order
        .limit(limit) // Limit to the first 10 results
        .toArray()
        let docArr = []
        
        documents.map((data) => {
                docArr.push({
                    eventName: data.eventName,
                    token0: data.token0Address,
                    token1: data.token1Address,
                    value: data.value,
                    symbol0: data.symbol0,
                    symbol1: data.symbol1,
                    amount0: data.amount0,
                    amount1: data.amount1,
                    account: data.account,
                    time: data.time,
                    blockNumber: data.block,
                    hash: data.transactionHash
                })                        
        })
        console.log(docArr)
        return docArr
    } catch (error) {
        console.log(error, 'for getLastTVL')
    }
}

//

const querySwapTransactions = async (limit) => {
    try {
        const collection = await mongoClient.db("tangle-db").collection("swap-transactions")
        const documents = await collection.find({})
        .sort({ block: -1 }) // Sort by blockNumber in descending order
        .limit(limit) // Limit to the first 10 results
        .toArray()
        let docArr = []
        documents.map((data) => {
                docArr.push({
                    eventName: data.eventName,
                    token0: data.token0Address,
                    token1: data.token1Address,
                    symbol0: data.symbol0,
                    symbol1: data.symbol1,
                    amount0: data.amount0,
                    amount1: data.amount1,
                    value: data.value,
                    time: data.time,
                    account: data.account,
                    blockNumber: data.block,
                    hash: data.transactionHash
                })                        
        })
        return docArr
    } catch (error) {
        console.log(error, 'for getLastTVL')
    }
}

const queryPools = async (limit) => {
    try {
        const collection = await mongoClient.db("tangle-db").collection("pools")
        if(limit !== undefined){
            const documents = await collection.find({})
            .sort({ time: -1 }) // Sort by blockNumber in descending order
            .limit(limit) // Limit to the first 10 results
            .toArray()
            return documents
        }
        const documents = await collection.find({})
        .toArray()
        return documents
    } catch (error) {
        console.log(error, 'for queryPools')
    }
}

const sqrtPriceToPrice = (sqrtPriceX96, token0Decimals, token1Decimals) => {
  
    let mathPrice = Number(sqrtPriceX96) ** 2 / 2 ** 192;
  
    const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
    const price = mathPrice * decimalAdjustment;
  
    return price;
  };

  const getWethPriceAndLiquidity = async (address, decimals) => {
    const feesArr = [3000, 1000, 10000]
    let poolsArr = []
    try {
            const factory = new ethers.Contract(process.env.FACTORY_ADDRESS, FACTORY_ABI, provider)
            const tokenSet = new Set()
            for(let i = 0; i < feesArr.length; i++){
                const fee = feesArr[i]
                console.log(address, 'from getWethPriceAndLiquidity')
                const poolAddress = await factory.getPool(address, WETH_ADDRESS, fee)
                let wethDecimals = 18
                if(poolAddress !== ZERO_ADDRESS && !tokenSet.has({tokenAddress: address, fee: fee})){
                    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider)
                    const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, provider)
                    let wethBalance = await wethContract.balanceOf(poolAddress)
                    wethBalance = Number(wethBalance._hex) / (10 ** wethDecimals)
                    const slot0 = await poolContract.slot0()
                    if(address > WETH_ADDRESS){
                        [wethDecimals, decimals] = [decimals, wethDecimals]
                    }
                    const price = sqrtPriceToPrice(Number(slot0.sqrtPriceX96), decimals, wethDecimals)
    
                    poolsArr.push({
                        poolAddress: poolAddress,
                        price: price,
                        wethBalance: wethBalance
                    })

                    tokenSet.add({tokenAddress: address, fee: fee})
                }
            }
            poolsArr.sort((a, b) => {
                return b.wethBalance - a.wethBalance
            })
            return poolsArr
    } catch (error) {
        console.log(error, 'for getWethPriceAndLiquidity')
    }
}

const _tokenName = async (token) => {
    try {
            const tokenCtt = new ethers.Contract(
                token,
                ERC20_ABI,
                provider
            )
    
            const tokenName = await tokenCtt.name()
            return tokenName
    } catch (error) {
        console.log(error, 'for tokenName')
    }
}

const _tokenSymbol = async (address) => {
    try {
            const erc20 = new ethers.Contract(
                address,
                ERC20_ABI,
                provider
            )    
            const result = await erc20.symbol()
            return result
    } catch (error) {
        console.log(error, 'for tokenName')
    }
}

const tokenBalance = async (address, poolAddress) => {
    try {
        const erc20 = new ethers.Contract(address, ERC20_ABI, provider)
        const balance = await erc20.balanceOf(poolAddress)
        return balance
    } catch (error) {
        console.log(error, 'for tokenBalance')
    }
} 

const timeOut = (interval) => {
    return new Promise(resolve => setTimeout(resolve, interval));
}

module.exports = {
    queryTVL,
    queryFee,
    queryLiquidityTransactions,
    querySwapTransactions,
    queryPools,
    getWethPriceAndLiquidity,
    _tokenName,
    _tokenSymbol,
    timeOut,
    tokenBalance
}