import {
  PositionDirection,
  PositionSize,
  TradeDirection,
} from 'src/commons/constants';

export type TradeDto = {
  id: string;
  asset: string;
  direction: TradeDirection;
  size: PositionSize;
  price: number;
  date: string;
  strategyId: string;
  positionId: string;
};

export type PositionDto = {
  id: string;
  assetId: string;
  direction: PositionDirection;
  originalSize: PositionSize;
  remainingSize: PositionSize | null;
  openPrice: number;
  closePrice: number;
  open: string;
  close: string;
  pnl: number;
  strategyId: string;
  trades: TradeDto[];
};
