"use strict";

var Demo = {

    instances: [],

    test: [],

    resize: function() {
        var win = $(window);

        $('#res-width').html(win.width());
        $('#res-height').html(win.height());
    },

    loadStyles: function() {
        var styles = [];

        if (Toolkit.rtl) {
            styles.push('css/toolkit-rtl.css');
        } else {
            styles.push('css/toolkit.css');
        }

        styles.push('css/ui.css');
        styles.push('css/style.css');

        styles.forEach(function(path) {
            $('head').append('<link href="' + path + '" rel="stylesheet" type="text/css">');
        });
    },

    loadPlugin: function(key, hash) {
        if (!key) {
            return;
        }

        var skeleton = $('#skeleton');

        Demo.destroyPlugins();

        $.get('/tests/' + key + '.html?' + Date.now(), function(response) {
            window.scrollTo(0, 0);
            skeleton.html(response);
            Demo.updateNav(key, hash);

        }).fail(function() {
            skeleton.html('Plugin does not exist.');
            Demo.updateNav('');
        });
    },

    destroyPlugins: function() {
        $.each(Demo.instances, function(i, plugin) {
            if (plugin && plugin.destroy) {
                plugin.destroy();
            }
        });

        Demo.instances = [];
    },

    updateNav: function(key, hash) {
        var switcher = $('#plugin-switcher');

        switcher.val(key);

        var current = switcher.find('option[value="' + key + '"]'),
            prev = current.prev(),
            next = current.next();

        if (!prev.length) {
            prev = switcher.find('optgroup option:last');
        }

        if (!next.length) {
            next = switcher.find('optgroup option:first');
        }

        $('#prev')
            .removeClass('is-disabled')
            .prop('disabled', false)
            .data('plugin', prev.attr('value'))
            .find('.title')
                .html(prev.text());

        $('#next')
            .removeClass('is-disabled')
            .prop('disabled', false)
            .data('plugin', next.attr('value'))
            .find('.title')
                .html(next.text());

        if (history.pushState) {
            var query = '?' + key + '&rtl=' + (Toolkit.rtl ? 1 : 0);

            history.pushState({key: key}, current.text(), query + (hash || ''));
        }
    },

    random: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    // Modify all AJAX URLs and prefix with the host
    setupAjax: function() {
        $.ajaxPrefilter(function(options) {
            var base = location.href.replace('index.html', '');

            if (base.indexOf('?')) {
                base = base.split('?')[0];
            }

            options.url = base + options.url.substr(1);
        });
    },

    setupUi: function() {
        $('html')
            .addClass(Toolkit.isTouch ? 'touch' : 'no-touch')
            .addClass(Toolkit.rtl ? 'rtl' : 'ltr')
            .attr('dir', Toolkit.rtl ? 'rtl' : 'ltr');

        $('#logo').attr('data-version', Toolkit.version);

        if (Toolkit.rtl) {
            $('#rtl').hide();
            $('#ltr').show();
        }
    },

    bindEvents: function() {
        $(window).on('resize', Demo.resize);

        $('#plugin-switcher').change(function() {
            Demo.loadPlugin($(this).val());
        });

        $('#destroy').click(Demo.destroyPlugins);
        $('#rtl').click(Demo.goRTL);
        $('#ltr').click(Demo.goLTR);

        $('.plugin-goto').click(function() {
            Demo.loadPlugin($(this).data('plugin'));
        });

        $('#to-top').click(function() {
            window.scrollTo(0, 0);
        });
    },

    goRTL: function() {
        location.href = location.href.replace('rtl=0', 'rtl=1');
    },

    goLTR: function() {
        location.href = location.href.replace('rtl=1', 'rtl=0');
    }

};

Demo.loadStyles();
Demo.resize();
Demo.setupAjax();
Demo.setupUi();
Demo.bindEvents();

// Load plugin based on query string
if (location.search) {
    var query = location.search.substr(1);

    if (query.indexOf('&') >= 0) {
        query = query.split('&')[0];
    }

    Demo.loadPlugin(query, location.hash);
} else {
    Demo.loadPlugin('base', location.hash);
}
