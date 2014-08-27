/*! Titon Toolkit v1.5.2 | BSD-3 License | titon.io */
(function($) {
    'use strict';
    // Include an empty jQuery file so that we can setup local dependencies
    // It also allows the files to be included externally in other projects;

// Does the device support touch controls
    var isTouch = !!(('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch));

// Does the device support retina display
    var isRetina = (window.devicePixelRatio > 1);

// Check if transitions exist
    var hasTransition = (function() {
        var prefixes = 'transition WebkitTransition MozTransition OTransition msTransition'.split(' '),
            style = document.createElement('div').style;

        for (var i = 0; i < prefixes.length; i++) {
            if (prefixes[i] in style) {
                return prefixes[i];
            }
        }

        return false;
    })();

// Store the event name in a variable
    var transitionEnd = (function() {
        var eventMap = {
            WebkitTransition: 'webkitTransitionEnd',
            OTransition: 'oTransitionEnd otransitionend'
        };

        return eventMap[hasTransition] || 'transitionend';
    })();

    /**
     * Set data if the key does not exist, else return the current value.
     * If the value is a function, it will be executed to extract a value.
     *
     * @param {String} key
     * @param {*} value
     * @returns {*}
     */
    $.fn.cache = function(key, value) {
        var data = this.data(key);

        if (data) {
            return data;

        } else if (typeof value === 'function') {
            value = value.call(this);
        }

        this.data(key, value);

        return value;
    };

    var Toolkit = {

        /** Current version. */
        version: '1.5.2',

        /** Build date hash. */
        build: 'hzd1q3mv',

        /** ARIA support. */
        aria: true,

        /** Global debugging. */
        debug: false,

        /** Localization messages. */
        messages: {
            loading: 'Loading...',
            error: 'An error has occurred!'
        },

        /** Does the browser support transitions? */
        hasTransition: hasTransition,

        /** Detect touch devices. */
        isTouch: isTouch,

        /** Detect retina displays. */
        isRetina: isRetina,

        /** Name of the `transitionend` event. */
        transitionEnd: transitionEnd,

        /** Plugin instances indexed by the selector that activated it. */
        cache: {},

        /**
         * Creates a jQuery plugin by extending the jQuery prototype with a method definition.
         * The Toolkit plugin is only initialized if one has not been already.
         * Plugins are either defined per element, or on a collection of elements.
         *
         * @param {String} plugin
         * @param {Function} callback
         * @param {bool} collection
         */
        create: function(plugin, callback, collection) {
            var name = plugin;

            // Prefix with toolkit to avoid collisions
            if ($.fn[name]) {
                name = 'toolkit' + name.charAt(0).toUpperCase() + name.slice(1);
            }

            $.fn[name] = collection ?

                // Apply the instance to a collection of elements
                function() {
                    var instance = Toolkit.cache[plugin + ':' + this.selector] = callback.apply(this, arguments);

                    return this.each(function() {
                        $(this).cache('toolkit.' + plugin, instance);
                    });
                } :

                // Apply the instance per element
                function() {
                    var args = arguments;

                    return this.each(function() {
                        $(this).cache('toolkit.' + plugin, callback.apply(this, args));
                    });
                };
        }
    };

// Make it available
    window.Toolkit = Toolkit;

// Empty class to extend from
    Toolkit.Class = function() {};

// Flag to determine if a constructor is initializing
    var constructing = false;

    /**
     * Very basic method for allowing functions to inherit functionality through the prototype.
     *
     * @param {Object} properties
     * @param {Object} options
     * @returns {Function}
     */
    Toolkit.Class.extend = function(properties, options) {
        constructing = true;
        var prototype = new this();
        constructing = false;

        // Inherit the prototype and merge properties
        $.extend(prototype, properties);

        // Class interface
        function Class() {

            // Exit constructing if being applied as prototype
            if (constructing) {
                return;
            }

            // Reset (clone) the array and object properties else they will be referenced between instances
            for (var key in this) {
                var value = this[key],
                    type = $.type(value);

                if (type === 'array') {
                    this[key] = value.slice(0); // Clone array

                } else if (type === 'object') {
                    this[key] = $.extend(true, {}, value); // Clone object

                    //} else if (type === 'function') {
                    //    this[key] = value.bind(this);
                }
            }

            // Set the UID and increase global count
            this.uid = Class.count += 1;

            // Generate the CSS class name and attribute/event name based off the plugin name
            var name = this.name;

            if (name) {
                this.cssClass = name.replace(/[A-Z]/g, function(match) {
                    return ('-' + match.charAt(0).toLowerCase());
                }).slice(1);

                // Generate an attribute and event key name based off the plugin name
                this.keyName = name.charAt(0).toLowerCase() + name.slice(1);
            }

            // Trigger constructor
            if (properties.constructor) {
                properties.constructor.apply(this, arguments);
            }
        }

        // Inherit the prototype
        Class.prototype = prototype;
        Class.prototype.constructor = Class;

        // Inherit and set default options
        Class.options = $.extend(true, {}, this.options || {}, options || {});

        // Inherit the extend method
        Class.extend = this.extend;

        // Count of total instances
        Class.count = 0;

        return Class;
    };

    Toolkit.Base = Toolkit.Class.extend({

        /** Name of the plugin. Must match the object declaration. */
        name: 'Base',

        /** Current version of the plugin. */
        version: '1.5.0',

        /** Cached data and AJAX requests. */
        cache: {},

        /** Is the plugin enabled? */
        enabled: false,

        /** Events and functions to bind. */
        events: {},

        /** Static options defined during construction. */
        options: {},

        /** Dynamic options generated at runtime. */
        runtime: {},

        /** List of hooks grouped by type. */
        __hooks: {},

        /**
         * Add a hook to a specific event type.
         *
         * @param {String} type
         * @param {Function} callback
         */
        addHook: function(type, callback) {
            var list = this.__hooks[type] || [];
            list.push(callback);

            this.__hooks[type] = list;
        },

        /**
         * Loop through the events object and attach events to the specified selector in the correct context.
         * Take into account window, document, and delegation.
         *
         * @param {String} type
         */
        bindEvents: function(type) {
            var self = this,
                options = this.options,
                event,
                keys,
                context,
                selector,
                funcs,
                win = $(window),
                doc = $(document);

            // event window = func          Bind window event
            // event document = func        Bind document event
            // ready document = func        Bind DOM ready event
            // event property = func        Bind event to collection that matches class property
            // event context .class = func  Bind delegated events to class within context
            $.each(this.events, function(key, value) {
                funcs = $.isArray(value) ? value : [value];

                // Replace tokens
                key = key.replace('{mode}', options.mode);
                key = key.replace('{selector}', self.nodes ? self.nodes.selector : '');

                // Extract arguments
                keys = key.split(' ');
                event = keys.shift();
                context = keys.shift();
                selector = keys.join(' ');

                // Determine the correct context
                if (self[context]) {
                    context = self[context];
                } else if (context === 'window') {
                    context = win;
                } else if (context === 'document') {
                    context = doc;
                }

                $.each(funcs, function(i, func) {
                    if (!$.isFunction(func)) {
                        func = self[func].bind(self);
                    }

                    // Ready events
                    if (event === 'ready') {
                        doc.ready(func);

                        // Delegated events
                    } else if (selector) {
                        $(context)[type](event, selector, func);

                        // Regular events
                    } else {
                        $(context)[type](event, func);
                    }
                });
            });
        },

        /**
         * Destroy the plugin by disabling events, removing elements, and deleting the instance.
         */
        destroy: function() {
            this.fireEvent('destroying');

            // Hide and remove active state
            if (this.hide) {
                this.hide();
            }

            // Trigger destructor
            if (this.destructor) {
                this.destructor();
            }

            // Remove events
            this.disable();

            this.fireEvent('destroyed');
        },

        /**
         * Disable the plugin.
         */
        disable: function() {
            if (this.enabled) {
                this.bindEvents('off');
            }

            this.enabled = false;
        },

        /**
         * Enable the plugin.
         */
        enable: function() {
            if (!this.enabled) {
                this.bindEvents('on');
            }

            this.enabled = true;
        },

        /**
         * Trigger all hooks defined by type.
         *
         * @param {String} type
         * @param {Array} [args]
         */
        fireEvent: function(type, args) {
            var debug = this.options.debug || Toolkit.debug;

            if (debug) {
                console.log(this.name + '#' + this.uid, new Date().getMilliseconds(), type, args || []);

                if (debug === 'verbose') {
                    console.dir(this);
                }
            }

            var hooks = this.__hooks[type];

            if (hooks) {
                $.each(hooks, function(i, hook) {
                    hook.apply(this, args || []);
                }.bind(this));
            }
        },

        /**
         * Enable events and trigger `init` hooks.
         */
        initialize: function() {
            this.enable();
            this.fireEvent('init');
        },

        /**
         * Remove a hook within a type. If the callback is not provided, remove all hooks in that type.
         *
         * @param {String} type
         * @param {Function} [callback]
         */
        removeHook: function(type, callback) {
            if (!callback) {
                delete this.__hooks[type];
                return;
            }

            var hooks = this.__hooks[type];

            if (hooks) {
                $.each(hooks, function(i, hook) {
                    if (hook === callback) {
                        hooks = hooks.splice(i, 1);
                    }
                });
            }
        },

        /**
         * Set the options by merging with defaults. If the `responsive` option exists,
         * attempt to alter the options based on media query breakpoints. Furthermore,
         * if an option begins with `on`, add it as a hook.
         *
         * @param {Object} [options]
         * @returns {Object}
         */
        setOptions: function(options) {
            var opts = $.extend(true, {}, Toolkit[this.name].options, options || {}),
                key;

            // Inherit options based on responsive media queries
            if (opts.responsive && window.matchMedia) {
                $.each(opts.responsive, function(key, resOpts) {
                    if (matchMedia(resOpts.breakpoint).matches) {
                        $.extend(opts, resOpts);
                        return false;
                    }
                });
            }

            // Set hooks that start with `on`
            for (key in opts) {
                if (key.match(/^on[A-Z]/)) {
                    this.addHook(key.substr(2).toLowerCase(), opts[key]);

                    delete opts[key];
                }
            }

            return opts;
        }

    }, {
        cache: true,
        debug: false
    });

    /**
     * A multi-purpose getter and setter for ARIA attributes.
     * Will prefix attribute names and cast values correctly.
     *
     * @param {Element} element
     * @param {String|Object} key
     * @param {*} value
     */
    function doAria(element, key, value) {
        if (value === true) {
            value = 'true';
        } else if (value === false) {
            value = 'false';
        }

        element.setAttribute('aria-' + key, value);
    }

    $.fn.aria = function(key, value) {
        if (!Toolkit.aria) {
            return this;
        }

        if (key === 'toggled') {
            key = { expanded: value, selected: value };
            value = null;
        }

        return $.access(this, doAria, key, value, arguments.length > 1);
    };

    /**
     * Conceal the element by applying the hide class.
     * Should be used to trigger transitions and animations.
     *
     * @returns {jQuery}
     */
    $.fn.conceal = function() {
        return this
            .removeClass('show')
            .addClass('hide')
            .aria('hidden', true);
    };

    /**
     * Reveal the element by applying the show class.
     * Should be used to trigger transitions and animations.
     *
     * @returns {jQuery}
     */
    $.fn.reveal = function() {
        return this
            .removeClass('hide')
            .addClass('show')
            .aria('hidden', false);
    };

    /**
     * Fetch the plugin instance from the jQuery collection.
     * If a method and arguments are defined, trigger a method on the instance.
     *
     * @param {String} plugin
     * @param {String} [method]
     * @param {Array} [args]
     * @returns {Function}
     */
    $.fn.toolkit = function(plugin, method, args) {
        var selector = this.selector,
            instance = this.data('toolkit.' + plugin) || Toolkit.cache[plugin + ':' + selector] || null;

        if (!instance) {
            return null;
        }

        // Trigger a method on the instance of method is defined
        if (method && instance[method]) {
            instance[method].apply(instance, $.makeArray(args));
        }

        return instance;
    };

    Toolkit.Component = Toolkit.Base.extend({
        name: 'Component',
        version: '1.4.1',

        /** Whether the element was created automatically or not. */
        created: false,

        /** The target element. Either created through a template, or embedded in the DOM. */
        element: null,

        /** Collection of elements related to the component. */
        elements: [],

        /** The element that activated the component. */
        node: null,

        /** Collection of nodes. */
        nodes: [],

        /**
         * A basic constructor that sets an element and its options.
         *
         * @param {Element} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            this.element = element = $(element);
            this.options = this.setOptions(options, element);
        },

        /**
         * Create an element from the `template` or `templateFrom` option.
         *
         * @returns {jQuery}
         */
        createElement: function() {
            var template, options = this.options;

            // Use another element as the template
            if (options.templateFrom) {
                template = $(options.templateFrom);
            }

            // From a string
            if ((!template || !template.length) && options.template) {
                template = $(options.template);

                if (template.length) {
                    template.conceal().appendTo('body');
                }
            }

            if (!template) {
                throw new Error('Failed to create template element');
            }

            // Add a class name
            if (options.className) {
                template.addClass(options.className);
            }

            // Enable animations
            if (options.animation) {
                template.addClass(options.animation);
            }

            // Set a flag so we know if the element was created or embedded
            this.created = true;

            return template.attr('id', this.id());
        },

        /**
         * {@inheritdoc}
         */
        destroy: function() {
            Toolkit.Base.prototype.destroy.call(this);

            // Remove element only if it was created
            if (this.created) {
                this.element.remove();
            }

            // Remove instances or else the previous commands will fail
            var key = this.keyName;

            if (this.nodes) {
                this.nodes.removeData('toolkit.' + key);

                // Remove the cached instance also
                delete Toolkit.cache[key + '.' + this.nodes.selector];

            } else if (this.element) {
                this.element.removeData('toolkit.' + key);
            }
        },

        /**
         * Trigger all hooks and any DOM events attached to the `element` or `node`.
         *
         * @param {String} type
         * @param {Array} [args]
         */
        fireEvent: function(type, args) {
            Toolkit.Base.prototype.fireEvent.call(this, type, args);

            var element = this.element,
                node = this.node,
                event = $.Event(type + '.toolkit.' + this.keyName);
            event.context = this;

            // Trigger event on the element and the node
            if (element && element.length) {
                element.trigger(event, args || []);
            }

            if (node && node.length) {
                node.trigger(event, args || []);
            }
        },

        /**
         * Hide the primary element.
         */
        hide: function() {
            this.fireEvent('hiding');

            this.element.conceal();

            this.fireEvent('hidden');
        },

        /**
         * Generate a unique CSS class name for the component and its arguments.
         *
         * @returns {String}
         */
        id: function() {
            var list = $.makeArray(arguments);
            list.unshift('toolkit', this.cssClass, this.uid);

            return list.join('-');
        },

        /**
         * Inherit options from the target elements data attributes.
         *
         * @param {Object} options
         * @param {jQuery} element
         * @returns {Object}
         */
        inheritOptions: function(options, element) {
            var key, value, obj = {};

            for (key in options) {
                if (key === 'context' || key === 'template') {
                    continue;
                }

                value = element.data((this.keyName + '-' + key).toLowerCase());

                if ($.type(value) !== 'undefined') {
                    obj[key] = value;
                }
            }

            return $.extend(true, {}, options, obj);
        },

        /**
         * Handle and process HTML responses.
         *
         * @param {*} content
         */
        position: function(content) {
            this.fireEvent('load', [content]);
        },

        /**
         * Handle and process non-HTML responses.
         *
         * @param {*} content
         */
        process: function(content) {
            this.hide();

            if (content.callback) {
                var namespaces = content.callback.split('.'),
                    func = window, prev = func;

                for (var i = 0; i < namespaces.length; i++) {
                    prev = func;
                    func = func[namespaces[i]];
                }

                func.call(prev, content);
            }

            this.fireEvent('process', [content]);
        },

        /**
         * Read a class option from a data attribute.
         * If no attribute exists, return the option value.
         *
         * @param {jQuery} element
         * @param {String} key
         * @returns {*}
         */
        readOption: function(element, key) {
            var value = element.data((this.keyName + '-' + key).toLowerCase());

            if ($.type(value) === 'undefined') {
                value = this.options[key];
            }

            return value;
        },

        /**
         * Attempt to read a value from an element using the query.
         * Query can either be an attribute name, or a callback function.
         *
         * @param {jQuery} element
         * @param {String|Function} query
         * @returns {String}
         */
        readValue: function(element, query) {
            if (!query) {
                return null;
            }

            element = $(element);

            if ($.type(query) === 'function') {
                return query.call(this, element);
            }

            return element.attr(query);
        },

        /**
         * Request data from a URL and handle all the possible scenarios.
         *
         * @param {Object} options
         * @param {Function} before
         * @param {Function} done
         * @param {Function} fail
         * @returns {jqXHR}
         */
        requestData: function(options, before, done, fail) {
            var url = options.url || options;

            // Set default options
            var ajax = $.extend({}, {
                url: url,
                type: 'GET',
                context: this,
                beforeSend: before || function() {
                    this.cache[url] = true;
                    this.element
                        .addClass('is-loading')
                        .aria('busy', true);
                }
            }, options);

            // Inherit base options
            if ($.type(this.options.ajax) === 'object') {
                ajax = $.extend({}, this.options.ajax, ajax);
            }

            var cache = (ajax.type.toUpperCase() === 'GET' && this.options.cache);

            return $.ajax(ajax)
                .done(done || function(response, status, xhr) {
                    this.element
                        .removeClass('is-loading')
                        .aria('busy', false);

                    // HTML
                    if (xhr.getResponseHeader('Content-Type').indexOf('text/html') >= 0) {
                        if (cache) {
                            this.cache[url] = response;
                        } else {
                            delete this.cache[url];
                        }

                        this.position(response);

                        // JSON, others
                    } else {
                        delete this.cache[url];

                        this.process(response);
                    }
                })
                .fail(fail || function() {
                    delete this.cache[url];

                    this.element
                        .removeClass('is-loading')
                        .addClass('has-failed')
                        .aria('busy', false);

                    this.position(Toolkit.messages.error);
                });
        },

        /**
         * After merging options with the default options,
         * inherit options from an elements data attributes.
         *
         * @param {Object} [options]
         * @param {jQuery} [inheritFrom]
         * @returns {Object}
         */
        setOptions: function(options, inheritFrom) {
            var opts = Toolkit.Base.prototype.setOptions.call(this, options);

            // Inherit from element data attributes
            if (inheritFrom) {
                opts = this.inheritOptions(opts, inheritFrom);
            }

            // Convert hover to mouseenter
            if (opts.mode && opts.mode === 'hover') {
                opts.mode = Toolkit.isTouch ? 'click' : 'mouseenter';
            }

            return opts;
        },

        /**
         * Show the element and optionally set the activating node.
         *
         * @param {jQuery} [node]
         */
        show: function(node) {
            if (node) {
                this.node = $(node);
            }

            this.fireEvent('showing');

            this.element.reveal();

            this.fireEvent('shown');
        },

        /**
         * Event handler for `show` clicks or hovers.
         *
         * @param {jQuery.Event} e
         * @private
         */
        onShow: function(e) {
            e.preventDefault();

            this.show(e.currentTarget);
        },

        /**
         * Event handler for toggling an element through click or hover events.
         *
         * @param {jQuery.Event} e
         * @private
         */
        onShowToggle: function(e) {
            var node = $(e.currentTarget),
                isNode = (this.node && node[0] === this.node[0]);

            if (this.element && this.element.is(':shown')) {

                // Touch devices should pass through on second click
                if (Toolkit.isTouch) {
                    if (!isNode || this.node.prop('tagName').toLowerCase() !== 'a') {
                        e.preventDefault();
                    }

                    // Non-touch devices
                } else {
                    e.preventDefault();
                }

                // Second click should close it
                if (this.options.mode === 'click') {
                    this.hide();
                }

                // Exit if the same node so it doesn't re-open
                if (isNode) {
                    return;
                }

            } else {
                e.preventDefault();
            }

            this.show(node);
        }

    }, {
        context: null,
        className: '',
        template: '',
        templateFrom: ''
    });

    /**
     * Bound a number between a min and max range.
     *
     * @param {Number} value
     * @param {Number} max
     * @param {Number} min
     * @returns {Number}
     */
    $.bound = function(value, max, min) {
        min = min || 0;

        if (value >= max) {
            value = 0;
        } else if (value < min) {
            value = max - 1;
        }

        return value;
    };

    /**
     * Used for CSS animations and transitions.
     *
     * @returns {bool}
     */
    $.expr[':'].shown = function(obj) {
        return ($(obj).css('visibility') !== 'hidden');
    };

    Toolkit.Accordion = Toolkit.Component.extend({
        name: 'Accordion',
        version: '1.4.0',

        /** Collection of header elements. */
        headers: [],

        /* Last opened section index. */
        index: 0,

        /** Collection of section elements. */
        sections: [],

        /**
         * Initialize the accordion.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            var self = this;

            this.element = element = $(element).attr('role', 'tablist');
            this.options = options = this.setOptions(options, element);

            // Find headers and cache the index of each header and set ARIA attributes
            this.headers = element.find('[data-accordion-header]').each(function(index) {
                $(this)
                    .data('accordion-index', index)
                    .attr({
                        role: 'tab',
                        id: self.id('header', index)
                    })
                    .aria({
                        controls: self.id('section', index),
                        selected: false,
                        expanded: false
                    });
            });

            // Find sections and cache the height so we can use for sliding and set ARIA attributes
            this.sections = element.find('[data-accordion-section]').each(function(index) {
                $(this)
                    .data('height', $(this).height())
                    .attr({
                        role: 'tabpanel',
                        id: self.id('section', index)
                    })
                    .aria('labelledby', self.id('header', index))
                    .conceal();
            });

            // Set events
            this.events = {
                '{mode} element [data-accordion-header]': 'onShow'
            };

            // Initialize
            this.initialize();

            // Jump to the index on page load
            this.jump(options.defaultIndex);
        },

        /**
         * Reveal all sections before destroying.
         */
        destructor: function() {
            this.headers.parent().removeClass('is-active');
            this.sections.removeAttr('style').reveal();
        },

        /**
         * Go to the section indicated by the index number.
         * If the index is too large, jump to the beginning.
         * If the index is too small, jump to the end.
         *
         * @param {Number} index
         */
        jump: function(index) {
            index = $.bound(index, this.headers.length);

            this.show(this.headers[index]);
        },

        /**
         * Toggle the section display of a row via the header click/hover event.
         * Take into account the multiple and collapsible options.
         *
         * @param {jQuery} header
         */
        show: function(header) {
            header = $(header);

            var options = this.options,
                parent = header.parent(), // li
                section = header.next(), // section
                index = header.data('accordion-index'),
                height = parseInt(section.data('height'), 10),
                isNode = (this.node && this.node.is(header));

            this.fireEvent('showing', [section, header, this.index]);

            // Allow simultaneous open and closed sections
            // Or allow the same section to collapse
            if (options.mode === 'click' && (options.multiple || options.collapsible && isNode)) {
                if (section.is(':shown') && this.node) {
                    section.css('max-height', 0).conceal();
                    parent.removeClass('is-active');
                    header.aria('toggled', false);

                } else {
                    section.css('max-height', height).reveal();
                    parent.addClass('is-active');
                    header.aria('toggled', true);
                }

                // Only one open at a time
            } else {

                // Exit early so we don't mess with animations
                if (isNode) {
                    return;
                }

                this.sections.css('max-height', 0).conceal();
                section.css('max-height', height).reveal();

                this.headers.aria('toggled', false);
                header.aria('toggled', true);

                this.element.children('li').removeClass('is-active');
                parent.addClass('is-active');
            }

            this.index = index;
            this.node = header;

            this.fireEvent('shown', [section, header, index]);
        }

    }, {
        mode: 'click',
        defaultIndex: 0,
        multiple: false,
        collapsible: false
    });

    Toolkit.create('accordion', function(options) {
        return new Toolkit.Accordion(this, options);
    });

    Toolkit.Blackout = Toolkit.Component.extend({
        name: 'Blackout',
        version: '1.4.0',

        /** How many times the blackout has been opened while being opened. */
        count: 0,

        /** The loader animation element. */
        loader: null,

        /** The message element. */
        message: null,

        /**
         * Create the blackout and loader elements.
         *
         * @param {Object} [options]
         */
        constructor: function(options) {
            this.options = options = this.setOptions(options);
            this.element = this.createElement();

            // Generate loader elements
            this.loader = $(options.loaderTemplate);
            this.message = this.loader.find('[data-loader-message]');

            if (options.showLoading) {
                this.message.html(Toolkit.messages.loading);
            }

            // Initialize
            this.initialize();
        },

        /**
         * Hide the blackout if count reaches 0.
         */
        hide: function() {
            this.fireEvent('hiding');

            var count = this.count - 1;

            if (count <= 0) {
                this.count = 0;
                this.element.conceal();
                this.hideLoader();
            } else {
                this.count = count;
            }

            this.fireEvent('hidden', [(count <= 0)]);
        },

        /**
         * Hide the loader.
         */
        hideLoader: function() {
            this.loader.conceal();
        },

        /**
         * Show the blackout and increase open count.
         */
        show: function() {
            this.fireEvent('showing');

            var show = false;

            this.count++;

            if (this.count === 1) {
                this.element.reveal();
                show = true;
            }

            this.showLoader();

            this.fireEvent('shown', [show]);
        },

        /**
         * Show the loader.
         */
        showLoader: function() {
            this.loader.reveal();
        }

    }, {
        showLoading: true,
        template: '<div class="blackout"></div>',
        templateFrom: '#toolkit-blackout-1',
        loaderTemplate: '<div class="loader bar-wave">' +
            '<span></span><span></span><span></span><span></span><span></span>' +
            '<div class="loader-message" data-loader-message></div>' +
            '</div>'
    });

    /** Has the blackout been created already? */
    var blackout = null;

    /**
     * Only one instance of Blackout should exist,
     * so provide a factory method that stores the instance.
     *
     * @param {Object} [options]
     * @returns {Toolkit.Blackout}
     */
    Toolkit.Blackout.instance = function(options) {
        if (blackout) {
            return blackout;
        }

        return blackout = new Toolkit.Blackout(options);
    };

    /**
     * An event that triggers when a swipe event occurs over a target element.
     * Uses touch events for touch devices, and mouse events for non-touch devices.
     *
     * Implementation is a heavily modified version of the swipe events found in jQuery Mobile.
     * Credits to the jQuery team for the original implementation.
     *
     * @returns {Object}
     */
    $.event.special.swipe = (function() {
        var startEvent = isTouch ? 'touchstart' : 'mousedown',
            moveEvent = isTouch ? 'touchmove' : 'mousemove',
            stopEvent = isTouch ? 'touchend' : 'mouseup',
            swiping = false, // Flag For ensuring a single swipe at a time
            abs = Math.abs;

        function coords(e) {
            var data = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0] : e;

            return {
                time: (new Date()).getTime(),
                x: data.pageX,
                y: data.pageY
            };
        }

        function swipe(start, stop, selfTarget, origTarget) {
            if (!start || !stop) {
                return;
            }

            var settings = $.event.special.swipe,
                x = stop.x - start.x,
                y = stop.y - start.y,
                direction;

            if ((stop.time - start.time) <= settings.duration) {
                if (abs(x) >= settings.distance && abs(y) <= settings.restraint) {
                    direction = (x < 0) ? 'left' : 'right';

                } else if (abs(y) >= settings.distance && abs(x) <= settings.restraint) {
                    direction = (y < 0) ? 'up' : 'down';

                } else {
                    return;
                }

                var props = {
                    target: origTarget,
                    swipestart: start,
                    swipestop: stop
                };

                selfTarget
                    .trigger($.Event('swipe', props))
                    .trigger($.Event('swipe' + direction, props));
            }
        }

        return {
            duration: 1000, // Maximum time in milliseconds to travel
            distance: 50,   // Minimum distance required to travel
            restraint: 75,  // Maximum distance to travel in the opposite direction

            setup: function() {
                var self = $(this),
                    start,
                    target;

                /**
                 * There's a major bug in Android devices where `touchend` events do not fire
                 * without calling `preventDefault()` in `touchstart` or `touchmove`.
                 * Because of this, we have to hack-ily implement functionality into `touchmove`.
                 * We also can't use `touchcancel` as that fires prematurely and unbinds our move event.
                 * More information on these bugs can be found here:
                 *
                 * https://code.google.com/p/android/issues/detail?id=19827
                 * https://code.google.com/p/chromium/issues/detail?id=260732
                 *
                 * Using `touchcancel` is also rather unpredictable, as described here:
                 *
                 * http://alxgbsn.co.uk/2011/12/23/different-ways-to-trigger-touchcancel-in-mobile-browsers/
                 */
                function move(e) {
                    var to = coords(e);

                    // Trigger `preventDefault()` if `x` is larger than `y` (scrolling horizontally).
                    // If we `preventDefault()` while scrolling vertically, the window will not scroll.
                    if (abs(start.x - to.x) > abs(start.y - to.y)) {
                        e.preventDefault();
                    }
                }

                /**
                 * When `touchend` or `touchcancel` is triggered, clean up the swipe state.
                 * Also unbind `touchmove` events until another swipe occurs.
                 */
                function cleanup() {
                    start = target = null;
                    swiping = false;

                    self.off(moveEvent, move);
                }

                // Initialize the state when a touch occurs
                self.on(startEvent, function(e) {

                    // Calling `preventDefault()` on start will disable clicking of elements (links, inputs, etc)
                    // So only do it on an `img` element so it cannot be dragged
                    if (!isTouch && e.target.tagName.toLowerCase() === 'img') {
                        e.preventDefault();
                    }

                    // Exit early if another swipe is occurring
                    if (swiping) {
                        return;
                    }

                    start = coords(e);
                    target = e.target;
                    swiping = true;

                    // Non-touch devices don't make use of the move event
                    if (isTouch) {
                        self.on(moveEvent, move);
                    }
                });

                // Trigger the swipe event when the touch finishes
                self.on(stopEvent, function(e) {
                    swipe(start, coords(e), self, target);
                    cleanup();
                });

                // Reset the state when the touch is cancelled
                self.on('touchcancel', cleanup);
            },

            teardown: function() {
                $(this).off(startEvent).off(moveEvent).off(stopEvent).off('touchcancel');
            }
        };
    })();

// Set swipe methods and events
    $.each('swipe swipeleft swiperight swipeup swipedown'.split(' '), function(i, name) {
        if (name !== 'swipe') {
            $.event.special[name] = {
                setup: function() {
                    $(this).on('swipe', $.noop);
                },
                teardown: function() {
                    $(this).off('swipe');
                }
            };
        }
    });

    /**
     * Set a `transitionend` event. If the element has no transition set, trigger the callback immediately.
     *
     * @param {Object} data
     * @param {Function} fn
     * @returns {jQuery}
     */
    $.fn.transitionend = function(data, fn) {
        if (arguments.length > 0) {
            this.one(transitionEnd, null, data, fn);

            // No transition defined so trigger callback immediately
            var duration = this.css("transition-duration");

            if (duration === "0s" || typeof duration === 'undefined') {
                this.trigger(transitionEnd);
            }
        } else {
            this.trigger(transitionEnd);
        }

        return this;
    };

    /**
     * Throttle the execution of a function so it triggers at every delay interval.
     *
     * @param {Function} func
     * @param {Number} [delay]
     * @returns {Function}
     */
    $.throttle = function(func, delay) {
        if (!delay) {
            return func;
        }

        var throttled = false;

        return function() {
            var context = this, args = arguments;

            if (!throttled) {
                throttled = true;

                setTimeout(function() {
                    func.apply(context, args);
                    throttled = false;
                }, delay);
            }
        };
    };

    Toolkit.Carousel = Toolkit.Component.extend({
        name: 'Carousel',
        version: '1.5.0',

        /** Is the carousel currently animating? */
        animating: false,

        /** The parent list that contains the items. */
        container: null,

        /** Currently displayed item by index. */
        index: -1,

        /** Collection of items to display in the carousel. */
        items: [],

        /** Is the carousel stopped or paused? */
        stopped: false,

        /** Collection of tabs to use for jumping to items. */
        tabs: [],

        /** Cycle timer. */
        timer: null,

        /** The dimension (width or height) to read sizes from. */
        _dimension: null,

        /** The position (left or top) to modify for cycling. */
        _position: null,

        /** The size to cycle with. */
        _size: 0,

        /** The index to reset to while infinite scrolling. */
        _resetTo: null,

        /**
         * Initialize the carousel.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            var items, self = this;

            this.element = element = $(element);
            this.options = options = this.setOptions(options, element);

            // Set animation and ARIA
            element
                .aria('live', options.autoCycle ? 'assertive' : 'off')
                .addClass(options.animation);

            // Find the item container and disable transitions for initial load
            this.container = element.find('[data-carousel-items]')
                .addClass('no-transition');

            // Find all the items and set ARIA attributes
            this.items = items = this.container.find('li').each(function(index) {
                $(this)
                    .attr({
                        role: 'tabpanel',
                        id: self.id('item', index)
                    })
                    .data('carousel-index', index)
                    .aria('hidden', (index > 0));
            });

            // Find all tabs and set ARIA attributes
            this.tabs = element.find('[data-carousel-tabs]')
                .attr('role', 'tablist')
                .find('a').each(function(index) {
                    $(this)
                        .data('carousel-index', index)
                        .attr({
                            role: 'tab',
                            id: self.id('tab', index)
                        })
                        .aria({
                            controls: self.id('item', index),
                            selected: false,
                            expanded: false
                        });
                });

            // Set events
            this.events = {
                'resize window': $.throttle(this.calculate.bind(this), 50),
                'keydown window': 'onKeydown',
                'swipeleft element': 'next',
                'swipeup element': 'next',
                'swiperight element': 'prev',
                'swipedown element': 'prev',
                'click element [data-carousel-tabs] a': 'onJump',
                'click element [data-carousel-next]': 'next',
                'click element [data-carousel-prev]': 'prev',
                'click element [data-carousel-start]': 'start',
                'click element [data-carousel-stop]': 'stop'
            };

            if (options.stopOnHover) {
                this.events['mouseenter element'] = 'stop';
                this.events['mouseleave element'] = 'start';
            }

            // Initialize
            this.initialize();

            // Prepare the carousel
            this._setupState();
            this._buildClones();

            // Start the carousel
            this.calculate();
            this.start();
            this.jump(options.defaultIndex);
        },

        /**
         * Stop the carousel before destroying.
         */
        destructor: function() {
            this.jump(0);

            // Remove timers
            clearInterval(this.timer);

            // Remove clones
            this.container.transitionend(function() {
                $(this)
                    .addClass('no-transition')
                    .css('left', 0)
                    .find('li.is-cloned')
                    .remove();
            });
        },

        /**
         * Calculate the widths or heights for the items, the wrapper, and the cycle.
         */
        calculate: function() {
            if (this.options.animation === 'fade') {
                return;
            }

            var dimension = this._dimension, // height or width
                size;

            this._size = size = this.element[dimension]() / this.options.itemsToShow;

            // Set the item width and fit the proper amount based on itemCount
            var items = this.items.css(dimension, size);

            // Set the wrapper width based on the outer wrapper and item count
            this.container.css(dimension, size * items.length);
        },

        /**
         * Go to the item indicated by the index number.
         *
         * @param {Number} index
         */
        jump: function(index) {
            if (this.animating) {
                return;
            }

            var indexes = this._getIndex(index),
                cloneIndex = indexes[0], // The index including clones
                visualIndex = indexes[1]; // The index excluding clones

            // Exit early if jumping to same index
            if (visualIndex === this.index) {
                return;
            }

            this.fireEvent('jumping', [this.index]);

            // Update tabs and items state
            this._updateTabs(visualIndex);
            this._updateItems(cloneIndex);

            // Animate and move the items
            this._beforeCycle();

            if (this.options.animation === 'fade') {
                this.items
                    .conceal()
                    .eq(visualIndex)
                    .transitionend(this._afterCycle.bind(this))
                    .reveal();

            } else {
                this.container
                    .transitionend(this._afterCycle.bind(this))
                    .css(this._position, -(cloneIndex * this._size));
            }

            // Store the index
            this.index = visualIndex;

            this.reset();
            this.fireEvent('jumped', [visualIndex]);
        },

        /**
         * Go to the next item.
         */
        next: function() {
            this.jump(this.index + this.options.itemsToCycle);
        },

        /**
         * Go to the previous item.
         */
        prev: function() {
            this.jump(this.index - this.options.itemsToCycle);
        },

        /**
         * Reset the timer.
         */
        reset: function() {
            if (this.options.autoCycle) {
                clearInterval(this.timer);
                this.timer = setInterval(this.onCycle.bind(this), this.options.duration);
            }
        },

        /**
         * Start the carousel.
         */
        start: function() {
            this.element.removeClass('is-stopped');
            this.stopped = false;

            this.fireEvent('start');
        },

        /**
         * Stop the carousel.
         */
        stop: function() {
            this.element.addClass('is-stopped');
            this.stopped = true;

            this.fireEvent('stop');
        },

        /**
         * Functionality to trigger after a cycle transition has ended.
         * Will set animating to false and re-enable jumping.
         *
         * If `resetTo` is set, then reset the internal DOM index for infinite scrolling.
         * Also clean-up the `no-transition` class from the container.
         *
         * @private
         */
        _afterCycle: function() {
            this.animating = false;

            var container = this.container,
                resetTo = this._resetTo;

            // Reset the currently shown item to a specific index
            // This achieves the circular infinite scrolling effect
            if (resetTo !== null) {
                container
                    .addClass('no-transition')
                    .css(this._position, -(resetTo * this._size));

                this._updateItems(resetTo);
                this._resetTo = null;
            }

            // Set in a timeout or transition will still occur
            setTimeout(function() {
                container.removeClass('no-transition');
                this.fireEvent('cycled');
            }.bind(this), 15); // IE needs a minimum of 15
        },

        /**
         * Functionality to trigger before a cycle transition begins.
         * Will set the animating flag to true so that jumping is disabled.
         *
         * @private
         */
        _beforeCycle: function() {
            this.animating = true;
            this.fireEvent('cycling');
        },

        /**
         * Create clones to support infinite scrolling.
         * The beginning set of cloned items should be appended to the end,
         * while the end set of cloned items should be prepended to the beginning.
         *
         * @private
         */
        _buildClones: function() {
            var options = this.options,
                items = this.items,
                container = this.container,
                itemsToShow = options.itemsToShow;

            if (!options.infinite) {
                return;
            }

            // Append the first items
            items.slice(0, itemsToShow)
                .clone()
                .addClass('is-cloned')
                .removeAttr('id')
                .removeAttr('role')
                .appendTo(container);

            // Prepend the last items
            items.slice(-itemsToShow)
                .clone()
                .addClass('is-cloned')
                .removeAttr('id')
                .removeAttr('role')
                .prependTo(container);

            // Refresh items list
            this.items = container.find('li');
        },

        /**
         * Determine the index to jump to while taking cloned elements and infinite scrolling into account.
         * Will return an array for the DOM element index (including clones) and the visual indication index
         * for active states.
         *
         * @param {Number} index    The visual index (not the clone index)
         * @returns {Array}
         * @private
         */
        _getIndex: function(index) {
            var options = this.options,
                itemsToShow = options.itemsToShow,
                visualIndex,
                cloneIndex;

            index = parseInt(index, 10);

            if (options.infinite) {
                var lengthWithClones = this.items.length,
                    lengthWithoutClones = lengthWithClones - (itemsToShow * 2);

                // If the cycle reaches the clone past the end
                if (index >= lengthWithoutClones) {
                    this._resetTo = 0 + itemsToShow;

                    // Set the literal index to the clone on the end
                    cloneIndex = lengthWithClones - itemsToShow;

                    // Reset the visual index to 0
                    visualIndex = 0;

                    // If cycle reaches the clone past the beginning
                } else if (index <= -itemsToShow) {
                    this._resetTo = lengthWithoutClones;

                    // Set the literal index to the clone on the beginning
                    cloneIndex = 0;

                    // Reset the visual index to the last
                    visualIndex = lengthWithoutClones - itemsToShow;

                    // If cycle is within the normal range
                } else {
                    this._resetTo = null;

                    // We need to alter the actual index to account for the clones
                    visualIndex = index;
                    cloneIndex = index + itemsToShow;
                }

            } else {
                var element = this.element.removeClass('no-next no-prev'),
                    maxIndex = this.items.length - itemsToShow;

                // If cycle reaches the last visible item, remove the next button or rewind
                if (index >= maxIndex) {
                    index = maxIndex;

                    if (options.loop) {
                        if (index === this.index && this.index === maxIndex) {
                            index = 0;
                        }
                    } else {
                        element.addClass('no-next');
                    }

                    // If cycle reaches the first visible item, remove prev button or fast forward
                } else if (index <= 0) {
                    index = 0;

                    if (options.loop) {
                        if (index === this.index && this.index === 0) {
                            index = maxIndex;
                        }
                    } else {
                        element.addClass('no-prev');
                    }
                }

                cloneIndex = visualIndex = index;
            }

            return [cloneIndex, visualIndex];
        },

        /**
         * Setup the carousel state to introspecting property values and resetting options.
         *
         * @private
         */
        _setupState: function() {
            var options = this.options,
                animation = options.animation;

            // Cycling more than the show amount causes unexpected issues
            if (options.itemsToCycle > options.itemsToShow) {
                options.itemsToCycle = options.itemsToShow;
            }

            // Fade animations can only display 1 at a time
            if (animation === 'fade') {
                options.itemsToShow = options.itemsToCycle = 1;
                options.infinite = false;
            }

            // Determine the dimension and position based on animation
            if (animation === 'slide-up') {
                this._dimension = 'height';
                this._position = 'top';

            } else if (animation === 'slide') {
                this._dimension = 'width';
                this._position = 'left';
            }
        },

        /**
         * Update the active state for the items while taking into account cloned elements.
         *
         * @param {Number} index
         * @private
         */
        _updateItems: function(index) {
            this.items
                .removeClass('is-active')
                .aria('hidden', true)
                .slice(index, index + this.options.itemsToShow)
                .addClass('is-active')
                .aria('hidden', false);
        },

        /**
         * Update the active state for the tab indicators.
         *
         * @param {Number} start
         * @private
         */
        _updateTabs: function(start) {
            var itemsToShow = this.options.itemsToShow,
                length = this.items.length,
                stop = start + itemsToShow,
                set = $([]),
                tabs = this.tabs
                    .removeClass('is-active')
                    .aria('toggled', false);

            if (!tabs.length) {
                return;
            }

            if (this.options.infinite) {
                length = length - (itemsToShow * 2);
            }

            if (start >= 0) {
                set = set.add(tabs.slice(start, stop));
            } else {
                set = set.add(tabs.slice(0, stop));
                set = set.add(tabs.slice(start));
            }

            if (stop > length) {
                set = set.add(tabs.slice(0, stop - length));
            }

            set
                .addClass('is-active')
                .aria('toggled', false);
        },

        /**
         * Event handler for cycling between items.
         * Will stop cycling if carousel is stopped.
         *
         * @private
         */
        onCycle: function() {
            if (!this.stopped) {
                if (this.options.reverse) {
                    this.prev();
                } else {
                    this.next();
                }
            }
        },

        /**
         * Event handler for jumping between items.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onJump: function(e) {
            e.preventDefault();

            this.jump($(e.currentTarget).data('carousel-index') || 0);
        },

        /**
         * Event handle for keyboard events.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onKeydown: function(e) {
            if ($.inArray(e.keyCode, [37, 38, 39, 40]) >= 0) {
                e.preventDefault();
            } else {
                return;
            }

            switch (e.keyCode) {
                case 37: this.prev(); break;
                case 38: this.jump(0); break;
                case 39: this.next(); break;
                case 40: this.jump(-1); break;
            }
        }

    }, {
        animation: 'slide',
        duration: 5000,
        autoCycle: true,
        stopOnHover: true,
        infinite: true,
        loop: true,
        reverse: false,
        itemsToShow: 1,
        itemsToCycle: 1,
        defaultIndex: 0
    });

    Toolkit.create('carousel', function(options) {
        return new Toolkit.Carousel(this, options);
    });

    /**
     * An event that allows the clicking of the document to trigger a callback.
     * However, will only trigger if the element clicked is not in the exclude list or a child of.
     * Useful for closing drop downs and menus.
     *
     * Based on and credited to http://benalman.com/news/2010/03/jquery-special-events/
     *
     * @returns {Object}
     */
    $.event.special.clickout = (function() {
        var elements = [];

        $(document).on('click.toolkit.out', function(e) {
            if (!elements.length) {
                return;
            }

            var trigger = true,
                collection = $(document),
                target = $(e.target);

            $.each(elements, function(i, item) {
                var self = $(item);

                // Test that the delegated selector class matches
                if ($.type(item) === 'string') {
                    trigger = (!target.is(item) && !self.has(e.target).length);

                    // Else test if the element matches
                } else {
                    trigger = (!self.is(e.target) && !self.has(e.target).length);
                }

                if (trigger) {
                    collection = collection.add(self);
                } else {
                    return false;
                }
            });

            if (trigger) {
                collection.trigger('clickout', [e.target]);
            }
        });

        return {
            add: function(handler) {
                var context = this;

                if (this === document) {
                    context = handler.selector;
                }

                if ($.inArray(context, elements) === -1) {
                    elements.push(context);
                }
            },
            remove: function(handler) {
                var context = this;

                if (this === document) {
                    context = handler.selector;
                }

                elements = $.grep(elements, function(item) {
                    return (item !== context);
                });
            }
        };
    })();

    Toolkit.Drop = Toolkit.Component.extend({
        name: 'Drop',
        version: '1.4.0',

        /**
         * Initialize the drop.
         *
         * @param {jQuery} nodes
         * @param {Object} [options]
         */
        constructor: function(nodes, options) {
            this.nodes = $(nodes);
            this.options = this.setOptions(options);
            this.events = {
                'clickout document [data-drop-menu]': 'hide',
                'clickout document {selector}': 'hide',
                '{mode} document {selector}': 'onShow'
            };

            // Initialize
            this.initialize();
        },

        /**
         * Hide the opened element and remove active state.
         */
        hide: function() {
            var element = this.element;

            if (element && element.is(':shown')) {
                this.fireEvent('hiding');

                element.conceal();

                this.node
                    .aria('toggled', false)
                    .removeClass('is-active');

                this.fireEvent('hidden', [element, this.node]);
            }
        },

        /**
         * Open the target element and apply active state.
         *
         * @param {jQuery} node
         */
        show: function(node) {
            this.fireEvent('showing');

            this.element.reveal();

            this.node = node = $(node)
                .aria('toggled', true)
                .addClass('is-active');

            this.fireEvent('shown', [this.element, node]);
        },

        /**
         * When a node is clicked, grab the target from the attribute.
         * Validate the target element, then either display or hide.
         *
         * @param {jQuery.Event} e
         * @private
         */
        onShow: function(e) {
            e.preventDefault();

            var node = $(e.currentTarget),
                options = this.options,
                target = this.readValue(node, options.getTarget);

            if (!target || target.substr(0, 1) !== '#') {
                return;
            }

            // Hide previous drops
            if (options.hideOpened && this.node && !this.node.is(node)) {
                this.hide();
            }

            this.element = $(target);
            this.node = node;

            if (!this.element.is(':shown')) {
                this.show(node);
            } else {
                this.hide();
            }
        }

    }, {
        mode: 'click',
        getTarget: 'data-drop',
        hideOpened: true
    });

    Toolkit.create('drop', function(options) {
        return new Toolkit.Drop(this, options);
    }, true);

    Toolkit.Flyout = Toolkit.Component.extend({
        name: 'Flyout',
        version: '1.4.0',

        /** Current URL to generate a flyout menu for. */
        current: null,

        /** Collection of flyout elements indexed by URL. */
        menus: {},

        /** Raw sitemap JSON data. */
        data: [],

        /** Data indexed by URL. */
        dataMap: {},

        /** Show and hide timers. */
        timers: {},

        /**
         * Initialize the flyout. A URL is required during construction.
         *
         * @param {jQuery} nodes
         * @param {String} url
         * @param {Object} [options]
         */
        constructor: function(nodes, url, options) {
            if (!url) {
                throw new Error('Flyout URL required to download sitemap JSON');
            }

            this.nodes = $(nodes);
            this.options = options = this.setOptions(options);

            if (options.mode === 'click') {
                this.events['click document {selector}'] = 'onShowToggle';
            } else {
                this.events['mouseenter document {selector}'] = ['onShowToggle', 'onEnter'];
                this.events['mouseleave document {selector}'] = 'onLeave';
            }

            this.initialize();

            // Load data from the URL
            $.getJSON(url, this.load.bind(this));
        },

        /**
         * Remove all the flyout menu elements and timers before destroying.
         */
        destructor: function() {
            $.each(this.menus, function(i, menu) {
                menu.remove();
            });

            this.clearTimer('show');
            this.clearTimer('hide');
        },

        /**
         * Clear a timer by key.
         *
         * @param {String} key
         */
        clearTimer: function(key) {
            clearTimeout(this.timers[key]);
            delete this.timers[key];
        },

        /**
         * Hide the currently shown menu.
         */
        hide: function() {
            // Must be called even if the menu is hidden
            if (this.node) {
                this.node.removeClass('is-active');
            }

            if (!this.current || !this.isVisible()) {
                return;
            }

            this.fireEvent('hiding');

            this.menus[this.current].conceal();

            this.fireEvent('hidden');

            // Reset last
            this.current = null;
        },

        /**
         * Return true if the current menu exists and is visible.
         *
         * @returns {bool}
         */
        isVisible: function() {
            if (this.current && this.menus[this.current]) {
                this.element = this.menus[this.current];
            }

            return (this.element && this.element.is(':shown'));
        },

        /**
         * Load the data into the class and save a mapping of it.
         *
         * @param {Object} data
         * @param {Number} [depth]
         */
        load: function(data, depth) {
            depth = depth || 0;

            // If root, store the data
            if (depth === 0) {
                this.data = data;
            }

            // Store the data indexed by URL
            if (data.url) {
                this.dataMap[data.url] = data;
            }

            if (data.children) {
                for (var i = 0, l = data.children.length; i < l; i++) {
                    this.load(data.children[i], depth + 1);
                }
            }
        },

        /**
         * Position the menu below the target node.
         */
        position: function() {
            var target = this.current,
                options = this.options;

            if (!this.menus[target]) {
                return;
            }

            this.fireEvent('showing');

            var menu = this.menus[target],
                height = menu.outerHeight(),
                coords = this.node.offset(),
                x = coords.left + options.xOffset,
                y = coords.top + options.yOffset + this.node.outerHeight(),
                windowScroll = $(window).height();

            // If menu goes below half page, position it above
            if (y > (windowScroll / 2)) {
                y = coords.top - options.yOffset - height;
            }

            menu.css({
                left: x,
                top: y
            }).reveal();

            this.fireEvent('shown');
        },

        /**
         * Show the menu below the node.
         *
         * @param {jQuery} node
         */
        show: function(node) {
            var target = this._getTarget(node);

            // When jumping from one node to another
            // Immediately hide the other menu and start the timer for the current one
            if (this.current && target !== this.current) {
                this.hide();
                this.startTimer('show', this.options.showDelay);
            }

            this.node = $(node);

            // Find the menu, else create it
            if (!this._getMenu()) {
                return;
            }

            this.node.addClass('is-active');

            // Display immediately if click
            if (this.options.mode === 'click') {
                this.position();
            }
        },

        /**
         * Add a timer that should trigger a function after a delay.
         *
         * @param {String} key
         * @param {Number} delay
         * @param {Array} [args]
         */
        startTimer: function(key, delay, args) {
            this.clearTimer(key);

            var func;

            if (key === 'show') {
                func = this.position;
            } else {
                func = this.hide;
            }

            if (func) {
                this.timers[key] = setTimeout(function() {
                    func.apply(this, args || []);
                }.bind(this), delay);
            }
        },

        /**
         * Build a nested list menu using the data object.
         *
         * @private
         * @param {jQuery} parent
         * @param {Object} data
         * @returns {jQuery}
         */
        _buildMenu: function(parent, data) {
            if (!data.children || !data.children.length) {
                return null;
            }

            var options = this.options,
                menu = $(options.template).attr('role', 'menu').aria('hidden', true),
                groups = [],
                ul,
                li,
                tag,
                limit = options.itemLimit,
                i, l;

            if (options.className) {
                menu.addClass(options.className);
            }

            if (parent.is('body')) {
                menu.addClass('is-root');
            } else {
                menu.aria('expanded', false);
            }

            if (limit && data.children.length > limit) {
                i = 0;
                l = data.children.length;

                while (i < l) {
                    groups.push(data.children.slice(i, i += limit));
                }
            } else {
                groups.push(data.children);
            }

            for (var g = 0, group, child; group = groups[g]; g++) {
                ul = $('<ul/>');

                for (i = 0, l = group.length; i < l; i++) {
                    child = group[i];

                    // Build tag
                    if (child.url) {
                        li = $('<li/>');
                        tag = $('<a/>', {
                            text: child.title,
                            href: child.url,
                            role: 'menuitem'
                        });

                        // Add icon
                        $('<span/>').addClass(child.icon || 'caret-right').prependTo(tag);

                    } else {
                        li = $(options.headingTemplate);
                        tag = $('<span/>', {
                            text: child.title,
                            role: 'presentation'
                        });
                    }

                    if (child.attributes) {
                        tag.attr(child.attributes);
                    }

                    // Build list
                    if (child.className) {
                        li.addClass(child.className);
                    }

                    li.append(tag).appendTo(ul);

                    if (child.children && child.children.length) {
                        this._buildMenu(li, child);

                        li.addClass('has-children')
                            .aria('haspopup', true)
                            .on('mouseenter', this.onPositionChild.bind(this, li))
                            .on('mouseleave', this.onHideChild.bind(this, li));
                    }
                }

                menu.append(ul);
            }

            menu.appendTo(parent);

            return menu;
        },

        /**
         * Get the menu if it exists, else build it and set events.
         *
         * @private
         * @returns {jQuery}
         */
        _getMenu: function() {
            var target = this._getTarget();

            if (this.menus[target]) {
                this.current = target;

                return this.menus[target];
            }

            if (this.dataMap[target]) {
                var menu = this._buildMenu($('body'), this.dataMap[target]);

                if (!menu) {
                    return null;
                }

                menu.conceal();

                if (this.options.mode !== 'click') {
                    menu.on({
                        mouseenter: function() {
                            this.clearTimer('hide');
                        }.bind(this),
                        mouseleave: function() {
                            this.startTimer('hide', this.options.hideDelay);
                        }.bind(this)
                    });
                }

                this.current = target;
                this.menus[target] = menu;

                return this.menus[target];
            }

            return null;
        },

        /**
         * Get the target URL to determine which menu to show.
         *
         * @private
         * @param {jQuery} [node]
         * @returns {String}
         */
        _getTarget: function(node) {
            node = $(node || this.node);

            return this.readValue(node, this.options.getUrl) || node.attr('href');
        },

        /**
         * Event handle when a mouse enters a node. Will show the menu after the timer.
         *
         * @private
         */
        onEnter: function() {
            this.clearTimer('hide');
            this.startTimer('show', this.options.showDelay);
        },

        /**
         * Event handler to hide the child menu after exiting parent li.
         *
         * @private
         * @param {jQuery} parent
         */
        onHideChild: function(parent) {
            parent = $(parent);
            parent.removeClass('is-open');
            parent.children('[data-flyout-menu]')
                .removeAttr('style')
                .aria({
                    expanded: false,
                    hidden: false
                });

            this.fireEvent('hideChild', [parent]);
        },

        /**
         * Event handle when a mouse leaves a node. Will hide the menu after the timer.
         *
         * @private
         */
        onLeave: function() {
            this.clearTimer('show');
            this.startTimer('hide', this.options.showDelay);
        },

        /**
         * Event handler to position the child menu dependent on the position in the page.
         *
         * @private
         * @param {jQuery} parent
         */
        onPositionChild: function(parent) {
            var menu = parent.children('[data-flyout-menu]');

            if (!menu) {
                return;
            }

            menu.aria({
                expanded: true,
                hidden: true
            });

            // Alter width because of columns
            var children = menu.children();

            menu.css('width', (children.outerWidth() * children.length) + 'px');

            // Get sizes after menu positioning
            var win = $(window),
                winHeight = win.height() + win.scrollTop(),
                winWidth = win.width(),
                parentTop = parent.offset().top,
                parentHeight = parent.outerHeight(),
                parentRight = parent.offset().left + parent.outerWidth();

            // Display menu horizontally on opposite side if it spills out of viewport
            var hWidth = parentRight + menu.outerWidth();

            if (hWidth >= winWidth) {
                menu.addClass('push-left');
            } else {
                menu.removeClass('push-left');
            }

            // Reverse menu vertically if below half way fold
            if (parentTop > (winHeight / 2)) {
                menu.css('top', '-' + (menu.outerHeight() - parentHeight) + 'px');
            } else {
                menu.css('top', 0);
            }

            parent.addClass('is-open');

            this.fireEvent('showChild', [parent]);
        },

        /**
         * Event handler to show the menu.
         *
         * @param {jQuery.Event} e
         * @private
         */
        onShowToggle: function(e) {

            // Flyouts shouldn't be usable on touch devices
            if (Toolkit.isTouch) {
                return;
            }

            // Set the current element
            this.isVisible();

            // Trigger the parent
            Toolkit.Component.prototype.onShowToggle.call(this, e);
        }

    }, {
        mode: 'hover',
        getUrl: 'href',
        xOffset: 0,
        yOffset: 0,
        showDelay: 350,
        hideDelay: 1000,
        itemLimit: 15,
        template: '<div class="flyout" data-flyout-menu></div>',
        headingTemplate: '<li class="flyout-heading"></li>'
    });

    Toolkit.create('flyout', function(url, options) {
        return new Toolkit.Flyout(this, url, options);
    }, true);

    Toolkit.Input = Toolkit.Component.extend({
        name: 'Input',
        version: '1.4.0',

        /** The original input element. */
        input: null,

        /** The element that wraps the custom input. */
        wrapper: null,

        /**
         * Initialize the input.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            this.element = element = $(element);
            this.options = options = this.setOptions(options, element);

            if (options.checkbox) {
                element.find(options.checkbox).inputCheckbox(options);
            }

            if (options.radio) {
                element.find(options.radio).inputRadio(options);
            }

            if (options.select) {
                element.find(options.select).inputSelect(options);
            }

            this.initialize();
        },

        /**
         * Remove the wrapper before destroying.
         */
        destructor: function() {
            var options = this.options,
                element = this.element;

            if (this.name === 'Input') {
                if (options.checkbox) {
                    element.find(options.checkbox).each(function() {
                        $(this).toolkit('inputCheckbox', 'destroy');
                    });
                }

                if (options.radio) {
                    element.find(options.radio).each(function() {
                        $(this).toolkit('inputRadio', 'destroy');
                    });
                }

                if (options.select) {
                    element.find(options.select).each(function() {
                        $(this).toolkit('inputSelect', 'destroy');
                    });
                }

            } else {
                this.wrapper.replaceWith(this.input);
                this.input.removeAttr('style');
            }
        },

        /**
         * Copy classes from one element to another, but do not copy `.input` classes.
         *
         * @param {jQuery} from
         * @param {jQuery} to
         */
        copyClasses: function(from, to) {
            var classes = ($(from).attr('class') || '').replace(/\binput\b/, '').trim();

            if (classes) {
                $(to).addClass(classes);
            }
        },

        /**
         * Build the element to wrap custom inputs with.
         * Copy over the original class names.
         *
         * @returns {jQuery}
         */
        _buildWrapper: function() {
            var input = this.input,
                wrapper = $(this.options.template)
                    .insertBefore(input)
                    .append(input);

            if (this.options.copyClasses) {
                this.copyClasses(input, wrapper);
            }

            return wrapper;
        }

    }, {
        copyClasses: true,
        checkbox: 'input:checkbox',
        radio: 'input:radio',
        select: 'select',
        template: '<div class="custom-input"></div>'
    });

    /**
     * Wraps a checkbox with a custom input.
     * Uses a label for checkbox toggling so no JavaScript events are required.
     */
    Toolkit.InputCheckbox = Toolkit.Input.extend({
        name: 'InputCheckbox',
        version: '1.4.0',

        /**
         * Initialize the checkbox.
         *
         * @param {jQuery} checkbox
         * @param {Object} [options]
         */
        constructor: function(checkbox, options) {
            this.input = checkbox = $(checkbox);
            this.options = options = this.setOptions(options, checkbox);
            this.wrapper = this._buildWrapper();

            // Create custom input
            this.element = $(options.checkboxTemplate)
                .attr('for', checkbox.attr('id'))
                .insertAfter(checkbox);

            // Initialize events
            this.initialize();
        }

    }, {
        checkboxTemplate: '<label class="checkbox"></label>'
    });

    /**
     * Wraps a radio with a custom input.
     * Uses a label for radio toggling so no JavaScript events are required.
     */
    Toolkit.InputRadio = Toolkit.Input.extend({
        name: 'InputRadio',
        version: '1.4.0',

        /**
         * Initialize the radio.
         *
         * @param {jQuery} radio
         * @param {Object} [options]
         */
        constructor: function(radio, options) {
            this.input = radio = $(radio);
            this.options = options = this.setOptions(options, radio);
            this.wrapper = this._buildWrapper();

            // Create custom input
            this.element = $(options.radioTemplate)
                .attr('for', radio.attr('id'))
                .insertAfter(radio);

            // Initialize events
            this.initialize();
        }

    }, {
        radioTemplate: '<label class="radio"></label>'
    });

    /**
     * Wraps a select dropdown with a custom input.
     * Supports native or custom dropdowns.
     */
    Toolkit.InputSelect = Toolkit.Input.extend({
        name: 'InputSelect',
        version: '1.4.0',

        /** The custom drop element. */
        dropdown: null,

        /** Current option index when cycling with keyboard. */
        index: 0,

        /** Is the select a multiple choice? */
        multiple: false,

        /**
         * Initialize the select.
         *
         * @param {jQuery} select
         * @param {Object} [options]
         */
        constructor: function(select, options) {
            var events = {};

            this.input = select = $(select);
            this.multiple = select.prop('multiple');
            this.options = options = this.setOptions(options, select);

            // Multiple selects must use native controls
            if (this.multiple && options.native) {
                return;
            }

            // Wrapping element
            this.wrapper = this._buildWrapper();

            // Button element to open the drop menu
            this.element = this._buildButton();

            // Initialize events
            events['change input'] = 'onChange';

            if (!options.native) {
                events['blur input'] = 'hide';
                events['clickout dropdown'] = 'hide';
                events['click element'] = 'onToggle';

                if (!this.multiple) {
                    events['keydown window'] = 'onCycle';
                }

                // Build custom dropdown when not in native
                this._buildDropdown();

                // Cant hide/invisible the real select or we lose focus/blur
                // So place it below .custom-input
                this.input.css('z-index', 1);
            }

            this.events = events;

            this.initialize();

            // Trigger change immediately to update the label
            this.input.change();
        },

        /**
         * Hide the dropdown and remove active states.
         */
        hide: function() {
            if (!this.dropdown.is(':shown')) {
                return; // Vastly speeds up page time since click/out events aren't running
            }

            this.fireEvent('hiding');

            this.element.removeClass('is-active');

            if (this.dropdown) {
                this.dropdown.conceal();
            }

            this.fireEvent('hidden');
        },

        /**
         * Show the dropdown and apply active states.
         */
        show: function() {
            this.fireEvent('showing');

            if (this.options.hideOpened) {
                $('[data-select-options]').each(function() {
                    $(this).siblings('select').toolkit('inputSelect', 'hide');
                });
            }

            this.element.addClass('is-active');

            if (this.dropdown) {
                this.dropdown.reveal();
            }

            this.fireEvent('shown');
        },

        /**
         * Build the element to represent the select button with label and arrow.
         *
         * @returns {jQuery}
         */
        _buildButton: function() {
            var options = this.options,
                button = $(options.selectTemplate)
                    .find('[data-select-arrow]').html(options.arrowTemplate).end()
                    .find('[data-select-label]').html(Toolkit.messages.loading).end()
                    .css('min-width', this.input.width())
                    .insertAfter(this.input);

            // Update the height of the native select input
            this.input.css('min-height', button.outerHeight());

            return button;
        },

        /**
         * Build the custom dropdown to hold a list of option items.
         *
         * @returns {jQuery}
         */
        _buildDropdown: function() {
            var select = this.input,
                options = this.options,
                buildOption = this._buildOption.bind(this),
                dropdown = $(options.optionsTemplate).attr('role', 'listbox').aria('multiselectable', this.multiple),
                list = $('<ul/>'),
                index = 0,
                self = this;

            this.dropdown = dropdown;

            select.children().each(function() {
                var optgroup = $(this);

                if (optgroup.prop('tagName').toLowerCase() === 'optgroup') {
                    if (index === 0) {
                        options.hideFirst = false;
                    }

                    list.append(
                        $(options.headingTemplate).text(optgroup.attr('label'))
                    );

                    optgroup.children().each(function() {
                        var option = $(this);

                        if (optgroup.prop('disabled')) {
                            option.prop('disabled', true);
                        }

                        if (option.prop('selected')) {
                            self.index = index;
                        }

                        list.append( buildOption(option, index) );
                        index++;
                    });
                } else {
                    if (optgroup.prop('selected')) {
                        self.index = index;
                    }

                    list.append( buildOption(optgroup, index) );
                    index++;
                }
            });

            if (options.hideSelected && !options.multiple) {
                dropdown.addClass('hide-selected');
            }

            if (options.hideFirst) {
                dropdown.addClass('hide-first');
            }

            if (this.multiple) {
                dropdown.addClass('is-multiple');
            }

            this.wrapper.append(dropdown.append(list));

            return dropdown;
        },

        /**
         * Build the list item to represent the select option.
         *
         * @param {jQuery} option
         * @param {Number} index
         * @returns {jQuery}
         */
        _buildOption: function(option, index) {
            var select = this.input,
                dropdown = this.dropdown,
                options = this.options,
                selected = option.prop('selected'),
                activeClass = 'is-active';

            // Create elements
            var li = $('<li/>'),
                content = option.text(),
                description;

            if (selected) {
                li.addClass(activeClass);
            }

            if (description = this.readValue(option, options.getDescription)) {
                content += $(options.descTemplate).html(description).prop('outerHTML');
            }

            var a = $('<a/>', {
                html: content,
                href: 'javascript:;',
                role: 'option'
            }).aria('selected', selected);

            if (this.options.copyClasses) {
                this.copyClasses(option, li);
            }

            li.append(a);

            // Attach no events for disabled options
            if (option.prop('disabled')) {
                li.addClass('is-disabled');
                a.aria('disabled', true);

                return li;
            }

            // Set events
            if (this.multiple) {
                a.click(function() {
                    var self = $(this),
                        selected = false;

                    if (option.prop('selected')) {
                        self.parent().removeClass(activeClass);

                    } else {
                        selected = true;
                        self.parent().addClass(activeClass);
                    }

                    option.prop('selected', selected);
                    self.aria('selected', selected);

                    select.change();
                });

            } else {
                var self = this;

                a.click(function() {
                    dropdown
                        .find('li').removeClass(activeClass).end()
                        .find('a').aria('selected', false);

                    $(this)
                        .aria('selected', true)
                        .parent()
                        .addClass(activeClass);

                    self.hide();
                    self.index = index;

                    select.val(option.val());
                    select.change();
                });
            }

            return li;
        },

        /**
         * Loop through the options and determine the index to
         * Skip over missing options, disabled options, or hidden options.
         *
         * @private
         * @param {Number} index
         * @param {Number} step
         * @param {jQuery} options
         * @returns {Number}
         */
        _loop: function(index, step, options) {
            var hideFirst = this.options.hideFirst;

            index += step;

            while ((typeof options[index] === 'undefined') || options[index].disabled || (index === 0 && hideFirst)) {
                index += step;

                if (index >= options.length) {
                    index = 0;
                } else if (index < 0) {
                    index = options.length - 1;
                }
            }

            return index;
        },

        /**
         * Event handler for select option changing.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onChange: function(e) {
            var select = $(e.target),
                options = select.find('option'),
                opts = this.options,
                selected = [],
                label = [],
                self = this;

            // Fetch label from selected option
            options.each(function() {
                if (this.selected) {
                    selected.push( this );
                    label.push( self.readValue(this, opts.getOptionLabel) || this.textContent );
                }
            });

            // Reformat label if needed
            if (this.multiple) {
                var title = this.readValue(select, opts.getDefaultLabel),
                    format = opts.multipleFormat,
                    count = label.length;

                // Use default title if nothing selected
                if (!label.length && title) {
                    label = title;

                    // Display a counter for label
                } else if (format === 'count') {
                    label = opts.countMessage
                        .replace('{count}', count)
                        .replace('{total}', options.length);

                    // Display options as a list for label
                } else if (format === 'list') {
                    var limit = opts.listLimit;

                    label = label.splice(0, limit).join(', ');

                    if (limit < count) {
                        label += ' ...';
                    }
                }
            } else {
                label = label.join(', ');
            }

            // Set the label
            select.parent()
                .find('[data-select-label]')
                .text(label);

            this.fireEvent('change', [select.val(), selected]);
        },

        /**
         * Event handler for cycling through options with up and down keys.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onCycle: function(e) {
            if (!this.dropdown.is(':shown')) {
                return;
            }

            if ($.inArray(e.keyCode, [38, 40, 13, 27]) >= 0) {
                e.preventDefault();
            } else {
                return;
            }

            var options = this.input.find('option'),
                items = this.dropdown.find('a'),
                activeClass = 'is-active',
                index = this.index;

            switch (e.keyCode) {
                case 13: // enter
                case 27: // esc
                    this.hide();
                    return;
                case 38: // up
                    index = this._loop(index, -1, options);
                    break;
                case 40: // down
                    index = this._loop(index, 1, options);
                    break;
            }

            options.prop('selected', false);
            options[index].selected = true;

            items.parent().removeClass(activeClass);
            items.eq(index).parent().addClass(activeClass);

            this.index = index;
            this.input.change();
        },

        /**
         * Event handler for toggling custom dropdown display.
         *
         * @private
         */
        onToggle: function() {
            if (this.input.prop('disabled')) {
                return;
            }

            if (this.dropdown.is(':shown')) {
                this.hide();
            } else {
                this.show();
            }
        }

    }, {
        native: Toolkit.isTouch,
        multipleFormat: 'count', // count, list
        countMessage: '{count} of {total} selected',
        listLimit: 3,
        hideOpened: true,
        hideFirst: false,
        hideSelected: false,
        getDefaultLabel: 'title',
        getOptionLabel: 'title',
        getDescription: 'data-description',
        selectTemplate: '<div class="select" data-select>' +
            '<div class="select-arrow" data-select-arrow></div>' +
            '<div class="select-label" data-select-label></div>' +
            '</div>',
        arrowTemplate: '<span class="caret-down"></span>',
        optionsTemplate: '<div class="drop drop--down select-options" data-select-options></div>',
        headingTemplate: '<li class="drop-heading"></li>',
        descTemplate: '<span class="drop-desc"></span>'
    });

    Toolkit.create('input', function(options) {
        return new Toolkit.Input(this, options);
    });

    Toolkit.create('inputRadio', function(options) {
        return new Toolkit.InputRadio(this, options);
    });

    Toolkit.create('inputCheckbox', function(options) {
        return new Toolkit.InputCheckbox(this, options);
    });

    Toolkit.create('inputSelect', function(options) {
        return new Toolkit.InputSelect(this, options);
    });

    Toolkit.LazyLoad = Toolkit.Component.extend({
        name: 'LazyLoad',
        version: '1.5.0',

        /** Container to monitor scroll events on. */
        container: $(window),

        /** How many items have been loaded. */
        loaded: 0,

        /**
         * Initialize the lazy load.
         *
         * @param {jQuery} container
         * @param {Object} [options]
         */
        constructor: function(container, options) {
            container = $(container);

            this.options = options = this.setOptions(options, container);
            this.elements = container.find(this.options.lazyClass);

            if (container.css('overflow') === 'auto') {
                this.container = container;
            }

            var callback = $.throttle(this.load.bind(this), options.throttle);

            this.events = {
                'scroll container': callback,
                'resize window': callback,
                'ready document': 'onReady'
            };

            this.initialize();
        },

        /**
         * Load all images when destroying.
         */
        destructor: function() {
            this.loadAll();
        },

        /**
         * Verify that the element is within the current browser viewport.
         *
         * @param {jQuery} node
         * @returns {bool}
         */
        inViewport: function(node) {
            node = $(node);

            var container = this.container,
                threshold = this.options.threshold,
                conHeight = container.height(),
                conWidth = container.width(),
                scrollTop = container.scrollTop(),
                scrollLeft = container.scrollLeft(),
                nodeOffset = node.offset(),
                left = nodeOffset.left,
                top = nodeOffset.top;

            // Re-adjust the offset to match the parent container
            // is() fails when checking against window
            if (container[0] !== window) {
                var conOffset = container.offset();

                left -= conOffset.left;
                top -= conOffset.top;
            }

            return (
                // Element is not hidden
                node.is(':visible') &&
                    // Below the top
                    (top >= (scrollTop - threshold)) &&
                    // Above the bottom
                    (top <= (scrollTop + conHeight + threshold)) &&
                    // Right of the left
                    (left >= (scrollLeft - threshold)) &&
                    // Left of the right
                    (left <= (scrollLeft + conWidth + threshold))
                );
        },

        /**
         * Loop over the lazy loaded elements and verify they are within the viewport.
         */
        load: function() {
            if (this.loaded >= this.elements.length) {
                this.shutdown();
                return;
            }

            this.fireEvent('loading');

            this.elements.each(function(index, node) {
                if (node && this.inViewport(node)) {
                    this.show(node, index);
                }
            }.bind(this));

            this.fireEvent('loaded');
        },

        /**
         * Load the remaining hidden elements and remove any container events.
         */
        loadAll: function() {
            this.elements.each(function(index, node) {
                this.show(node, index);
            }.bind(this));

            this.fireEvent('loadAll');
            this.shutdown();
        },

        /**
         * Show the element by removing the lazy load class.
         *
         * @param {jQuery} node
         * @param {Number} index
         */
        show: function(node, index) {
            node = $(node);

            this.fireEvent('showing', [node]);

            node.removeClass(this.options.lazyClass.substr(1));

            // Set the element being loaded for events
            this.element = node;

            // Replace src attributes on images
            node.find('img').each(function() {
                var image = $(this), src;

                if (Toolkit.isRetina) {
                    src = image.data('src-retina');
                }

                if (!src) {
                    src = image.data('src');
                }

                if (src) {
                    image.attr('src', src);
                }
            });

            // Replace element with null since removing from the array causes it to break
            this.elements.splice(index, 1, null);
            this.loaded++;

            this.fireEvent('shown', [node]);
        },

        /**
         * When triggered, will shutdown the instance from executing any longer.
         * Any container events will be removed and loading will cease.
         */
        shutdown: function() {
            if (this.enabled) {
                this.disable();
                this.fireEvent('shutdown');
            }
        },

        /**
         * Event handler triggered on DOM ready.
         *
         * @private
         */
        onReady: function() {
            this.load();

            // Set force load on DOM ready
            if (this.options.forceLoad) {
                setTimeout(this.loadAll.bind(this), this.options.delay);
            }
        }

    }, {
        forceLoad: false,
        delay: 10000,
        threshold: 150,
        throttle: 50,
        lazyClass: '.lazy-load'
    });

    Toolkit.create('lazyLoad', function(options) {
        return new Toolkit.LazyLoad(this, options);
    });

    Toolkit.Mask = Toolkit.Component.extend({
        name: 'Mask',
        version: '1.4.0',

        /** Mask element used for overlaying. */
        mask: null,

        /** Message element found within the mask. */
        message: null,

        /**
         * Initialize the mask.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            this.element = element = $(element);
            this.options = options = this.setOptions(options, element);

            // Add class and set relative positioning
            if (!element.is('body')) {
                element.addClass('is-maskable');

                if (element.css('position') === 'static') {
                    element.css('position', 'relative');
                }
            }

            // Find a mask or create it
            var mask = element.find('> [data-mask]');

            if (!mask.length) {
                mask = $(options.template);
            }

            this.setMask(mask);

            if (options.selector) {
                this.events['click document ' + options.selector] = 'toggle';
            }

            this.initialize();
        },

        /**
         * Remove the mask element before destroying.
         */
        destructor: function() {
            this.mask.remove();
            this.element
                .removeClass('is-maskable')
                .removeClass('is-masked')
                .css('position', '');
        },

        /**
         * Hide the mask and reveal the element.
         */
        hide: function() {
            this.fireEvent('hiding');

            this.mask.conceal();
            this.element.removeClass('is-masked');

            this.fireEvent('hidden');
        },

        /**
         * Set the element to use as a mask and append it to the target element.
         * Apply optional classes, events, and styles dependent on implementation.
         *
         * @param {jQuery} mask
         */
        setMask: function(mask) {
            var options = this.options,
                message;

            // Prepare mask
            mask.addClass('hide').appendTo(this.element);

            if (this.element.is('body')) {
                mask.css('position', 'fixed');
            }

            if (options.revealOnClick) {
                mask.click(this.hide.bind(this));
            }

            this.mask = mask;

            // Create message if it does not exist
            message = mask.find('[data-mask-message]');

            if (!message.length && options.messageContent) {
                message = $(options.messageTemplate)
                    .html(options.messageContent)
                    .appendTo(mask);
            }

            this.message = message;
        },

        /**
         * Show the mask and conceal the element.
         */
        show: function() {
            this.fireEvent('showing');

            this.mask.reveal();
            this.element.addClass('is-masked');

            this.fireEvent('shown');
        },

        /**
         * Toggle between display states.
         */
        toggle: function() {
            if (this.mask.is(':shown')) {
                this.hide();
            } else {
                this.show();
            }
        }

    }, {
        selector: '',
        revealOnClick: false,
        messageContent: '',
        template: '<div class="mask" data-mask></div>',
        messageTemplate: '<div class="mask-message" data-mask-message></div>'
    });

    Toolkit.create('mask', function(options) {
        return new Toolkit.Mask(this, options);
    });

    /**
     * Delays the execution of a function till the duration has completed.
     *
     * @param {Function} func
     * @param {Number} [threshold]
     * @param {bool} [immediate]
     * @returns {Function}
     */
    $.debounce = function(func, threshold, immediate) {
        var timeout;

        return function() {
            var context = this, args = arguments;

            clearTimeout(timeout);

            timeout = setTimeout(function() {
                timeout = null;

                if (!immediate) {
                    func.apply(context, args);
                }
            }, threshold || 150);

            if (immediate && !timeout)  {
                func.apply(context, args);
            }
        };
    };

    Toolkit.Matrix = Toolkit.Component.extend({
        name: 'Matrix',
        version: '1.5.2',

        /** How many columns that can fit in the wrapper. */
        colCount: 0,

        /** Height of each column. */
        colHeights: [],

        /** Calculated final width of the column (may differ from width option). */
        colWidth: 0,

        /** Collection of items within the matrix. */
        items: [],

        /** Collection of img elements. */
        images: [],

        /** List of items in order and how many columns they span horizontally. */
        matrix: [],

        /** Width of the wrapper. Is recalculated every page resize to determine column count. */
        wrapperWidth: 0,

        /**
         * Initialize the matrix.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            this.element = element = $(element);
            this.options = this.setOptions(options, element);

            // Initialize events
            this.events = {
                'resize window': $.debounce(this.onResize.bind(this))
            };

            this.initialize();

            // Render the matrix
            this.refresh();
        },

        /**
         * Remove inline styles before destroying.
         */
        destructor: function() {
            this.element.removeAttr('style');
            this.items.removeAttr('style');
        },

        /**
         * Append an item to the bottom of the matrix.
         *
         * @param {jQuery} item
         */
        append: function(item) {
            item = $(item)
                .appendTo(this.element)
                .css('opacity', 0);

            this.fireEvent('appending', [item]);

            this.refresh();
        },

        /**
         * Prepend an item to the top of the matrix.
         *
         * @param {jQuery} item
         */
        prepend: function(item) {
            item = $(item)
                .prependTo(this.element)
                .css('opacity', 0);

            this.fireEvent('prepending', [item]);

            this.refresh();
        },

        /**
         * Fetch new items and re-render the grid.
         */
        refresh: function() {
            this.items = this.element.find('> li').each(function() {
                var self = $(this);

                // Cache the initial column width
                self.cache('matrix-column-width', self.outerWidth());
            });

            if (this.options.defer) {
                this._deferRender();
            } else {
                this.render();
            }
        },

        /**
         * Remove an item from the grid (and DOM) and re-render.
         *
         * @param {jQuery} item
         */
        remove: function(item) {
            item = $(item);

            // Using event `remove` will cause the DOM element to delete itself
            this.fireEvent('removing', [item]);

            this.items.each(function() {
                var self = $(this);

                if (self.is(item)) {
                    self.remove();
                    return false;
                }

                return true;
            });

            this.refresh();
        },

        /**
         * Calculate and position items in the grid.
         */
        render: function() {
            this._calculateColumns();

            this.fireEvent('rendering');

            var element = this.element,
                items = this.items;

            // No items
            if (!items.length) {
                element.removeAttr('style');

                // Single column
            } else if (this.colCount <= 1) {
                element.removeAttr('style').addClass('no-columns');
                items.removeAttr('style');

                // Multi column
            } else {
                element.removeClass('no-columns');

                this._organizeItems();
                this._positionItems();
            }

            this.fireEvent('rendered');
        },

        /**
         * Calculate how many columns can be supported in the current resolution.
         * Modify the column width to account for gaps on either side.
         *
         * @private
         */
        _calculateColumns: function() {
            var wrapperWidth = this.element.outerWidth(),
                colWidth = this.options.width,
                gutter = this.options.gutter,
                cols = Math.max(Math.floor(wrapperWidth / colWidth), 1),
                colsWidth = (cols * (colWidth + gutter)) - gutter,
                diff;

            if (cols > 1) {
                if (colsWidth > wrapperWidth) {
                    diff = colsWidth - wrapperWidth;
                    colWidth -= (diff / cols);

                } else if (colsWidth < wrapperWidth) {
                    diff = wrapperWidth - colsWidth;
                    colWidth += (diff / cols);
                }
            }

            this.wrapperWidth = wrapperWidth;
            this.colWidth = colWidth;
            this.colCount = cols;
        },

        /**
         * Fetch all images within the matrix and attach an onload event.
         * This will monitor loaded images and render once all are complete.
         * Uses a src swap trick to force load cached images.
         *
         * @private
         */
        _deferRender: function() {
            var promises = [];

            this.images = this.element.find('img').each(function(index, image) {
                if (image.complete) {
                    return; // Already loaded
                }

                var src = image.src,
                    def = $.Deferred();

                image.onload = def.resolve;
                image.onerror = image.onabort = def.reject;
                image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
                image.src = src;

                promises.push(def.promise());
            });

            $.when.apply($, promises).always(this.render.bind(this));
        },

        /**
         * Organize the items into columns by looping over each item and calculating dimensions.
         * If an item spans multiple columns, account for it by filling with an empty space.
         *
         * @private
         */
        _organizeItems: function() {
            var item,
                span,
                size,
                l = this.items.length;

            this.matrix = [];

            for (var i = 0; i < l; i++) {
                item = this.items.eq(i);
                size = item.data('matrix-column-width');

                // How many columns does this item span?
                span = Math.max(Math.round(size / this.colWidth), 1);

                // Span cannot be larger than the total number of columns
                if (span > this.colCount) {
                    span = this.colCount;
                }

                this.matrix.push({
                    item: item,
                    span: span
                });

                // Multiple columns
                if (span > 1) {
                    for (var s = 1; s < span; s++) {
                        if (this.matrix) {
                            this.matrix.push({
                                item: item,
                                span: false // Indicates an empty space
                            });
                        }
                    }
                }
            }
        },

        /**
         * Loop through the items in each column and position them absolutely.
         *
         * @private
         */
        _positionItems: function() {
            var gutter = this.options.gutter,
                items = this.matrix,
                item,
                span,
                dir = this.options.rtl ? 'right' : 'left',
                y = [], // The top position values indexed by column
                c = 0, // Current column in the loop
                h = 0, // Smallest height column
                i, // Items loop counter
                l, // Items length
                s, // Current span column in the loop
                top,
                pos = { margin: 0, position: 'absolute' };

            for (i = 0; i < this.colCount; i++) {
                y.push(0);
            }

            for (i = 0, l = items.length; i < l; i++) {
                item = items[i];
                span = item.span;

                // Place the item in the smallest column
                h = -1;

                for (s = 0; s < this.colCount; s++) {
                    if (h === -1 || y[s] < h) {
                        h = y[s];
                        c = s;
                    }
                }

                // If the item extends too far out, move it to the next column
                // Or if the last column has been reached
                if ((c >= this.colCount) || ((span + c) > this.colCount)) {
                    c = 0;
                }

                // Item spans a column or multiple columns
                if (span) {
                    top = 0;

                    // If the item spans multiple columns
                    // Get the largest height from the previous row
                    for (s = 0; s < span; s++) {
                        if (y[c + s] > top) {
                            top = y[c + s];
                        }
                    }

                    // Position the item
                    pos.top = top;
                    pos[dir] = (this.colWidth + gutter) * c;
                    pos.width = ((this.colWidth + gutter) * span) - gutter;

                    item.item.css(pos).reveal();

                    // Loop again to add the value to each columns Y top value
                    // This must be done after positioning so we can calculate a new size
                    for (s = 0; s < span; s++) {
                        y[c + s] = item.item.outerHeight() + gutter + top;
                    }
                }

                this.colHeights[c] = y[c];

                c++;
            }

            // Set height of wrapper
            this.element.css('height', Math.max.apply(Math, y));
        },

        /**
         * Event handler for browser resizing.
         *
         * @private
         */
        onResize: function() {
            this.refresh();
        }

    }, {
        width: 200,
        gutter: 20,
        rtl: false,
        defer: true
    });

    Toolkit.create('matrix', function(options) {
        return new Toolkit.Matrix(this, options);
    });

    Toolkit.Modal = Toolkit.Component.extend({
        name: 'Modal',
        version: '1.5.2',

        /** Blackout element if enabled. */
        blackout: null,

        /**
         * Initialize the modal.
         *
         * @param {jQuery} nodes
         * @param {Object} [options]
         */
        constructor: function(nodes, options) {
            var element;

            this.options = options = this.setOptions(options);
            this.element = element = this.createElement()
                .attr('role', 'dialog')
                .aria('labelledby', this.id('title'))
                .aria('describedby', this.id('content'));

            // Enable fullscreen
            if (options.fullScreen) {
                element.addClass('is-fullscreen');
            }

            // Nodes found in the page on initialization
            this.nodes = $(nodes);

            if (options.blackout) {
                this.blackout = Toolkit.Blackout.instance();

                if (options.stopScroll) {
                    this.blackout.addHook('hidden', function(hidden) {
                        if (hidden) {
                            $('body').removeClass('no-scroll');
                        }
                    });
                }
            }

            // Initialize events
            this.events = {
                'keydown window': 'onKeydown',
                'clickout element': 'onHide',
                'clickout document {selector}': 'onHide',
                'click document {selector}': 'onShow',
                'click element': 'onHide',
                'click element [data-modal-close]': 'hide',
                'click element [data-modal-submit]': 'onSubmit'
            };

            this.initialize();
        },

        /**
         * Hide the modal and reset relevant values.
         */
        hide: function() {
            this.fireEvent('hiding');

            this.element.conceal();

            if (this.blackout) {
                this.blackout.hide();
            }

            this.fireEvent('hidden');
        },

        /**
         * Position the modal in the center of the screen.
         *
         * @param {String|jQuery} content
         */
        position: function(content) {
            // AJAX is currently loading
            if (content === true) {
                return;
            }

            // Hide blackout loading message
            if (this.blackout) {
                this.blackout.hideLoader();
            }

            this.fireEvent('showing');

            var body = this.element.find('[data-modal-content]');
            body.html(content);

            this.fireEvent('load', [content]);

            // Reveal modal
            this.element.reveal();

            // Resize modal
            if (this.options.fullScreen) {
                body.css('min-height', $(window).height());
            }

            this.fireEvent('shown');
        },

        /**
         * Show the modal with the specific content.
         * If a node is passed, grab the modal AJAX URL or target element.
         * If content is passed, display it immediately.
         *
         * @param {jQuery} node
         * @param {String} [content]
         */
        show: function(node, content) {
            var options = this.options,
                ajax = options.ajax;

            // Get content
            if (content) {
                ajax = false;

            } else if (node) {
                this.node = node = $(node);

                ajax = this.readOption(node, 'ajax');
                content = this.readValue(node, this.readOption(node, 'getContent')) || node.attr('href');
            }

            if (!content) {
                return;

            } else if (content && content.match(/^#[a-z0-9_\-\.:]+$/i)) {
                content = $(content).html();
                ajax = false;
            }

            // Show blackout if the element is hidden
            // If it is visible, the blackout count will break
            if (this.blackout && !this.element.is(':shown')) {
                this.blackout.show();
            }

            if (options.stopScroll) {
                $('body').addClass('no-scroll');
            }

            if (ajax) {
                if (this.cache[content]) {
                    this.position(this.cache[content]);
                } else {
                    this.requestData(content);
                }
            } else {
                this.position(content);
            }
        },

        /**
         * Submit the form found within the modal.
         */
        submit: function() {
            var form = this.element.find('form:first');

            if (!form) {
                return;
            }

            this.fireEvent('submit', [form]);

            var options = {
                url: form.attr('action'),
                type: (form.attr('method') || 'post').toUpperCase()
            };

            if (window.FormData) {
                options.processData = false;
                options.contentType = false;
                options.data = new FormData(form[0]);
            } else {
                options.data = form.serialize();
            }

            this.requestData(options);
        },

        /**
         * Event handler for hide().
         *
         * @private
         * @param {jQuery.Event} e
         */
        onHide: function(e) {
            var element = this.element;

            // Since the modal element covers the entire viewport, we can't trigger the `clickout` event
            // So instead we have to bind a click event to the outer modal element to hide it
            // This should not trigger if a child element is clicked
            if (e.type === 'click' && !$(e.target).is(element)) {
                return;
            }

            e.preventDefault();

            // If the modal is loading (AJAX) or is not shown, exit early
            // This stops cases where the blackout can be clicked early
            if (!element.is(':shown') || element.hasClass('is-loading')) {
                return;
            }

            this.hide();
        },

        /**
         * Event handler for closing the modal when esc is pressed.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onKeydown: function(e) {
            if (e.keyCode === 27 /*esc*/ && this.element.is(':shown')) {
                this.hide();
            }
        },

        /**
         * Submit the form within the modal if it exists and re-render the modal with the response.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onSubmit: function(e) {
            e.preventDefault();

            this.submit();
        }

    }, {
        animation: 'fade',
        ajax: true,
        draggable: false,
        blackout: true,
        fullScreen: false,
        stopScroll: true,
        getContent: 'data-modal',
        template: '<div class="modal">' +
            '<div class="modal-outer">' +
            '<div class="modal-inner" data-modal-content></div>' +
            '<button class="modal-close" data-modal-close><span class="x"></span></button>' +
            '</div>' +
            '</div>'
    });

    Toolkit.create('modal', function(options) {
        return new Toolkit.Modal(this, options);
    }, true);

    Toolkit.OffCanvas = Toolkit.Component.extend({
        name: 'OffCanvas',
        version: '1.5.0',

        /** The parent container. */
        container: null,

        /** The primary content wrapper. */
        primary: null,

        /** Secondary sibling sidebars. */
        secondary: null,

        /** The side the primary sidebar is located. */
        side: 'left',

        /** The opposite of `side`. */
        opposite: 'right',

        /**
         * Initialize off canvas.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            var events = {};

            this.element = element = $(element).attr('role', 'complementary').conceal();
            this.options = options = this.setOptions(options, element);

            var animation = options.animation;

            // Touch devices cannot use squish
            if (Toolkit.isTouch && animation === 'squish') {
                options.animation = animation = 'push';
            }

            // Cannot have multiple non-overlayed or non-squished sidebars open
            if (animation !== 'on-top' && animation !== 'squish') {
                options.hideOthers = true;
            }

            // Setup container
            this.container = element.parent().addClass(animation);
            this.primary = element.siblings('[data-offcanvas-content]').attr('role', 'main');
            this.secondary = element.siblings('[data-offcanvas-sidebar]');

            // Determine the side
            this.side = element.data('offcanvas-sidebar') || 'left';
            this.opposite = (this.side === 'left') ? 'right' : 'left';

            // Initialize events
            events['ready document'] = 'onReady';
            events['resize window'] = 'onResize';

            if (this.side === 'left') {
                events['swipeleft element'] = 'hide';
                events['swiperight container'] = 'onSwipe';
            } else {
                events['swipeleft container'] = 'onSwipe';
                events['swiperight element'] = 'hide';
            }

            if (options.selector) {
                events['click document ' + options.selector] = 'toggle';
            }

            this.events = events;

            this.initialize();
        },

        /**
         * Hide the sidebar and reset the container.
         */
        hide: function() {
            this.fireEvent('hiding');

            this.container.removeClass('move-' + this.opposite);

            this.element
                .conceal()
                .removeClass('is-expanded')
                .aria('expanded', false);

            if (this.options.stopScroll) {
                $('body').removeClass('no-scroll');
            }

            this.fireEvent('hidden');
        },

        /**
         * Show the sidebar and squish the container to make room for the sidebar.
         * If hideOthers is true, hide other open sidebars.
         */
        show: function() {
            var options = this.options;

            if (options.hideOthers) {
                this.secondary.each(function() {
                    var sidebar = $(this);

                    if (sidebar.hasClass('is-expanded')) {
                        sidebar.toolkit('offCanvas', 'hide');
                    }
                });
            }

            this.fireEvent('showing');

            this.container.addClass('move-' + this.opposite);

            this.element
                .reveal()
                .addClass('is-expanded')
                .aria('expanded', true);

            if (options.stopScroll) {
                $('body').addClass('no-scroll');
            }

            this.fireEvent('shown');
        },

        /**
         * Toggle between show and hide states.
         */
        toggle: function() {
            if (this.element.hasClass('is-expanded')) {
                this.hide();
            } else {
                this.show();
            }
        },

        /**
         * On page load, immediately display the sidebar.
         * Remove transitions from the sidebar and container so there is no page jumping.
         * Also disable `hideOthers` so multiple sidebars can be displayed on load.
         *
         * @private
         */
        onReady: function() {
            if (!this.options.openOnLoad) {
                return;
            }

            var sidebar = this.element,
                inner = this.primary,
                transClass = 'no-transition';

            sidebar.addClass(transClass);
            inner.addClass(transClass);

            this.show();

            // Transitions will still occur unless we place in a timeout
            setTimeout(function() {
                sidebar.removeClass(transClass);
                inner.removeClass(transClass);
            }, 15); // IE needs a minimum of 15
        },

        /**
         * Triggered when the page is resized.
         *
         * @private
         */
        onResize: function() {
            this.fireEvent('resize');
        },

        /**
         * When swiping on the container, don't trigger a show if we are trying to hide a sidebar.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onSwipe: function(e) {
            e.preventDefault();

            var target = $(e.target),
                selector = '[data-offcanvas-sidebar]';

            if (target.is(selector) || target.parents(selector).length) {
                return;
            }

            this.show();
        }

    }, {
        selector: '',
        animation: 'push',
        openOnLoad: false,
        hideOthers: true,
        stopScroll: true
    });

    Toolkit.create('offCanvas', function(options) {
        return new Toolkit.OffCanvas(this, options);
    });

    Toolkit.Pin = Toolkit.Component.extend({
        name: 'Pin',
        version: '1.5.0',

        /** Will the element be pinned? */
        active: true,

        /** Outer height of the element. */
        elementHeight: null,

        /** The initial top value to reset to. */
        elementTop: 0,

        /** Inner height of the parent element. */
        parentHeight: null,

        /** The top value of the parent to compare against. */
        parentTop: null,

        /** The width and height of the viewport. Will update on resize. */
        viewport: {},

        /**
         * Initialize the pin.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            this.element = element = $(element);
            this.options = options = this.setOptions(options, element);

            // Setup classes and ARIA
            element
                .attr('role', 'complementary')
                .addClass(options.animation);

            this.elementTop = parseInt(element.css('top'), 10);

            // Initialize events
            var throttle = options.throttle;

            this.events = {
                'scroll window': $.throttle(this.onScroll.bind(this), throttle),
                'resize window': $.throttle(this.onResize.bind(this), throttle),
                'ready document': 'onResize'
            };

            this.initialize();
        },

        /**
         * Remove inline styles before destroying.
         */
        destructor: function() {
            this.active = false;

            // Need to be in a timeout or they won't be removed
            setTimeout(function() {
                this.element
                    .removeAttr('style')
                    .removeClass('is-pinned');
            }.bind(this), 15);
        },

        /**
         * Calculate the dimensions and offsets of the interacting elements.
         */
        calculate: function() {
            var win = $(window),
                options = this.options,
                parent = options.context ? this.element.parents(options.context) : this.element.parent();

            this.viewport = {
                width: win.width(),
                height: win.height()
            };

            this.elementHeight = this.element.outerHeight(true); // include margin
            this.parentHeight = parent.height(); // exclude padding
            this.parentTop = parent.offset().top;

            // Disable pin if element is larger than the viewport
            if (options.lock && this.elementHeight >= this.viewport.height) {
                this.active = false;

                // Enable pin if the parent is larger than the child
            } else {
                this.active = (this.element.is(':visible') && this.parentHeight > this.elementHeight);
            }
        },

        /**
         * Pin the element along the vertical axis while staying contained within the parent.
         */
        pin: function() {
            var options = this.options;

            if (options.calculate) {
                this.calculate();
            }

            if (!this.active) {
                return;
            }

            var isFixed = options.fixed,
                eHeight = this.elementHeight,
                eTop = this.elementTop,
                pHeight = this.parentHeight,
                pTop = this.parentTop,
                scrollTop = $(window).scrollTop(),
                pos = {},
                x = options.xOffset,
                y = 0;

            // Scroll is above the parent, remove pin inline styles
            if (scrollTop < pTop) {
                this.element
                    .removeAttr('style')
                    .removeClass('is-pinned');

                return;
            }

            // Don't extend out the bottom
            var elementMaxPos = scrollTop + eHeight,
                parentMaxHeight = pHeight + pTop;

            // Swap positioning of the fixed menu once it reaches the parent borders
            if (isFixed) {
                if (elementMaxPos >= parentMaxHeight) {
                    y = 'auto';

                    pos.position = 'absolute';
                    pos.bottom = 0;

                } else {
                    y = options.yOffset;

                    pos.position = 'fixed';
                    pos.bottom = 'auto';
                }

                // Stop positioning absolute menu once it exits the parent
            } else {
                pos.position = 'absolute';

                if (elementMaxPos >= parentMaxHeight) {
                    y += (pHeight - eHeight);

                } else {
                    y += (scrollTop - pTop) + options.yOffset;
                }

                // Don't go lower than default top
                if (eTop && y < eTop) {
                    y = eTop;
                }
            }

            pos[options.location] = x;
            pos.top = y;

            this.element
                .css(pos)
                .addClass('is-pinned');
        },

        /**
         * Determine whether to pin or unpin.
         *
         * @private
         */
        onResize: function() {
            this.calculate();
            this.pin();
            this.fireEvent('resize');
        },

        /**
         * While the viewport is being scrolled, the element should move vertically along with it.
         * The element should also stay contained within the parent element.
         *
         * @private
         */
        onScroll: function() {
            this.pin();
            this.fireEvent('scroll');
        }

    }, {
        location: 'right',
        xOffset: 0,
        yOffset: 0,
        throttle: 50,
        fixed: false,
        calculate: false,
        lock: true
    });

    Toolkit.create('pin', function(options) {
        return new Toolkit.Pin(this, options);
    });

    /**
     * Position the element relative to another element in the document, or to the mouse cursor.
     * Determine the offsets through the `relativeTo` argument, which can be an event, or a jQuery element.
     * Re-position the element if its target coordinates fall outside of the viewport.
     * Optionally account for mouse location and base offset coordinates.
     *
     * @param {String} position
     * @param {Event|jQuery} relativeTo
     * @param {Object} baseOffset
     * @param {bool} isMouse
     * @returns {jQuery}
     */
    $.fn.positionTo = function(position, relativeTo, baseOffset, isMouse) {
        if (!position) {
            return this;
        }

        var newPosition = position,
            offset = baseOffset || { left: 0, top: 0 },
            relOffset,
            relHeight = 0,
            relWidth = 0,
            eHeight = this.outerHeight(true),
            eWidth = this.outerWidth(true),
            win = $(window),
            wWidth = win.width(),
            wHeight = win.height(),
            wsTop = win.scrollTop();

        // If an event is used, position it near the mouse
        if (relativeTo.preventDefault) {
            relOffset = { left: relativeTo.pageX, top: relativeTo.pageY };

            // Else position it near the element
        } else {
            relOffset = relativeTo.offset();
            relHeight = relativeTo.outerHeight();
            relWidth = relativeTo.outerWidth();
        }

        // Re-position element if outside the viewport
        offset.left += relOffset.left;
        offset.top += relOffset.top;

        if ((relOffset.top - eHeight - wsTop) < 0) {
            newPosition = newPosition.replace('top', 'bottom');

        } else if ((relOffset.top + relHeight + eHeight) > wHeight) {
            newPosition = newPosition.replace('bottom', 'top');
        }

        if ((relOffset.left - eWidth) < 0) {
            newPosition = newPosition.replace('left', 'right');

        } else if ((relOffset.left + relWidth + eWidth) > wWidth) {
            newPosition = newPosition.replace('right', 'left');
        }

        if (position !== newPosition) {
            this.removeClass(position)
                .addClass(newPosition)
                .data('new-position', newPosition);

            position = newPosition;
        }

        // Shift around based on edge positioning
        var parts = position.split('-'),
            edge = { y: parts[0], x: parts[1] };

        if (edge.y === 'top') {
            offset.top -= eHeight;
        } else if (edge.y === 'bottom') {
            offset.top += relHeight;
        } else if (edge.y === 'center') {
            offset.top -= Math.round((eHeight / 2) - (relHeight / 2));
        }

        if (edge.x === 'left') {
            offset.left -= eWidth;
        } else if (edge.x === 'right') {
            offset.left += relWidth;
        } else if (edge.x === 'center') {
            offset.left -= Math.round((eWidth / 2) - (relWidth / 2));
        }

        // Increase the offset in case we are following the mouse cursor
        // We need to leave some padding for the literal cursor to not cause a flicker
        if (isMouse) {
            if (edge.y === 'center') {
                if (edge.x === 'left') {
                    offset.left -= 15;
                } else if (edge.x === 'right') {
                    offset.left += 15;
                }
            }

            if (edge.x === 'center') {
                if (edge.y === 'top') {
                    offset.top -= 10;
                } else if (edge.y === 'bottom') {
                    offset.top += 10;
                }
            }
        }

        return this.css(offset);
    };

    Toolkit.Tooltip = Toolkit.Component.extend({
        name: 'Tooltip',
        version: '1.5.0',

        /** The element to insert the title. */
        elementHead: null,

        /** The element to insert the content. */
        elementBody: null,

        /**
         * Initialize the tooltip.
         *
         * @param {jQuery} nodes
         * @param {Object} [options]
         */
        constructor: function(nodes, options) {
            var element, key = this.keyName;

            this.options = options = this.setOptions(options);
            this.element = element = this.createElement()
                .attr('role', 'tooltip')
                .removeClass(options.className);

            // Remove title attributes
            if (options.getTitle === 'title') {
                options.getTitle = 'data-' + key + '-title';
            }

            // Elements for the title and content
            this.elementHead = element.find('[data-' + key + '-header]');
            this.elementBody = element.find('[data-' + key + '-content]');

            // Nodes found in the page on initialization, remove title attribute
            this.nodes = $(nodes).each(function(i, node) {
                $(node).attr('data-' + key + '-title', $(node).attr('title')).removeAttr('title');
            });

            // Initialize events
            this.events = {
                '{mode} document {selector}': 'onShow'
            };

            if (options.mode === 'click') {
                this.events['clickout element'] = 'hide';
                this.events['clickout document {selector}'] = 'hide';
            } else {
                this.events['mouseleave document {selector}'] = 'hide';
            }

            this.initialize();
        },

        /**
         * Hide the tooltip.
         */
        hide: function() {
            var options = this.options,
                element = this.element,
                position = element.data('new-position') || this.runtime.position || options.position,
                className = this.runtime.className || options.className;

            this.runtime = {};

            this.fireEvent('hiding');

            element
                .removeClass(position)
                .removeClass(className)
                .removeData('new-position')
                .conceal();

            if (this.node) {
                this.node.removeAttr('aria-describedby');
            }

            this.fireEvent('hidden');
        },

        /**
         * Positions the tooltip relative to the current node or the mouse cursor.
         * Additionally will apply the title/content and hide/show if necessary.
         *
         * @param {String|jQuery} [content]
         * @param {String|jQuery} [title]
         */
        position: function(content, title) {
            var options = $.isEmptyObject(this.runtime) ? this.options : this.runtime;

            // AJAX is currently loading
            if (content === true) {
                return;
            }

            this.fireEvent('showing');

            // Add position class
            this.element
                .addClass(options.position)
                .addClass(options.className);

            // Set ARIA
            if (this.node) {
                this.node.aria('describedby', this.id());
            }

            // Set title
            title = title || this.readValue(this.node, options.getTitle);

            if (title && options.showTitle) {
                this.elementHead.html(title).show();
            } else {
                this.elementHead.hide();
            }

            // Set body
            if (content) {
                this.elementBody.html(content).show();
            } else {
                this.elementBody.hide();
            }

            this.fireEvent('load', [content]);

            // Follow the mouse
            if (options.follow) {
                var follow = this.onFollow.bind(this);

                this.node
                    .off('mousemove', follow)
                    .on('mousemove', follow);

                this.fireEvent('shown');

                // Position accordingly
            } else {
                this.element.positionTo(options.position, this.node, {
                    left: options.xOffset,
                    top: options.yOffset
                });

                setTimeout(function() {
                    this.element.reveal();
                    this.fireEvent('shown');
                }.bind(this), options.delay || 0);
            }
        },

        /**
         * Show the tooltip and determine whether to grab the content from an AJAX call,
         * a DOM node, or plain text. The content and title can also be passed as arguments.
         *
         * @param {jQuery} node
         * @param {String|jQuery} [content]
         * @param {String|jQuery} [title]
         */
        show: function(node, content, title) {
            var options;

            if (node) {
                this.node = node = $(node);
                this.runtime = options = this.inheritOptions(this.options, node);

                content = content || this.readValue(node, options.getContent);
            } else {
                this.runtime = options = this.options;
            }

            if (!content) {
                return;

            } else if (content.match(/^#[a-z0-9_\-\.:]+$/i)) {
                content = $(content).html();
                options.ajax = false;
            }

            if (options.ajax) {
                if (this.cache[content]) {
                    this.position(this.cache[content], title);
                } else {
                    if (options.showLoading) {
                        this.position(Toolkit.messages.loading);
                    }

                    this.requestData(content);
                }
            } else {
                this.position(content, title);
            }
        },

        /**
         * Event handler for positioning the tooltip by the mouse.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onFollow: function(e) {
            e.preventDefault();

            var options = this.runtime;

            this.element.positionTo(options.position, e, {
                left: options.xOffset,
                top: options.yOffset
            }, true).reveal();
        }

    }, {
        mode: 'hover',
        animation: 'fade',
        ajax: false,
        follow: false,
        position: 'top-center',
        showLoading: true,
        showTitle: true,
        getTitle: 'title',
        getContent: 'data-tooltip',
        mouseThrottle: 50,
        xOffset: 0,
        yOffset: 0,
        delay: 0,
        template: '<div class="tooltip">' +
            '<div class="tooltip-inner">' +
            '<div class="tooltip-head" data-tooltip-header></div>' +
            '<div class="tooltip-body" data-tooltip-content></div>' +
            '</div>' +
            '<div class="tooltip-arrow"></div>' +
            '</div>'
    });

    Toolkit.create('tooltip', function(options) {
        return new Toolkit.Tooltip(this, options);
    }, true);

    Toolkit.Popover = Toolkit.Tooltip.extend({
        name: 'Popover',
        version: '1.5.0',

        /**
         * Initialize the popover.
         *
         * @param {jQuery} nodes
         * @param {Object} [options]
         */
        constructor: function(nodes, options) {
            options = options || {};
            options.mode = 'click'; // Click only
            options.follow = false; // Disable mouse follow

            Toolkit.Tooltip.prototype.constructor.call(this, nodes, options);
        }

    }, {
        getContent: 'data-popover',
        template: '<div class="popover">' +
            '<div class="popover-inner">' +
            '<div class="popover-head" data-popover-header></div>' +
            '<div class="popover-body" data-popover-content></div>' +
            '</div>' +
            '<div class="popover-arrow"></div>' +
            '</div>'
    });

    Toolkit.create('popover', function(options) {
        return new Toolkit.Popover(this, options);
    }, true);

    Toolkit.Showcase = Toolkit.Component.extend({
        name: 'Showcase',
        version: '1.5.0',

        /** Is the showcase currently animating? */
        animating: false,

        /** Blackout instance if enabled. */
        blackout: null,

        /** The caption element. */
        caption: null,

        /** Items gathered when node is activated. */
        data: [],

        /** Current index of the item being shown. */
        index: -1,

        /** The wrapping items element. */
        items: [],

        /** The wrapping tabs element. */
        tabs: [],

        /**
         * Initialize the showcase.
         *
         * @param {jQuery} nodes
         * @param {Object} [options]
         */
        constructor: function(nodes, options) {
            var element;

            this.options = options = this.setOptions(options);
            this.element = element = this.createElement();

            // Nodes found in the page on initialization
            this.nodes = $(nodes);

            // The wrapping items element
            this.items = element.find('[data-showcase-items]');

            // The wrapping tabs element
            this.tabs = element.find('[data-showcase-tabs]');

            // The caption element
            this.caption = element.find('[data-showcase-caption]');

            // Blackout element if enabled
            if (options.blackout) {
                this.blackout = Toolkit.Blackout.instance();
            }

            // Initialize events
            this.events = {
                'clickout element': 'onHide',
                'clickout document {selector}': 'onHide',
                'swipeleft element': 'next',
                'swiperight element': 'prev',
                'keydown window': 'onKeydown',
                'click document {selector}': 'onShow',
                'click element [data-showcase-close]': 'hide',
                'click element [data-showcase-next]': 'next',
                'click element [data-showcase-prev]': 'prev',
                'click element [data-showcase-tabs] a': 'onJump'
            };

            // Stop `transitionend` events from bubbling up when the showcase is resized
            this.events[Toolkit.transitionEnd + ' element [data-showcase-items]'] = function(e) {
                e.stopPropagation();
            };

            this.initialize();
        },

        /**
         * Hide the showcase and reset inner elements.
         */
        hide: function() {
            this.fireEvent('hiding');

            if (this.blackout) {
                this.blackout.hide();
            }

            if (this.options.stopScroll) {
                $('body').removeClass('no-scroll');
            }

            this.element
                .conceal()
                .removeClass('is-single');

            this.items
                .removeAttr('style')
                .children('li')
                .conceal();

            this.fireEvent('hidden');
        },

        /**
         * Jump to a specific item indicated by the index number.
         * If the index is too large, jump to the beginning.
         * If the index is too small, jump to the end.
         *
         * @param {Number} index
         */
        jump: function(index) {
            if (this.animating) {
                return;
            }

            index = $.bound(index, this.data.length);

            // Exit since transitions don't occur
            if (index === this.index) {
                return;
            }

            var self = this,
                element = this.element,
                caption = this.caption,
                list = this.items,
                listItems = list.children('li'),
                listItem = listItems.eq(index),
                items = this.data,
                item = items[index],
                deferred = $.Deferred();

            this.fireEvent('jumping', [this.index]);

            // Update tabs
            this.tabs.find('a')
                .removeClass('is-active')
                .eq(index)
                .addClass('is-active');

            // Reset previous styles
            listItems.conceal();
            caption.conceal();
            element
                .addClass('is-loading')
                .aria('busy', true);

            // Setup deferred callbacks
            this.animating = true;

            deferred.always(function(width, height) {
                list.transitionend(function() {
                    caption.html(item.title).reveal();
                    listItem.reveal();
                    self.position();
                    self.animating = false;
                });

                self._resize(width, height);

                element
                    .removeClass('is-loading')
                    .aria('busy', false);

                listItem
                    .data('width', width)
                    .data('height', height);
            });

            deferred.fail(function() {
                element.addClass('has-failed');
                listItem.html(Toolkit.messages.error);
            });

            // Image already exists
            if (listItem.data('width')) {
                deferred.resolve(listItem.data('width'), listItem.data('height'));

                // Create image and animate
            } else {
                var img = new Image();
                img.src = item.image;
                img.onerror = function() {
                    deferred.reject(150, 150);
                };
                img.onload = function() {
                    deferred.resolve(this.width, this.height);
                    listItem.append(img);
                };
            }

            // Save state
            this.index = index;

            this.fireEvent('jumped', [index]);
        },

        /**
         * Go to the next item.
         */
        next: function() {
            this.jump(this.index + 1);
        },

        /**
         * Position the element in the middle of the screen.
         */
        position: function() {
            this.fireEvent('showing');

            if (this.blackout) {
                this.blackout.hideLoader();
            }

            this.element.reveal();

            this.fireEvent('shown');
        },

        /**
         * Go to the previous item.
         */
        prev: function() {
            this.jump(this.index - 1);
        },

        /**
         * Reveal the showcase after scraping for items data.
         * Will scrape data from the activating node.
         * If a category exists, scrape data from multiple nodes.
         *
         * @param {Element} node
         */
        show: function(node) {
            this.node = node = $(node);
            this.index = -1;
            this.element
                .addClass('is-loading')
                .aria('busy', true);

            var options = this.inheritOptions(this.options, node),
                read = this.readValue,
                category = read(node, options.getCategory),
                items = [],
                index = 0;

            // Multiple items based on category
            if (category) {
                for (var i = 0, x = 0, n; n = this.nodes[i]; i++) {
                    if (read(n, options.getCategory) === category) {
                        if (node.is(n)) {
                            index = x;
                        }

                        items.push({
                            title: read(n, options.getTitle),
                            category: category,
                            image: read(n, options.getImage)
                        });

                        x++;
                    }
                }

                // Single item
            } else {
                items.push({
                    title: read(node, options.getTitle),
                    category: category,
                    image: read(node, options.getImage)
                });
            }

            if (this.blackout) {
                this.blackout.show();
            }

            if (options.stopScroll) {
                $('body').addClass('no-scroll');
            }

            this._buildItems(items);
            this.jump(index);
        },

        /**
         * Build the list of items and tabs based on the generated data.
         * Determine which elements to show and bind based on the data.
         *
         * @private
         * @param {Array} items
         */
        _buildItems: function(items) {
            this.data = items;
            this.items.empty();
            this.tabs.empty();

            for (var li, a, item, i = 0; item = items[i]; i++) {
                li = $('<li/>');
                li.appendTo(this.items);

                a = $('<a/>')
                    .attr('href', 'javascript:;')
                    .data('index', i);

                li = $('<li/>');
                li.appendTo(this.tabs).append(a);
            }

            if (items.length <= 1) {
                this.element.addClass('is-single');
            }

            this.fireEvent('load', [items]);
        },

        /**
         * Resize the showcase modal when it is larger than the current viewport.
         *
         * @private
         * @param {Number} width
         * @param {Number} height
         */
        _resize: function(width, height) {
            var gutter = (this.options.gutter * 2),
                wWidth = $(window).width() - gutter,
                wHeight = $(window).height() - gutter,
                ratio,
                diff;

            // Resize if the width is larger
            if (width > wWidth) {
                ratio = (width / height);
                diff = (width - wWidth);

                width = wWidth;
                height -= Math.round(diff / ratio);
            }

            // Resize again if the height is larger
            if (height > wHeight) {
                ratio = (height / width);
                diff = (height - wHeight);

                width -= Math.round(diff / ratio);
                height = wHeight;
            }

            this.items.css({
                width: width,
                height: height
            });
        },

        /**
         * Event handler for hide().
         *
         * @private
         * @param {jQuery.Event} e
         */
        onHide: function(e) {
            e.preventDefault();

            var element = this.element;

            // If the showcase is loading (AJAX) or is not shown, exit early
            // This stops cases where the blackout can be clicked early
            if (!element.is(':shown') || element.hasClass('is-loading')) {
                return;
            }

            this.hide();
        },

        /**
         * Event handler for jumping between items.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onJump: function(e) {
            e.preventDefault();

            this.jump($(e.target).data('index') || 0);
        },

        /**
         * Event handle for keyboard events.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onKeydown: function(e) {
            if (this.element.is(':shown')) {
                if ($.inArray(e.keyCode, [37, 38, 39, 40]) >= 0) {
                    e.preventDefault();
                }

                switch (e.keyCode) {
                    case 27: this.hide(); break;
                    case 37: this.prev(); break;
                    case 38: this.jump(0); break;
                    case 39: this.next(); break;
                    case 40: this.jump(-1); break;
                }
            }
        }

    }, {
        blackout: true,
        stopScroll: true,
        gutter: 50,
        getCategory: 'data-showcase',
        getImage: 'href',
        getTitle: 'title',
        template: '<div class="showcase">' +
            '<div class="showcase-inner">' +
            '<ul class="showcase-items" data-showcase-items></ul>' +
            '<ol class="showcase-tabs bullets" data-showcase-tabs></ol>' +
            '<button class="showcase-prev" data-showcase-prev><span class="arrow-left"></span></button>' +
            '<button class="showcase-next" data-showcase-next><span class="arrow-right"></span></button>' +
            '</div>' +
            '<button class="showcase-close" data-showcase-close><span class="x"></span></button>' +
            '<div class="showcase-caption" data-showcase-caption></div>' +
            '</div>'
    });

    Toolkit.create('showcase', function(options) {
        return new Toolkit.Showcase(this, options);
    }, true);

    Toolkit.Stalker = Toolkit.Component.extend({
        name: 'Stalker',
        version: '1.4.0',

        /** Container to monitor scroll events on. */
        container: $(window),

        /** Targets to active when a marker is reached. */
        targets: [],

        /** Markers to compare against. */
        markers: [],

        /** Top value for all markers. */
        offsets: [],

        /**
         * Initialize the stalker.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            this.element = element = $(element);
            this.options = options = this.setOptions(options);

            if (!options.target || !options.marker) {
                throw new Error('A marker and target is required');
            }

            if (element.css('overflow') === 'auto') {
                this.container = element;
            }

            // Initialize events
            this.events = {
                'scroll container': $.throttle(this.onScroll.bind(this), options.throttle),
                'ready document': 'onScroll'
            };

            this.initialize();

            // Gather markets and targets
            this.refresh();
        },

        /**
         * Remove classes before destroying.
         */
        destructor: function() {
            var targets = this.targets,
                markers = this.markers;

            if (this.options.applyToParent) {
                targets.parent().removeClass('is-active');
                markers.parent().removeClass('is-marked');
            } else {
                targets.removeClass('is-active');
                markers.removeClass('is-marked');
            }
        },

        /**
         * Activate a target when a marker is entered.
         *
         * @param {Element} marker
         */
        activate: function(marker) {
            this.stalk(marker, 'activate');
        },

        /**
         * Deactivate a target when a marker is exited.
         *
         * @param {Element} marker
         */
        deactivate: function(marker) {
            this.stalk(marker, 'deactivate');
        },

        /**
         * Either active or deactivate a target based on the marker.
         *
         * @param {Element} marker
         * @param {String} type
         */
        stalk: function(marker, type) {
            marker = $(marker);

            // Stop all the unnecessary processing
            if (type === 'activate' && marker.hasClass('is-stalked')) {
                return;
            }

            var options = this.options,
                targetBy = options.targetBy,
                markBy = options.markBy,
                target = this.targets.filter(function() {
                    return $(this).attr(targetBy).replace('#', '') === marker.attr(markBy);
                }),
                before,
                after,
                method;

            if (type === 'activate') {
                before = 'activating';
                after = 'activated';
                method = 'addClass';
            } else {
                before = 'deactivating';
                after = 'deactivated';
                method = 'removeClass';
            }

            this.fireEvent(before, [marker, target]);

            marker[method]('is-stalked');

            if (options.applyToParent) {
                target.parent()[method]('is-active');
            } else {
                target[method]('is-active');
            }

            this.fireEvent(after, [marker, target]);
        },

        /**
         * Gather the targets and markers used for stalking.
         */
        refresh: function() {
            var isWindow = this.container.is(window),
                eTop = this.element.offset().top,
                offset,
                offsets = [];

            if (this.element.css('overflow') === 'auto' && !this.element.is('body')) {
                this.element[0].scrollTop = 0; // Set scroll to top so offsets are correct
            }

            this.targets = $(this.options.target);

            this.markers = $(this.options.marker).each(function(index, marker) {
                offset = $(marker).offset();

                if (!isWindow) {
                    offset.top -= eTop;
                }

                offsets.push(offset);
            });

            this.offsets = offsets;
        },

        /**
         * While the element is being scrolled, notify the targets when a marker is reached.
         *
         * @private
         */
        onScroll: function() {
            var scroll = this.container.scrollTop(),
                offsets = this.offsets,
                onlyWithin = this.options.onlyWithin,
                threshold = this.options.threshold;

            this.markers.each(function(index, marker) {
                marker = $(marker);

                var offset = offsets[index],
                    top = offset.top - threshold,
                    bot = offset.top + marker.height() + threshold;

                // Scroll is within the marker
                if (
                    (onlyWithin && scroll >= top && scroll <= bot) ||
                        (!onlyWithin && scroll >= top)
                    ) {
                    this.activate(marker);

                    // Scroll went outside the marker
                } else {
                    this.deactivate(marker);
                }
            }.bind(this));

            this.fireEvent('scroll');
        }

    }, {
        target: '',
        targetBy: 'href',
        marker: '',
        markBy: 'id',
        threshold: 50,
        throttle: 50,
        onlyWithin: true,
        applyToParent: true
    });

    Toolkit.create('stalker', function(options) {
        return new Toolkit.Stalker(this, options);
    });

    Toolkit.Tab = Toolkit.Component.extend({
        name: 'Tab',
        version: '1.4.0',

        /** Index of the section currently displayed. */
        index: 0,

        /** Navigation element that contains the tabs. */
        nav: null,

        /** Collection of sections to toggle. */
        sections: [],

        /** Collection of tabs to trigger toggle. */
        tabs: [],

        /**
         * Initialize the tab.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            var sections, tabs, self = this;

            this.element = element = $(element);
            this.options = options = this.setOptions(options, element);

            // Determine cookie name
            if (!options.cookie) {
                options.cookie = element.attr('id');
            }

            // Find all the sections and set ARIA attributes
            this.sections = sections = element.find('[data-tab-section]').each(function(index, section) {
                section = $(section);
                section
                    .attr('role', 'tabpanel')
                    .attr('id', section.attr('id') || self.id('section', index))
                    .aria('labelledby', self.id('tab', index))
                    .conceal();
            });

            // Find the nav and set ARIA attributes
            this.nav = element.find('[data-tab-nav]')
                .attr('role', 'tablist');

            // Find the tabs within the nav and set ARIA attributes
            this.tabs = tabs = this.nav.find('a').each(function(index) {
                $(this)
                    .data('tab-index', index)
                    .attr({
                        role: 'tab',
                        id: self.id('tab', index)
                    })
                    .aria({
                        controls: sections.eq(index).attr('id'),
                        selected: false,
                        expanded: false
                    })
                    .removeClass('is-active');
            });

            // Initialize events
            this.events = {
                '{mode} element [data-tab-nav] a': 'onShow'
            };

            if (options.mode !== 'click' && options.preventDefault) {
                this.events['click element [data-tab-nav] a'] = function(e) {
                    e.preventDefault();
                };
            }

            this.initialize();

            // Trigger default tab to display
            var index = null;

            if (options.persistState) {
                if (options.cookie && $.cookie) {
                    index = $.cookie('toolkit.tab.' + options.cookie);
                }

                if (index === null && options.loadFragment && location.hash) {
                    index = tabs.filter(function() {
                        return ($(this).attr('href') === location.hash);
                    }).eq(0).data('tab-index');
                }
            }

            if (!tabs[index]) {
                index = options.defaultIndex;
            }

            this.jump(index);
        },

        /**
         * Reveal the last section when destroying.
         */
        destructor: function() {
            this.sections.eq(this.index).reveal();
        },

        /**
         * Hide all sections.
         */
        hide: function() {
            this.fireEvent('hiding');

            this.sections.conceal();

            this.fireEvent('hidden');
        },

        /**
         * Jump to a specific tab via index.
         *
         * @param {Number} index
         */
        jump: function(index) {
            this.show(this.tabs[$.bound(index, this.tabs.length)]);
        },

        /**
         * Show the content based on the tab. Can either pass an integer as the index in the collection,
         * or pass an element object for a tab in the collection.
         *
         * @param {jQuery} tab
         */
        show: function(tab) {
            tab = $(tab);

            var index = tab.data('tab-index'),
                section = this.sections.eq(index),
                options = this.options,
                ajax = this.readOption(tab, 'ajax'),
                url = this.readValue(tab, this.readOption(tab, 'getUrl'));

            this.fireEvent('showing', [this.index]);

            // Load content with AJAX
            if (ajax && url && url.substr(0, 1) !== '#' && !this.cache[url]) {
                this.requestData(url,
                    function() {
                        section
                            .html(Toolkit.messages.loading)
                            .addClass('is-loading')
                            .aria('busy', true);
                    },
                    function(response) {
                        if (options.cache) {
                            this.cache[url] = true;
                        }

                        this.fireEvent('load', [response]);

                        section
                            .html(response)
                            .removeClass('is-loading')
                            .aria('busy', false);
                    },
                    function() {
                        section
                            .html(Toolkit.messages.error)
                            .removeClass('is-loading')
                            .addClass('has-failed')
                            .aria('busy', false);
                    }
                );
            }

            // Toggle tabs
            this.tabs
                .aria('toggled', false)
                .parent()
                .removeClass('is-active');

            // Toggle sections
            if (index === this.index && options.collapsible) {
                if (section.is(':shown')) {
                    section.conceal();

                } else {
                    tab.aria('toggled', true).parent().addClass('is-active');
                    section.reveal();
                }
            } else {
                this.hide();

                tab.aria('toggled', true).parent().addClass('is-active');
                section.reveal();
            }

            // Persist the state using a cookie
            if (options.persistState && $.cookie) {
                $.cookie('toolkit.tab.' + options.cookie, index, {
                    expires: options.cookieDuration
                });
            }

            this.index = index;
            this.node = tab;

            this.fireEvent('shown', [index]);
        },

        /**
         * Event callback for tab element click.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onShow: function(e) {
            if (this.options.preventDefault || (this.options.ajax && e.currentTarget.getAttribute('href').substr(0, 1) !== '#')) {
                e.preventDefault();
            }

            this.show(e.currentTarget);
        }

    }, {
        mode: 'click',
        ajax: false,
        collapsible: false,
        defaultIndex: 0,
        persistState: false,
        preventDefault: true,
        loadFragment: true,
        cookie: null,
        cookieDuration: 30,
        getUrl: 'href'
    });

    Toolkit.create('tab', function(options) {
        return new Toolkit.Tab(this, options);
    });

    Toolkit.Toast = Toolkit.Component.extend({
        name: 'Toast',
        version: '1.5.0',

        /**
         * Initialize the toast.
         *
         * @param {jQuery} element
         * @param {Object} [options]
         */
        constructor: function(element, options) {
            this.options = options = this.setOptions(options);
            this.element = this.createElement()
                .addClass(options.position)
                .removeClass(options.animation)
                .attr('role', 'log')
                .aria({
                    relevant: 'additions',
                    hidden: 'false'
                })
                .appendTo(element)
                .reveal();

            this.initialize();
        },

        /**
         * Create a toast element, insert content into it, and append it to the container.
         *
         * @param {*} content
         * @param {Object} [options]
         */
        create: function(content, options) {
            options = $.extend({}, this.options, options || {});

            var self = this,
                toast = $(options.toastTemplate)
                    .addClass(options.animation)
                    .attr('role', 'note')
                    .html(content)
                    .conceal()
                    .prependTo(this.element);

            this.fireEvent('create', [toast]);

            // Set a timeout to trigger show transition
            setTimeout(function() {
                self.show(toast);
            }, 15); // IE needs a minimum of 15

            // Set a timeout to remove the toast
            if (options.duration) {
                setTimeout(function() {
                    self.hide(toast);
                }, options.duration + 15);
            }
        },

        /**
         * Hide the toast after the duration is up.
         * Also remove the element from the DOM once the transition is complete.
         *
         * @param {jQuery} element
         */
        hide: function(element) {
            element = $(element);

            // Pass the element since it gets removed
            this.fireEvent('hiding', [element]);

            element.transitionend(function() {
                element.remove();
                this.fireEvent('hidden');
            }.bind(this)).conceal();
        },

        /**
         * Reveal the toast after it has been placed in the container.
         *
         * @param {jQuery} element
         */
        show: function(element) {
            element = $(element);

            this.fireEvent('showing', [element]);

            element.reveal();

            this.fireEvent('shown', [element]);
        }

    }, {
        position: 'bottom-left',
        animation: 'slide-up',
        duration: 5000,
        template: '<aside class="toasts"></aside>',
        toastTemplate: '<div class="toast"></div>'
    });

    Toolkit.create('toast', function(options) {
        return new Toolkit.Toast(this, options);
    });

    Toolkit.TypeAhead = Toolkit.Component.extend({
        name: 'TypeAhead',
        version: '1.4.0',

        /** Current index in the drop menu while cycling. */
        index: -1,

        /** The input field to listen against. */
        input: null,

        /** List of item data to render in the drop menu. */
        items: [],

        /** The shadow input field. */
        shadow: null,

        /** Current term in the input field to match against. */
        term: '',

        /** Lookup throttle timer. */
        timer: null,

        /** The element that wraps the input when `shadow` is enabled. */
        wrapper: null,

        /**
         * Initialize the type ahead.
         *
         * @param {jQuery} input
         * @param {Object} [options]
         */
        constructor: function(input, options) {
            input = $(input);

            if (input.prop('tagName').toLowerCase() !== 'input') {
                throw new Error('TypeAhead must be initialized on an input field');
            }

            var self = this;

            this.options = options = this.setOptions(options, input);
            this.element = this.createElement()
                .attr('role', 'listbox')
                .aria('multiselectable', false);

            // The input field to listen against
            this.input = input;

            // Use default callbacks
            $.each({ sorter: 'sort', matcher: 'match', builder: 'build' }, function(key, fn) {
                if (options[key] === false) {
                    return;
                }

                var callback;

                if (options[key] === null || $.type(options[key]) !== 'function') {
                    callback = self[fn];
                } else {
                    callback = options[key];
                }

                options[key] = callback.bind(self);
            });

            // Prefetch source data from URL
            if (options.prefetch && $.type(options.source) === 'string') {
                var url = options.source;

                $.getJSON(url, options.query, function(items) {
                    self.cache[url] = items;
                });
            }

            // Enable shadow inputs
            if (options.shadow) {
                this.wrapper = $(this.options.shadowTemplate);

                this.shadow = this.input.clone()
                    .addClass('is-shadow')
                    .removeAttr('id')
                    .prop('readonly', true)
                    .aria('readonly', true);

                this.input
                    .addClass('not-shadow')
                    .replaceWith(this.wrapper);

                this.wrapper
                    .append(this.shadow)
                    .append(this.input);
            }

            // Set ARIA after shadow so that attributes are not inherited
            input
                .attr({
                    autocomplete: 'off',
                    autocapitalize: 'off',
                    autocorrect: 'off',
                    spellcheck: 'false',
                    role: 'combobox'
                })
                .aria({
                    autocomplete: 'list',
                    owns: this.element.attr('id'),
                    expanded: false
                });

            // Initialize events
            this.events = {
                'keyup input': 'onLookup',
                'keydown input': 'onCycle',
                'clickout element': 'hide'
            };

            this.initialize();
        },

        /**
         * Remove the shadow before destroying.
         */
        destructor: function() {
            if (this.shadow) {
                this.shadow.parent().replaceWith(this.input);
                this.input.removeClass('not-shadow');
            }
        },

        /**
         * Build the anchor link that will be used in the list.
         *
         * @param {Object} item
         * @returns {jQuery}
         */
        build: function(item) {
            var a = $('<a/>', {
                href: 'javascript:;',
                role: 'option',
                'aria-selected': 'false'
            });

            a.append( $(this.options.titleTemplate).html(this.highlight(item.title)) );

            if (item.description) {
                a.append( $(this.options.descTemplate).html(item.description) );
            }

            return a;
        },

        /**
         * Hide the list and reset shadow.
         */
        hide: function() {
            this.fireEvent('hiding');

            if (this.shadow) {
                this.shadow.val('');
            }

            this.input.aria('expanded', false);
            this.element.conceal();

            this.fireEvent('hidden');
        },

        /**
         * Highlight the current term within the item string.
         * Split multi-word terms to highlight separately.
         *
         * @param {String} item
         * @returns {String}
         */
        highlight: function(item) {
            var terms = this.term.replace(/[\-\[\]\{\}()*+?.,\\^$|#]/g, '\\$&').split(' '),
                options = this.options,
                callback = function(match) {
                    return $(options.highlightTemplate).html(match).prop('outerHTML');
                };

            for (var i = 0, t; t = terms[i]; i++) {
                item = item.replace(new RegExp(t, 'ig'), callback);
            }

            return item;
        },

        /**
         * Load the list of items to use for look ups.
         * Trigger different actions depending on the type of source.
         *
         * @param {String} term
         */
        lookup: function(term) {
            this.term = term;
            this.timer = setTimeout(this.onFind.bind(this), this.options.throttle);
        },

        /**
         * Match an item if it contains the term.
         *
         * @param {Object} item
         * @param {String} term
         * @returns {bool}
         */
        match: function(item, term) {
            return (item.title.toLowerCase().indexOf(term.toLowerCase()) >= 0);
        },

        /**
         * Position the menu below the input.
         */
        position: function() {
            if (!this.items.length) {
                this.hide();
                return;
            }

            this.fireEvent('showing');

            var iPos = this.input.offset();

            this.element.css({
                left: iPos.left,
                top: (iPos.top + this.input.outerHeight())
            }).reveal();

            this.input.aria('expanded', true);

            this.fireEvent('shown');
        },

        /**
         * Rewind the cycle pointer to the beginning.
         */
        rewind: function() {
            this.index = -1;
            this.element.find('li').removeClass('is-active');
        },

        /**
         * Select an item in the list.
         *
         * @param {Number} index
         * @param {String} [event]
         */
        select: function(index, event) {
            this.index = index;

            var rows = this.element.find('li');

            rows
                .removeClass('is-active')
                .find('a')
                .aria('selected', false);

            // Select
            if (index >= 0) {
                if (this.items[index]) {
                    var item = this.items[index];

                    rows.eq(index)
                        .addClass('is-active')
                        .find('a')
                        .aria('selected', true);

                    this.input.val(item.title);

                    this.fireEvent(event || 'select', [item, index]);
                }

                // Reset
            } else {
                this.input.val(this.term);

                this.fireEvent('reset');
            }
        },

        /**
         * Sort the items.
         *
         * @param {Array} items
         * @returns {Array}
         */
        sort: function(items) {
            return items.sort(function(a, b) {
                return a.title.localeCompare(b.title);
            });
        },

        /**
         * Process the list of items be generating new elements and positioning below the input.
         *
         * @param {Array} items
         */
        source: function(items) {
            if (!this.term.length || !items.length) {
                this.hide();
                return;
            }

            var options = this.options,
                term = this.term,
                categories = { _empty_: [] },
                item,
                list = $('<ul/>');

            // Reset
            this.items = [];
            this.index = -1;

            // Sort and match the list of items
            if ($.type(options.sorter) === 'function') {
                items = options.sorter(items);
            }

            if ($.type(options.matcher) === 'function') {
                items = items.filter(function(item) {
                    return options.matcher(item, term);
                });
            }

            // Group the items into categories
            for (var i = 0; item = items[i]; i++) {
                if (item.category) {
                    if (!categories[item.category]) {
                        categories[item.category] = [];
                    }

                    categories[item.category].push(item);
                } else {
                    categories._empty_.push(item);
                }
            }

            // Loop through the items and build the markup
            var results = [],
                count = 0;

            $.each(categories, function(category, items) {
                var elements = [];

                if (category !== '_empty_') {
                    results.push(null);

                    elements.push(
                        $(options.headingTemplate).append( $('<span/>', { text: category }) )
                    );
                }

                for (var i = 0, a; item = items[i]; i++) {
                    if (count >= options.itemLimit) {
                        break;
                    }

                    a = options.builder(item);
                    a.on({
                        mouseover: this.rewind.bind(this),
                        click: $.proxy(this.onSelect, this, results.length)
                    });

                    elements.push( $('<li/>').append(a) );
                    results.push(item);
                    count++;
                }

                list.append(elements);
            }.bind(this));

            // Append list
            this.element.empty().append(list);

            // Set the current result set to the items list
            // This will be used for index cycling
            this.items = results;

            // Cache the result set to the term
            // Filter out null categories so that we can re-use the cache
            this.cache[term.toLowerCase()] = results.filter(function(item) {
                return (item !== null);
            });

            this.fireEvent('load');

            // Apply the shadow text
            this._shadow();

            // Position the list
            this.position();
        },

        /**
         * Monitor the current input term to determine the shadow text.
         * Shadow text will reference the term cache.
         *
         * @private
         */
        _shadow: function() {
            if (!this.shadow) {
                return;
            }

            var term = this.input.val(),
                termLower = term.toLowerCase(),
                value = '';

            if (this.cache[termLower] && this.cache[termLower][0]) {
                var title = this.cache[termLower][0].title;

                if (title.toLowerCase().indexOf(termLower) === 0) {
                    value = term + title.substr(term.length, (title.length - term.length));
                }
            }

            this.shadow.val(value);
        },

        /**
         * Cycle through the items in the list when an arrow key, esc or enter is released.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onCycle: function(e) {
            var items = this.items,
                length = Math.min(this.options.itemLimit, Math.max(0, items.length)),
                event = 'cycle';

            if (!length || !this.element.is(':shown')) {
                return;
            }

            switch (e.keyCode) {
                // Cycle upwards (up)
                case 38:
                    this.index -= (items[this.index - 1] ? 1 : 2); // category check

                    if (this.index < 0) {
                        this.index = length;
                    }
                    break;

                // Cycle downwards (down)
                case 40:
                    this.index += (items[this.index + 1] ? 1 : 2); // category check

                    if (this.index >= length) {
                        this.index = -1;
                    }
                    break;

                // Select first (tab)
                case 9:
                    e.preventDefault();

                    var i = 0;

                    while (!this.items[i]) {
                        i++;
                    }

                    event = 'select';
                    this.index = i;
                    this.hide();
                    break;

                // Select current index (enter)
                case 13:
                    e.preventDefault();

                    event = 'select';
                    this.hide();
                    break;

                // Reset (esc)
                case 27:
                    this.index = -1;
                    this.hide();
                    break;

                // Cancel others
                default:
                    return;
            }

            if (this.shadow) {
                this.shadow.val('');
            }

            // Select the item
            this.select(this.index, event);
        },

        /**
         * Event handler called for a lookup.
         */
        onFind: function() {
            var term = this.term,
                options = this.options,
                sourceType = $.type(options.source);

            // Check the cache first
            if (this.cache[term.toLowerCase()]) {
                this.source(this.cache[term.toLowerCase()]);

                // Use the response of an AJAX request
            } else if (sourceType === 'string') {
                var url = options.source,
                    cache = this.cache[url];

                if (cache) {
                    this.source(cache);
                } else {
                    var query = options.query;
                    query.term = term;

                    $.getJSON(url, query, this.source.bind(this));
                }

                // Use a literal array list
            } else if (sourceType === 'array') {
                this.source(options.source);

                // Use the return of a function
            } else if (sourceType === 'function') {
                var response = options.source.call(this);

                if (response) {
                    this.source(response);
                }
            } else {
                throw new Error('Invalid TypeAhead source type');
            }
        },

        /**
         * Lookup items based on the current input value.
         *
         * @private
         * @param {jQuery.Event} e
         */
        onLookup: function(e) {
            if ($.inArray(e.keyCode, [38, 40, 27, 9, 13]) >= 0) {
                return; // Handle with onCycle()
            }

            clearTimeout(this.timer);

            var term = this.input.val().trim();

            if (term.length < this.options.minLength) {
                this.fireEvent('reset');
                this.hide();

            } else {
                this._shadow();
                this.lookup(term);
            }
        },

        /**
         * Event handler to select an item from the list.
         *
         * @private
         * @param {Number} index
         */
        onSelect: function(index) {
            this.select(index);
            this.hide();
        }

    }, {
        source: [],
        minLength: 1,
        itemLimit: 15,
        throttle: 250,
        prefetch: false,
        shadow: false,
        query: {},
        template: '<div class="type-ahead"></div>',
        shadowTemplate: '<div class="type-ahead-shadow"></div>',
        titleTemplate: '<span class="type-ahead-title"></span>',
        descTemplate: '<span class="type-ahead-desc"></span>',
        highlightTemplate: '<mark class="type-ahead-highlight"></mark>',
        headingTemplate: '<li class="type-ahead-heading"></li>',

        // Callbacks
        sorter: null,
        matcher: null,
        builder: null
    });

    Toolkit.create('typeAhead', function(options) {
        return new Toolkit.TypeAhead(this, options);
    });

})(jQuery);