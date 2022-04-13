import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

export function getNowStr(format = 'YYYY-MM-DD HH:mm:ss'): string {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  return dayjs().tz('Asia/Tokyo').format(format);
}

export function getStrByTimestamp(timestamp: number, format = 'YYYY-MM-DD HH:mm:ss'): string {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  return dayjs.unix(timestamp).tz('Asia/Tokyo').format(format);
}

export function getDateAfter(days: number): string {
  return dayjs().add(days, 'day').format('YYYY-MM-DD');
}

export function getDateAfterTarget(targetDate: string, days: number): string {
  return dayjs(targetDate).add(days, 'day').format('YYYY-MM-DD');
}

export function diffDays(dateFrom: string, dateTo: string): number {
  return dayjs(dateTo).diff(dateFrom, 'day');
}

export function getDate(targetDate: string, format: string = 'YYYY-MM-DD'): string {
  return dayjs(targetDate).format(format);
}
