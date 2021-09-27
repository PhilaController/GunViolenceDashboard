import { timeParse } from "d3-time-format";

async function githubFetch(filename) {

    let url = "https://raw.githubusercontent.com/PhiladelphiaController/gun-violence-dashboard-data/master/gun_violence_dashboard_data/data/processed/"
    try {
        const response = await fetch(url + filename);
        let data = await response.json();
        return data
    } catch (e) {
        console.error(e);
    }
}

function dateFromDay(year, day) {
    /* Returns a date object from a year and day of the year. */
    let date = new Date(year, 0); // initialize a date in `year-01-01`
    return new Date(date.setDate(day)); // add the number of days
}

function formatDate(year, day) {
    /* Returns a string of the form `YYYY-MM-DD` from a year and day of the year. */
    let dt = dateFromDay(year, day);
    return dt.toLocaleString("default", { month: "short", day: "numeric" });
}

function getDayOfYear(dt) {
    /* Get the day of the year from a Date object */
    let start = new Date(dt.getFullYear(), 0, 0);
    let diff =
        dt -
        start +
        (start.getTimezoneOffset() - dt.getTimezoneOffset()) * 60 * 1000;
    let oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}


function formatNumber(d) {
    /* Format a number with comma separator. */
    return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getMsSinceMidnight(d) {
    /* Get the number of milliseconds since midnight */
    var e = new Date(d);
    return d - e.setHours(0, 0, 0, 0);
}

function msToTimeString(ms) {
    /* Convert milliseconds to a string of the form `HH:MM:SS.mmm` */
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
const parseTime = timeParse("%Y/%m/%d %H:%M:%S");

export {
    dateFromDay,
    formatDate,
    getDayOfYear,
    formatNumber,
    getMsSinceMidnight,
    msToTimeString,
    githubFetch,
    parseTime
};
