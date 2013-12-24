/**
 * Simple active window controller. Written by kanobu.ru to manage multiple tabs
 * (have 1 active connection).
 * Has no lisence. Ported here for compatibility.
 */

function WindowController() {
    // always master! one background for all
    
    /*var e = Date.now(),
        t = 0;
    try {
        t = +localStorage.getItem("ping") || 0
    } catch (n) {}
    if (e - t > 45e3) {*/
        this.becomeMaster();
    /*} else {
        this.loseMaster()
    }*/
    $(window).on("storage", $.proxy(this.onStorageEvent, this)).on("unload", $.proxy(this.destroy, this))
}

WindowController.prototype = {
    isMaster: true,
    onStorageEvent: function (e) {
        var t = e.originalEvent.key,
            n = 0,
            r;
        if (t === "ping") {
            try {
                n = +localStorage.getItem("ping") || 0
            } catch (i) {}
            if (n) {
                this.loseMaster()
            } else {
                clearTimeout(this._ping);
                this._ping = setTimeout($.proxy(this.becomeMaster, this), ~~ (Math.random() * 1e3))
            }
        } else if (t === "broadcast") {
            try {
                r = JSON.parse(localStorage.getItem("broadcast"));
                this[r.type](r.data)
            } catch (i) {}
        }
    },
    destroy: function () {
        if (this.isMaster) {
            try {
                localStorage.setItem("ping", 0)
            } catch (e) {}
        }
        $(window).off("storage unload", this.handleEvent)
    },
    becomeMaster: function () {
        try {
            localStorage.setItem("ping", Date.now())
        } catch (e) {}
        clearTimeout(this._ping);
        this._ping = setTimeout($.proxy(this.becomeMaster, this), 2e4 + ~~(Math.random() * 1e4));
        var t = this.isMaster;
        this.isMaster = true;
        if (!t) {
            this.masterDidChange()
        }
    },
    loseMaster: function () {
        clearTimeout(this._ping);
        this._ping = setTimeout($.proxy(this.becomeMaster, this), 35e3 + ~~(Math.random() * 2e4));
        var e = this.isMaster;
        this.isMaster = false;
        if (e) {
            this.masterDidChange()
        }
    },
    broadcast: function (e, t) {
        try {
            localStorage.setItem("broadcast", JSON.stringify({
                id: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (e) {
                    var t = Math.random() * 16 | 0,
                        n = e == "x" ? t : t & 3 | 8;
                    return n.toString(16)
                }),
                type: e,
                data: t
            }))
        } catch (n) {}
    },
    masterDidChange: function () {
        $(window).trigger("masterChange.wc")
    }
};
window.wc = new WindowController