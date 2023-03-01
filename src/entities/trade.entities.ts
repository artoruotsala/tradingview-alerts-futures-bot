import {
  IsIn,
  IsOptional,
  IsString,
  IsNumber,
  Matches,
  ValidateIf,
} from 'class-validator'

export enum Side {
  Long = 'long',
  Short = 'short',
  Close = 'close',
}

export const SIDES = [Side.Close, Side.Long, Side.Short]

export type TakeProfit = {
  price: string
  size: string
}

// {
//   "account": "main",
//   "direction": "long",
//   "symbol": "SOL/USDT",
//   "size": "5%",
//   "stopLoss": "0.04"
// }

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
  @Matches(/%/)
  stopLoss?: string

  @IsString()
  @IsOptional()
  @Matches(/%/)
  takeProfit?: string

  @IsOptional()
  takeProfitLevels?: Array<TakeProfit>
}
