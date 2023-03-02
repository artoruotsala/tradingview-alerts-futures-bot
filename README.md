# Tradingview Alerts to Futures bot v.1.0 (Binance | Bybit)

## Getting started

An updated version of my previous Tradingview processor. This bot places orders from Tradingview signals (webhook) to Binance or Bybit Futures. The bot can easily be deployed to AWS Lightsail.

_Binance working 100%_

_Bybit working about 50%_
Symbols must be in a form of BTC/USDT:USDT to trade in perpetual futures
Things not working yet:

- setting stop loss
- setting take profits

The bot has a simple Telegram integration. Currently you can turn on / off trades with Telegram messages.

The bot does not store the trades. There is no database.

## AWS Lightsail

- Lightsail script created by using Mike Coleman (mikegcoleman/todo) Lightsail script. Thank you!
- echo script adds .env file on your server for Docker on Lightsail init

1. Launch AWS Lightsail Instance (OS Only, with at least 1GB of memory)
2. Choose Ubuntu 18
3. Add the starting script with your envs
4. Launch!

Starting script:

Note:
EXCHANGE_ID has to be binanceusdm (bybit might work too, not tested)
PAPER=true uses paper trading (Binance Futures Testnet)

```
mkdir /srv

echo 'TELEGRAM_TOKEN_LIVE=
TELEGRAM_CHAT_ID_LIVE=

PAPER=true
PAPER_EXCHANGE_ID=binanceusdm
PAPER_TRADING_API_KEY=
PAPER_TRADING_SECRET=

EXCHANGE_ID=binanceusdm
TRADING_API_KEY=
TRADING_SECRET=
' > /srv/.env

curl -o lightsail-deploy.sh https://raw.githubusercontent.com/artoruotsala/tradingview-alerts-futures-bot/master/lightsail-deploy.sh

chmod +x ./lightsail-deploy.sh

./lightsail-deploy.sh

```

## Example orders from Tradingview

- Use alert -> webhook to your bot http://url/trade :

Long trade with 5% of free capital (market price) and setting leverage to 20. You can leave leverage away from the request, and then the current leverage will be used. Notice that leverage has to be a number - not a string!

```
{
    "direction": "long",
    "symbol": "BTC/USDT",
    "size": "5%",
    "leverage": 20
}
```

Long trade with 5% of free capital (limit order = price), and stop loss (1.5% from close) and one take profit (close at profit level of 2%)

```
{
    "direction": "long",
    "symbol": "BTC/USDT",
    "size": "5%",
    "price": "22000",
    "stopLoss": "1.5%",
    "takeProfit": "2%"
}
```

Long trade with 250$ of capital (market price), and stop loss at 20000$ and one take profit at 25000$

```
{
    "direction": "long",
    "symbol": "BTC/USDT",
    "size": "250",
    "stopLoss": "20000",
    "takeProfit": "25000"
}
```

If your strategy has algorithm for dynamic trade sizes, you can use margin multiplier (trade size in this example 375$)

```
{
    "direction": "long",
    "symbol": "BTC/USDT",
    "size": "250",
    "margin": "1.5",
    "stopLoss": "20000",
    "takeProfit": "25000"
}
```

Short trade with 5% of free capital (market price), and stop loss at 2% and 3 take profits

1. First TP at 33% from the final take profit (size 33%)
2. Second TP at 66% from the final take profit (size 33%)
3. Final take profit level at 5%

```
{
    "direction": "short",
    "symbol": "BTC/USDT",
    "size": "5%",
    "stopLoss": "2%",
    "takeProfit": "5%",
    "takeProfitLevels": [
      {
        "price": "33%",
        "size": "33%"
      },
      {
        "price": "66%",
        "size": "33%"
      }
    ]
}
```

Close long or short trade (full trade with market price) and also close all open orders in that current symbol (stop loss + take profits)

```
{
    "direction": "close",
    "symbol": "BTC/USDT",
    "size": "100%"
}
```

Close 50% of long or short trade (with limit order = price).
{{close}} is a placeholder used in Tradingview alerts for getting the close price from the Tradingview stragegy

```

{
  "direction": "close",
  "symbol": "BTC/USDT",
  "size": "50%",
  "price": "{{close}}"
}

```
