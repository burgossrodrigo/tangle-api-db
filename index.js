const express = require('express')
const bodyParse = require('body-parser')
const cors = require('cors')

const json = bodyParse.json
const app = express();
const router = express.Router()

require('dotenv').config()


const { poolCachedMiddleware, tokenCachedMiddleware, tvlCachedMiddleware, feeCachedMiddleware, liquidityTxCachedMiddleware, swapTxCachedMiddleware } = require('./cache/cache')
const { poolController, tokenController, tvlController, feeControler, liquidityTxController, swapTxController } = require('./controller/tangle.controller')



app.use(json());
app.use(router);
const PORT = 5000
var server_host = process.env.YOUR_HOST || '0.0.0.0';
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://tvl-api.herokuapp.com',
    'https://tangleswap-info.vercel.app',
    'https://tangle-db-api.onrender.com'
  ],
};

app.listen(PORT, () => {
    console.log(`server is listening on port: ${PORT}`)
})

router.get('/tvl/:limit', cors(corsOptions), tvlCachedMiddleware, tvlController)

router.get('/pools/:limit', cors(corsOptions), poolCachedMiddleware, poolController)

router.get('/fees', cors(corsOptions), feeCachedMiddleware, feeControler)

router.get('/liquidityTransactions/:limit', cors(corsOptions), liquidityTxCachedMiddleware, liquidityTxController)

router.get('/swapTransactions/:limit', cors(corsOptions), swapTxCachedMiddleware, swapTxController)

router.get('/tokens', cors(corsOptions), tokenCachedMiddleware, tokenController)

