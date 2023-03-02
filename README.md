# Tradingview Alerts to Futures bot v.1.0

## Getting started

An updated version of my previous Tradingview processor. This bot places orders from Tradingview signals (webhook) to Binance Futures USDT-M. The bot can easily be deployed to AWS Lightsail. This has only been tested with Binance Futures USDT-M but it might work with other exchanges as well.

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

curl -o lightsail-compose.sh https://raw.githubusercontent.com/artoruotsala/tradingview-alerts-futures-bot/master/lightsail-compose.sh

chmod +x ./lightsail-compose.sh

./lightsail-compose.sh

```

## Example orders from Tradingview

- Use alert -> webhook to your bot http://url/trade :

Long trade with 5% of free capital (market price)

```
{
    "direction": "long",
    "symbol": "BTC/USDT",
    "size": "5%"
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

Short trade with 250$ of capital (market price), and stop loss at 20000$ and one take profit at 25000$

```
{
    "direction": "short",
    "symbol": "BTC/USDT",
    "size": "250",
    "stopLoss": "20000",
    "takeProfit": "25000"
}
```

Short trade with 5% of free capital (limit order = price), and stop loss at 25000$ and 3 take profits

1. First TP at 33% from the final take profit (size 33%)
2. Second TP at 66% from the final take profit (size 33%)
3. Final take profit level at 5%

```
{
    "direction": "short",
    "symbol": "BTC/USDT",
    "size": "5%",
    "price": "22000",
    "stopLoss": "25000",
    "takeProfit": "5%",
    "takeProfitLevels": [
      {
        "price": "33%",
        "size": "33%,
      },
      {
        "price": "66%",
        "size": "33%,
      },
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

Close long or short trade (size 50% with limit order = price) and also close all open orders in that current symbol (stop loss + take profits)

```

{
"direction": "close",
"symbol": "BTC/USDT",
"size": "50%",
"price": "23000"
}

```
