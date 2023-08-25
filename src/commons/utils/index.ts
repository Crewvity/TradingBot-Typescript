import { CandleInterval } from 'src/commons/constants';

export function deepFreeze<T extends Record<string, any>>(object: T): T {
  Object.values(object).forEach((value) => {
    if (value && typeof value === 'object') {
      deepFreeze(value as Record<string, any>);
    }
  });
  return Object.freeze(object);
}

export function getIntervalInMinutes(interval: CandleInterval) {
  switch (interval) {
    case CandleInterval.OneMinute:
      return 1;
    case CandleInterval.FiveMinutes:
      return 5;
    case CandleInterval.FifteenMinutes:
      return 15;
    case CandleInterval.ThirtyMinutes:
      return 30;
    case CandleInterval.OneHour:
      return 60;
    case CandleInterval.TwoHours:
      return 120;
    case CandleInterval.FourHours:
      return 240;
    case CandleInterval.EightHours:
      return 480;
    case CandleInterval.TwelveHours:
      return 720;
    case CandleInterval.OneDay:
      return 1440;
    case CandleInterval.OneWeek:
      return 10080;
    default:
      throw new Error('Invalid interval');
  }
}
