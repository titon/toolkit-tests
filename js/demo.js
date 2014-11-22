
var Demo = {

    instances: [],

    test: [],

    resize: function() {
        var win = $(window);

        $('#res-width').html(win.width());
        $('#res-height').html(win.height());
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
            history.pushState({key: key}, current.text(), '?' + key + (hash || ''));
        }
    },

    random: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

};

$(function() {
    Demo.resize();

    // Modify all AJAX URLs and prefix with the host
    $.ajaxPrefilter(function(options) {
        var base = location.href.replace('index.html', '');

        if (base.indexOf('?')) {
            base = base.split('?')[0];
        }

        options.url = base + options.url.substr(1);
    });

    // Set classes
    $('html').addClass(Toolkit.isTouch ? 'touch' : 'no-touch');

    // Events
    $(window).on('resize', Demo.resize);

    $('#plugin-switcher').change(function() {
        Demo.loadPlugin($(this).val());
    });

    $('#destroy').click(Demo.destroyPlugins);

    $('.plugin-goto').click(function() {
        Demo.loadPlugin($(this).data('plugin'));
    });

    $('#to-top').click(function() {
        window.scrollTo(0, 0);
    });

    // Load plugin based on query string
    if (location.search) {
        Demo.loadPlugin(location.search.substr(1), location.hash);
    } else {
        Demo.loadPlugin('base', location.hash);
    }
});