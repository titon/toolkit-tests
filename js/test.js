(function(win, doc) {
    "use strict";

    var body = doc.getElementById('body'),
        switcher = doc.getElementById('switcher'),
        destroy = doc.getElementById('destroy'),
        prev = doc.getElementById('prev'),
        next = doc.getElementById('next'),
        top = doc.getElementById('top'),
        rtl = doc.getElementById('rtl'),
        ltr = doc.getElementById('ltr');

    var Test = {
        instances: [],
        test: [],

        loadStyles: function() {
            var styles = [];

            styles.push('css/toolkit' + (Toolkit.isRTL ? '-rtl' : '') + '.css');
            styles.push('css/style.css');

            if (location.search.indexOf('theme=0') === -1) {
                styles.push('css/theme.css');
            }

            styles.forEach(function(path) {
                var link = document.createElement('link');
                    link.href = path;
                    link.rel = 'stylesheet';
                    link.type = 'text/css';

                doc.head.appendChild(link);
            });
        },

        loadDefaultModule: function() {
            if (location.search) {
                var query = location.search.substr(1);

                if (query.indexOf('&') >= 0) {
                    query = query.split('&')[0];
                }

                Test.loadModule(query, location.hash);

            } else {
                Test.loadModule('base', location.hash);
            }
        },

        loadModule: function(key, hash) {
            if (!key) {
                return;
            }

            Test.destroyModules();

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        window.scrollTo(0, 0);
                        body.innerHTML = xhr.responseText;
                        Test.updateNav(key, hash);

                        // Execute script blocks
                        Array.prototype.slice.call(body.querySelectorAll('script')).forEach(function(script) {
                            eval(script.textContent);
                        });
                    } else {
                        body.innerHTML = '<div class="notice is-error">Module does not exist.</div>';
                        Test.updateNav('');
                    }
                }
            };

            xhr.open('GET', '/tests/' + key + '.html?' + Date.now(), true);
            xhr.send(null);
        },

        destroyModules: function() {
            Test.instances.forEach(function(module) {
                if (module && module.destroy) {
                    module.destroy();
                }
            });

            Test.instances = [];
        },

        updateNav: function(key, hash) {
            switcher.value = key;

            var index = switcher.selectedIndex,
                options = switcher.options,
                currentOption = options[index],
                prevOption = options[index - 1] || options[options.length - 1],
                nextOption = options[index + 1] || options[0];

            Test.updateButton(prev, prevOption);
            Test.updateButton(next, nextOption);

            if (history.pushState) {
                var query = '?' + key + '&rtl=' + (Toolkit.isRTL ? 1 : 0) + '&theme=0';

                history.pushState({ key: key }, currentOption.textContent, query + (hash || ''));
            }
        },

        updateButton: function(button, option) {
            button.disabled = false;
            button.classList.remove('is-disabled');
            button.setAttribute('data-plugin', option.value);
            button.querySelector('.test-head-button').innerHTML = option.textContent;
        },

        random: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },

        setupUI: function() {
            var html = doc.documentElement;

            html.classList.add(Toolkit.isTouch ? 'touch' : 'no-touch');
            html.classList.add(Toolkit.isRTL ? 'rtl' : 'ltr');

            doc.getElementById('logo')
                .setAttribute('data-version', Toolkit.version);

            if (Toolkit.isRTL) {
                rtl.style.display = 'none';
                ltr.style.display = '';
            }
        },

        bindEvents: function() {
            switcher.addEventListener('change', Test.onSwitch);
            destroy.addEventListener('click', Test.destroyModules);
            prev.addEventListener('click', Test.onGoTo);
            next.addEventListener('click', Test.onGoTo);
            win.addEventListener('resize', Test.onResize);
            rtl.addEventListener('click', Test.goRTL);
            ltr.addEventListener('click', Test.goLTR);
            top.addEventListener('click', function() {
                window.scrollTo(0, 0);
            });

            Test.onResize();
        },

        goRTL: function() {
            location.href = location.href.replace('rtl=0', 'rtl=1');
        },

        goLTR: function() {
            location.href = location.href.replace('rtl=1', 'rtl=0');
        },

        onResize: function() {
            doc.getElementById('viewport-width').innerHTML = win.innerWidth;
            doc.getElementById('viewport-height').innerHTML = win.innerHeight;
        },

        onSwitch: function(e) {
            Test.loadModule(e.currentTarget.value);
        },

        onGoTo: function(e) {
            Test.loadModule(e.currentTarget.getAttribute('data-plugin'));
        }
    };

    Test.loadStyles();
    Test.setupUI();
    Test.bindEvents();
    Test.loadDefaultModule();

    win.Test = Test;
})(window, document);
