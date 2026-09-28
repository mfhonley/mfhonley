(function () {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // tabs: sliding pill, crossfading panels, animated height
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[role=tab]"));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    var pill = document.querySelector(".pill");
    var view = document.querySelector(".view");
    var current = 0;

    function movePill() {
        var t = tabs[current];
        pill.style.width = t.offsetWidth + "px";
        pill.style.transform = "translateX(" + t.offsetLeft + "px)";
    }

    function select(n, focus) {
        if (n === current && pill.style.width) return;
        var from = view.offsetHeight;
        current = n;
        tabs.forEach(function (t, i) {
            t.setAttribute("aria-selected", i === n);
            t.tabIndex = i === n ? 0 : -1;
        });
        panels.forEach(function (p, i) { p.classList.toggle("on", i === n); });
        movePill();
        if (focus) tabs[n].focus();
        if (history.replaceState) history.replaceState(null, "", n ? "#" + panels[n].id : location.pathname);

        if (reduced) return;
        var to = panels[n].offsetHeight;
        view.style.height = from + "px";
        view.offsetHeight;
        view.style.height = to + "px";
    }

    view.addEventListener("transitionend", function (e) {
        if (e.target === view) view.style.height = "";
    });

    tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { select(i); });
        t.addEventListener("keydown", function (e) {
            var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (d) { e.preventDefault(); select((current + d + tabs.length) % tabs.length, true); }
        });
    });

    var start = panels.findIndex(function (p) { return "#" + p.id === location.hash; });
    pill.style.transition = "none";
    select(start > 0 ? start : 0);
    pill.offsetWidth;
    pill.style.transition = "";
    window.addEventListener("resize", movePill);
    if (document.fonts) document.fonts.ready.then(movePill);

    // clock
    var clock = document.getElementById("clock");
    var fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" });
    function tick() { clock.textContent = fmt.format(new Date()); }
    tick();
    setInterval(tick, 10000);

    // hover the name to reveal the handle
    var name = document.querySelector(".name");
    var full = name.textContent;
    var letters = "abcdefghijklmnopqrstuvwxyz";

    function scramble(target) {
        clearTimeout(name._timer);
        if (reduced) { name.textContent = target; return; }
        var frame = 0;
        (function step() {
            var out = "";
            for (var i = 0; i < target.length; i++) {
                var c = target[i];
                out += c === " " || frame >= i * 2 + 5 ? c : letters[(Math.random() * 26) | 0];
            }
            name.textContent = out;
            if (frame++ < target.length * 2 + 5) name._timer = setTimeout(step, 35);
        })();
    }

    name.addEventListener("mouseenter", function () { scramble(name.dataset.alt); });
    name.addEventListener("mouseleave", function () { scramble(full); });
})();
