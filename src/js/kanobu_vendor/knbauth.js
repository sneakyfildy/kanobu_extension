function authRequired() {
    if (AUTH_CONFIG.FAKE) {
        window.location = AUTH_CONFIG.AUTH_URL;
    } else {
        knbApi.showAuth({
            c_app_id: AUTH_CONFIG.APP_ID,
            iframe: true
        });
    }
}

(function($) {
    $.fn.authRequired = function() {
        if (typeof USER === 'undefined' || !USER) {
            this.disable().click(function() {
                authRequired();
            });
        }
    };

    $.fn.disable = function() {
        var overlays = $();
        this.each(function(ind, el) {
            var $el = $(el).css('opacity', 0.4);
            var overlay = $('<div>').css({
                position: 'absolute',
                left: $el.offset().left + 'px',
                top: $el.offset().top + 'px',
                height: $el.outerHeight() + 'px',
                width: $el.outerWidth() + 'px',
                zIndex: 100
            });
            overlay.appendTo(document.body);
            overlays = overlays.add(overlay);
        });
        return overlays;
    };
})(jQuery);

jQuery(function($) {
    $('.authRequired').authRequired();

    $(document).on('click', '.auth-trigger', function(e) {
        e.preventDefault();

        if (AUTH_CONFIG.FAKE) {
            window.location = LOGIN_URL;
            return;
        }

        knbApi.showAuth({
            c_app_id: AUTH_CONFIG.APP_ID,
            iframe: true
        });
    });
    $(document).on('click', '.register-trigger', function(e) {
        e.preventDefault();

        if (AUTH_CONFIG.FAKE) {
            console.log('AUTH_FAKE is set, nothing to do');
            return;
        }

        knbApi.showAuth({
            c_app_id: AUTH_CONFIG.APP_ID,
            iframe: true,
            action: 'register'
        });
    });
    $(document).on('click', '.logout-trigger', function(e) {
        e.preventDefault();
        if (AUTH_CONFIG.FAKE) {
            window.location = LOGOUT_URL;
            return;
        }

        knbApi.authLogout();
    });
});
