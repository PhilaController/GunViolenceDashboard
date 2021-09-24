import $ from "jquery"

// Method #1: Detect IE 10 and IE 11
function isIE() {
    // IE 10 and IE 11
    return /Trident\/|MSIE/.test(window.navigator.userAgent);
}


// load and set the HTML template we are using
let audit_content = $(".audit-content");
audit_content.append(`<div class="unsupported-browser"></div>`);

let showBrowserAlert = (function () {
    if (document.querySelector('.unsupported-browser')) {
        let d = document.getElementsByClassName('unsupported-browser');

        let is_IE = isIE();

        if (is_IE) {
            d[0].innerHTML = '<b>Unsupported Browser</b>: To view this interactive visualization, please use a recent version of major browsers like Chrome, Firefox, Safari, and Edge.';
            d[0].style.display = 'block';
        }
    }
});

document.addEventListener('DOMContentLoaded', showBrowserAlert);


