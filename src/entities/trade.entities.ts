import {
  IsIn,
  IsOptional,
  IsString,
  IsNumber,
  Matches,
  ValidateIf,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Validate,
} from 'class-validator'

export enum Side {
  Long = 'long',
  Short = 'short',
  Close = 'close',
  Buy = 'buy',
  Sell = 'sell',
  Exit = 'exit',
}

export const SIDES = [
  Side.Close,
  Side.Long,
  Side.Short,
  Side.Buy,
  Side.Sell,
  Side.Exit,
]

export type TakeProfit = {
  price: string
  size: string
}
export class Trade {
  @IsString()
  @IsOptional()
  price?: string

  @IsString()
  @Matches(/\//)
  symbol: string

  @IsString()
  @IsIn(SIDES)
  direction: Side

  @IsString()
  @ValidateIf((o) => o.direction !== Side.Close)
  size: string

  @IsNumber()
  @IsOptional()
  leverage?: number

  @IsString()
  @IsOptional()
  margin?: string

  @IsOptional()
  @IsString()
  stopLoss?: string

  @IsString()
  @IsOptional()
  takeProfit?: string

  @IsString()
  @IsOptional()
  manual?: string

  @IsOptional()
  @ArrayMinSize(0)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Validate(Trade.validateTakeProfitLevels, {
    message: 'Price and size must include % in every take profit level',
  })
  takeProfitLevels?: Array<TakeProfit>

  static validateTakeProfitLevels(takeProfitLevels: Array<TakeProfit>) {
    for (const tp of takeProfitLevels) {
      if (!tp.price.includes('%') || !tp.size.includes('%')) {
        return false
      }
    }
    return true
  }
}
