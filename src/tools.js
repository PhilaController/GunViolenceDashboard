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


export function formatNumber(d) {
    return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function getMsSinceMidnight(d) {
    var e = new Date(d);
    return d - e.setHours(0, 0, 0, 0);
}

export function msToTimeString(ms) {
    let x = ms / 1000;
    x /= 60;
    let minutes = Math.floor(x % 60);
    x /= 60;
    let hours = Math.floor(x % 24);
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}