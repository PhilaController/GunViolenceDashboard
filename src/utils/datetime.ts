import { timeFormat } from "d3-time-format";

export function getMsSinceMidnight(d: number): number {
  /* Get the number of milliseconds since midnight */
  const e = new Date(d);
  return d - e.setHours(0, 0, 0, 0);
}

export function msToTimeString(ms: number): string {
  /* Convert milliseconds to a string of the form `HH:MM:SS.mmm` */

  let x = ms / 1000;
  x /= 60;
  const minutes = Math.floor(x % 60);
  x /= 60;
  let hours = Math.floor(x % 24);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;
  return hours + ":" + minutesStr + " " + ampm;
}

export function timestampToTimeString(ts: number, pattern = "%B %d"): string {
  /* Convert a timestamp to a time string */
  const dt = new Date(ts);
  const formatTime = timeFormat(pattern);
  return formatTime(dt);
}

export function dateFromDay(year: number, day: number): Date {
  /* Returns a date object from a year and day of the year. */
  const date = new Date(year, 0); // initialize a date in `year-01-01`
  return new Date(date.setDate(day)); // add the number of days
}

export function formatDate(year: number, day: number): string {
  /* Returns a string of the form `YYYY-MM-DD` from a year and day of the year. */
  const dt = dateFromDay(year, day);
  return dt.toLocaleString("default", { month: "short", day: "numeric" });
}

export function getDayOfYear(dt: Date): number {
  /* Get the day of the year from a Date object */
  const start = new Date(dt.getFullYear(), 0, 0);
  const diff =
    dt.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - dt.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
