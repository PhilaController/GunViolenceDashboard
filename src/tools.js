export function dateFromDay(year, day) {
    let date = new Date(year, 0); // initialize a date in `year-01-01`
    return new Date(date.setDate(day)); // add the number of days
}

export function formatDate(year, day) {
    let dt = dateFromDay(year, day);
    return dt.toLocaleString("default", { month: "short", day: "numeric" });
}

export function getDayOfYear(dt) {
    let start = new Date(dt.getFullYear(), 0, 0);
    let diff =
        dt -
        start +
        (start.getTimezoneOffset() - dt.getTimezoneOffset()) * 60 * 1000;
    let oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

