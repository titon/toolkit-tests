<?php

date_default_timezone_set('UTC');

function value($value, $default = '') {
    return isset($_GET[$value]) ? $_GET[$value] : $default;
}

function string($value, $default = '') {
    echo sprintf("'%s'", value($value, $default));
}

function number($value, $default = 0) {
    echo (int) value($value, $default);
}

function bool($value, $default = true) {
    echo value($value, $default, true) ? 'true' : 'false';
}

function color() {
    $colors = array('4c6278', '42586e', '344a5f', '293f54', '283442');

    return $colors[rand(0, 4)];
}

$shapes = array(
    '' => 'Square (Default)',
    'round' => 'Round',
    'pill' => 'Pill',
    'oval' => 'Oval',
    'skew' => 'Skew'
);

$sizes = array(
    'small' => 'Small',
    '' => 'Medium',
    'large' => 'Large'
);

$states = array(
    '' => 'Default',
    'is-info' => 'Info',
    'is-warning' => 'Warning',
    'is-success' => 'Success',
    'is-error' => 'Error'
);

$effects = array(
    '' => '-- None --',
    'visual-gloss' => 'Gloss',
    'visual-reflect' => 'Reflect',
    'visual-glare' => 'Glare',
    'visual-popout' => 'Popout'
);

$unsupported = array(
    'mootools' => array('off-canvas', 'toast')
);

$components = array(
    'home' => array(
        'title' => 'Introduction'
    ),
    'base' => array(
        'title' => 'Base',
        'css' => 'layout/typography.css',
    ),
    'accordion' => array(
        'title' => 'Accordion',
        'css' => 'components/accordion.css',
        'js' => array('components/Accordion.js'),
        'filters' => array(
            'mode' => array('title' => 'Mode', 'data' => array('click' => 'Click', 'hover' => 'Hover')),
            'defaultIndex' => array('title' => 'Default Index', 'type' => 'number', 'default' => 0),
            'multiple' => array('title' => 'Multiple?', 'type' => 'boolean'),
            'collapsible' => array('title' => 'Collapsible?', 'type' => 'boolean')
        )
    ),
    'breadcrumb' => array(
        'title' => 'Breadcrumb',
        'css' => array('components/breadcrumb.css'),
        'filters' => array(
            'size' => array('title' => 'Size', 'data' => $sizes),
        )
    ),
    'button' => array(
        'title' => 'Button',
        'css' => array('components/button.css'),
        'filters' => array(
            'size' => array('title' => 'Size', 'data' => $sizes),
            'state' => array('title' => 'State', 'data' => $states),
            'shape' => array('title' => 'Shape', 'data' => $shapes),
            'effect' => array('title' => 'Effect', 'data' => $effects),
            'disabled' => array('title' => 'Disabled?', 'type' => 'boolean'),
            'active' => array('title' => 'Active?', 'type' => 'boolean')
        )
    ),
    'button-group' => array(
        'title' => 'Button Group',
        'css' => array('components/button.css', 'components/button-group.css'),
        'filters' => array(
            'count' => array('title' => 'Count', 'type' => 'number', 'default' => 3),
            'size' => array('title' => 'Size', 'data' => $sizes),
            'state' => array('title' => 'State', 'data' => $states),
            'shape' => array('title' => 'Shape', 'data' => $shapes),
            'modifier' => array('title' => 'Modifier', 'data' => array('' => '-- None --', 'vertical' => 'Vertical', 'justified' => 'Justified')),
            'disabled' => array('title' => 'Disabled?', 'type' => 'boolean'),
            'active' => array('title' => 'Active?', 'type' => 'boolean')
        )
    ),
    'carousel' => array(
        'title' => 'Carousel',
        'css' => array('components/carousel.css'),
        'js' => array('components/Carousel.js'),
        'filters' => array(
            'animation' => array('title' => 'Animation', 'data' => array(
                'slide' => 'Slide',
                'slide-up' => 'Slide Up',
                'fade' => 'Fade'
            ), 'default' => 'slide'),
            'modifier' => array('title' => 'Modifier', 'data' => array(
                '' => 'Default (4:3)',
                'wide' => 'Wide (16:9)',
                'square' => 'Square (1:1)'
            ), 'default' => ''),
            'duration' => array('title' => 'Duration', 'type' => 'number', 'default' => 5000),
            'itemsToShow' => array('title' => 'Items To Show', 'type' => 'number', 'default' => 1),
            'itemsToCycle' => array('title' => 'Items To Cycle', 'type' => 'number', 'default' => 1),
            'defaultIndex' => array('title' => 'Default Index', 'type' => 'number', 'default' => 0),
            'loop' => array('title' => 'Loop Items?', 'type' => 'boolean', 'default' => true),
            'infinite' => array('title' => 'Infinite Scrolling?', 'type' => 'boolean', 'default' => true),
            'reverse' => array('title' => 'Reverse Direction?', 'type' => 'boolean', 'default' => false),
            'autoCycle' => array('title' => 'Auto Cycle?', 'type' => 'boolean', 'default' => true),
            'stopOnHover' => array('title' => 'Stop On Hover?', 'type' => 'boolean', 'default' => true),
            'count' => array('title' => 'Item Count', 'type' => 'number', 'default' => 6),
            'tabs' => array('title' => 'Show Tabs?', 'type' => 'boolean', 'default' => true),
            'arrows' => array('title' => 'Show Arrows?', 'type' => 'boolean', 'default' => true),
            'captions' => array('title' => 'Show Captions?', 'type' => 'boolean', 'default' => true)
        )
    ),
    'code' => array(
        'title' => 'Code',
        'css' => array('layout/code.css'),
        'filters' => array(
            'modifier' => array('title' => 'Modifier', 'data' => array('' => '-- None --', 'scrollable' => 'Scrollable'))
        )
    ),
    'divider' => array(
        'title' => 'Divider',
        'css' => array('layout/divider.css')
    ),
    'drop' => array(
        'title' => 'Drop',
        'css' => array('components/drop.css'),
        'js' => array('components/Drop.js'),
        'filters' => array(
            'position' => array('title' => 'Position', 'data' => array(
                'drop--down' => 'Down (Default)',
                'drop--up' => 'Up',
                'drop--right' => 'Right',
                'drop--left' => 'Left'
            )),
            'reverse' => array('title' => 'Reverse alignment?', 'type' => 'boolean', 'default' => false),
            'mode' => array('title' => 'Mode', 'data' => array('click' => 'Click', 'hover' => 'Hover')),
            'hideOpened' => array('title' => 'Hide Other Opened?', 'type' => 'boolean', 'default' => true)
        )
    ),
    'flyout' => array(
        'title' => 'Flyout',
        'css' => array('components/flyout.css'),
        'js' => array('class/Timers.js', 'components/Flyout.js'),
        'filters' => array(
            'className' => array('title' => 'Class', 'type' => 'text'),
            'mode' => array('title' => 'Mode', 'data' => array('click' => 'Click', 'hover' => 'Hover'), 'default' => 'hover'),
            'xOffset' => array('title' => 'X Offset', 'type' => 'number', 'default' => 0),
            'yOffset' => array('title' => 'Y Offset', 'type' => 'number', 'default' => 0),
            'showDelay' => array('title' => 'Hover Show Delay', 'type' => 'number', 'default' => 350),
            'hideDelay' => array('title' => 'Hover Hide Delay', 'type' => 'number', 'default' => 500),
            'itemLimit' => array('title' => 'Column Item Limit', 'type' => 'number', 'default' => 15),
        )
    ),
    'form' => array(
        'title' => 'Form',
        'css' => array('layout/form.css'),
        'filters' => array(
            'size' => array('title' => 'Size', 'data' => $sizes),
            'state' => array('title' => 'State', 'data' => array('' => 'Default', 'is-error' => 'Error', 'is-success' => 'Success')),
            'required' => array('title' => 'Required?', 'type' => 'boolean', 'default' => false),
            'disabled' => array('title' => 'Disabled?', 'type' => 'boolean', 'default' => false)
        )
    ),
    'grid' => array(
        'title' => 'Grid',
        'css' => array('layout/grid.css')
    ),
    'icon' => array(
        'title' => 'Icon',
        'css' => array('components/icon.css'),
        'filters' => array(
            'modifier' => array('title' => 'Modifier', 'data' => array(
                '' => '-- None --',
                '90deg' => 'Rotate 90',
                '180deg' => 'Rotate 180',
                '270deg' => 'Rotate 270',
                'flip' => 'Flip Horizontal',
                'flip-vert' => 'Flip Vertical'
            ))
        )
    ),
    'input' => array(
        'title' => 'Input',
        'css' => array('components/input.css'),
        'js' => array('components/Input.js'),
        'filters' => array(
            'checkbox' => array('title' => 'Checkbox?', 'type' => 'boolean', 'default' => true),
            'radio' => array('title' => 'Radio?', 'type' => 'boolean', 'default' => true),
            'select' => array('title' => 'Select?', 'type' => 'boolean', 'default' => true),
            'native' => array('title' => 'Native select dropdown?', 'type' => 'boolean', 'default' => false),
            'multipleFormat' => array('title' => 'Multiple label format', 'data' => array(
                'count' => 'Counter',
                'list' => 'Option list'
            )),
            'listLimit' => array('title' => 'Label list limit', 'type' => 'number', 'default' => 3),
            'hideOpened' => array('title' => 'Hide open selects?', 'type' => 'boolean', 'default' => true),
            'hideFirst' => array('title' => 'Hide first?', 'type' => 'boolean', 'default' => false),
            'hideSelected' => array('title' => 'Hide selected?', 'type' => 'boolean', 'default' => false),
            'disabled' => array('title' => 'Disabled?', 'type' => 'boolean', 'default' => false)
        )
    ),
    'input-group' => array(
        'title' => 'Input Group',
        'css' => array('components/input-group.css'),
        'filters' => array(
            'size' => array('title' => 'Size', 'data' => $sizes),
            'round' => array('title' => 'Round?', 'type' => 'boolean')
        )
    ),
    'label' => array(
        'title' => 'Label',
        'css' => array('components/label.css'),
        'filters' => array(
            'size' => array('title' => 'Size', 'data' => $sizes),
            'state' => array('title' => 'State', 'data' => $states),
            'modifier' => array('title' => 'Modifier', 'data' => array('' => '-- None --', 'badge' => 'Badge', 'arrow-left' => 'Left Arrow', 'arrow-right' => 'Right Arrow', 'ribbon-left' => 'Left Ribbon', 'ribbon-right' => 'Right Ribbon'))
        )
    ),
    'lazy-load' => array(
        'title' => 'Lazy Load',
        'css' => array('components/lazy-load.css'),
        'js' => array('components/LazyLoad.js'),
        'filters' => array(
            'delay' => array('title' => 'Force Delay', 'type' => 'number', 'default' => 10000),
            'threshold' => array('title' => 'Threshold', 'type' => 'number', 'default' => 150),
            'throttle' => array('title' => 'Throttle', 'type' => 'number', 'default' => 50),
            'forceLoad' => array('title' => 'Force load?', 'type' => 'boolean')
        )
    ),
    'loader' => array(
        'title' => 'Loader',
        'css' => array('components/loader.css')
    ),
    'mask' => array(
        'title' => 'Mask',
        'css' => array('components/mask.css'),
        'js' => array('components/Mask.js'),
        'filters' => array(
            'revealOnClick' => array('title' => 'Reveal on click?', 'type' => 'boolean', 'default' => false)
        )
    ),
    'matrix' => array(
        'title' => 'Matrix',
        'css' => array('components/matrix.css'),
        'js' => array('components/Matrix.js'),
        'filters' => array(
            'mode' => array('title' => 'Mode', 'data' => array('single' => 'Single', 'multiple' => 'Multiple')),
            'gutter' => array('title' => 'Gutter', 'type' => 'number', 'default' => 20),
            'rtl' => array('title' => 'Right to left?', 'type' => 'boolean'),
            'defer' => array('title' => 'Defer for images?', 'type' => 'boolean', 'default' => true)
        )
    ),
    'modal' => array(
        'title' => 'Modal',
        'css' => array('components/blackout.css', 'components/modal.css'),
        'js' => array('components/Blackout.js', 'components/Modal.js'),
        'filters' => array(
            'className' => array('title' => 'Class', 'type' => 'text'),
            'animation' => array('title' => 'Animation', 'data' => array(
                'fade' => 'Fade',
                'from-above' => 'From Above',
                'from-below' => 'From Below',
                'slide-in-top' => 'Slide In Top',
                'slide-in-right' => 'Slide In Right',
                'slide-in-bottom' => 'Slide In Bottom',
                'slide-in-left' => 'Slide In Left'
            )),
            'ajax' => array('title' => 'Is AJAX?', 'type' => 'boolean', 'default' => true),
            //'draggable' => array('title' => 'Is draggable?', 'type' => 'boolean', 'default' => false),
            'fullScreen' => array('title' => 'Full screen?', 'type' => 'boolean', 'default' => false),
            'stopScroll' => array('title' => 'Stop scroll?', 'type' => 'boolean', 'default' => true),
            'blackout' => array('title' => 'Show blackout?', 'type' => 'boolean', 'default' => true)
        )
    ),
    'notice' => array(
        'title' => 'Notice',
        'css' => 'components/notice.css',
        'filters' => array(
            'state' => array('title' => 'State', 'data' => $states),
            'round' => array('title' => 'Round?', 'type' => 'boolean')
        )
    ),
    'off-canvas' => array(
        'title' => 'Off Canvas',
        'css' => 'components/off-canvas.css',
        'js' => 'components/OffCanvas.js',
        'filters' => array(
            'animation' => array('title' => 'Animation', 'data' => array(
                'push' => 'Push',
                'push-down' => 'Push Down',
                'push-reveal' => 'Push Reveal',
                'reverse-push' => 'Reverse Push',
                'reveal' => 'Reveal',
                'squish' => 'Squish',
                'on-top' => 'On Top'
            ), 'default' => 'push'),
            'openOnLoad' => array('title' => 'Open on page load?', 'type' => 'boolean', 'default' => false),
            'hideOthers' => array('title' => 'Hide other sidebars?', 'type' => 'boolean', 'default' => true),
            'stopScroll' => array('title' => 'Stop scroll?', 'type' => 'boolean', 'default' => true),
        )
    ),
    'pagination' => array(
        'title' => 'Pagination',
        'css' => array('components/button.css', 'components/pagination.css'),
        'filters' => array(
            'modifier' => array('title' => 'Modifier', 'data' => array('' => '-- None --', 'grouped' => 'Grouped')),
            'size' => array('title' => 'Size', 'data' => $sizes),
            'state' => array('title' => 'State', 'data' => $states),
            'shape' => array('title' => 'Shape (Grouped)', 'data' => $shapes),
            'count' => array('title' => 'Count', 'type' => 'number', 'default' => 5),
        )
    ),
    'pin' => array(
        'title' => 'Pin',
        'js' => array('components/Pin.js'),
        'css' => array('components/pin.css'),
        'filters' => array(
            'animation' => array('title' => 'Animation', 'data' => array('' => '-- None --', 'sticky' => 'Sticky', 'slide' => 'Slide')),
            'location' => array('title' => 'Location', 'data' => array('right' => 'Right', 'left' => 'Left'), 'default' => 'right'),
            'xOffset' => array('title' => 'X Offset', 'type' => 'number', 'default' => 0),
            'yOffset' => array('title' => 'Y Offset', 'type' => 'number', 'default' => 0),
            'throttle' => array('title' => 'Throttle', 'type' => 'number', 'default' => 50),
            'fixed' => array('title' => 'Fixed?', 'type' => 'boolean', 'default' => false),
            'lock' => array('title' => 'Lock if too tall?', 'type' => 'boolean', 'default' => true),
            'height' => array('title' => 'Default Height', 'type' => 'number'),
            'top' => array('title' => 'Default Top', 'type' => 'number')
        )
    ),
    'popover' => array(
        'title' => 'Popover',
        'css' => array('components/tooltip.css', 'components/popover.css'),
        'js' => array('components/Tooltip.js', 'components/Popover.js'),
        'filters' => array(
            'className' => array('title' => 'Class', 'type' => 'text'),
            'animation' => array('title' => 'Animation', 'data' => array(
                '' => '-- None -- ',
                'fade' => 'Fade',
                'from-above' => 'From Above',
                'from-below' => 'From Below',
                'flip-rotate' => 'Flip Rotate'
            )),
            'position' => array('title' => 'Position', 'data' => array(
                'top-left' => 'Top Left',
                'top-center' => 'Top Center',
                'top-right' => 'Top Right',
                'center-left' => 'Center Left',
                'center-right' => 'Center Right',
                'bottom-left' => 'Bottom Left',
                'bottom-center' => 'Bottom Center',
                'bottom-right' => 'Bottom Right'
            ), 'default' => 'top-center'),
            'xOffset' => array('title' => 'X Offset', 'type' => 'number', 'default' => 0),
            'yOffset' => array('title' => 'Y Offset', 'type' => 'number', 'default' => 0),
            'delay' => array('title' => 'Delay', 'type' => 'number', 'default' => 0),
            'ajax' => array('title' => 'Is AJAX?', 'type' => 'boolean', 'default' => false),
            'showLoading' => array('title' => 'Show loading?', 'type' => 'boolean', 'default' => true),
            'showTitle' => array('title' => 'Show title?', 'type' => 'boolean', 'default' => true),
        )
    ),
    'progress' => array(
        'title' => 'Progress Bar',
        'css' => array('components/progress.css'),
        'filters' => array(
            'size' => array('title' => 'Size', 'data' => $sizes),
            'state' => array('title' => 'State', 'data' => $states),
            'shape' => array('title' => 'Shape', 'data' => array(
                '' => 'Square (Default)',
                'round' => 'Round',
                'pill' => 'Pill'
            )),
            'width' => array('title' => 'Width', 'type' => 'number', 'default' => 55)
        )
    ),
    'responsive' => array(
        'title' => 'Responsive',
        'css' => array('layout/responsive.css')
    ),
    'showcase' => array(
        'title' => 'Showcase',
        'css' => array('components/blackout.css', 'components/showcase.css'),
        'js' => array('components/Blackout.js', 'components/Showcase.js'),
        'filters' => array(
            'className' => array('title' => 'Class', 'type' => 'text'),
            'gutter' => array('title' => 'Gutter Margin', 'type' => 'number', 'default' => 50),
            'group' => array('title' => 'Grouped?', 'type' => 'boolean', 'default' => true),
            'stopScroll' => array('title' => 'Stop scroll?', 'type' => 'boolean', 'default' => true),
            'count' => array('title' => 'Count', 'type' => 'number', 'default' => 5)
        )
    ),
    'stalker' => array(
        'title' => 'Stalker',
        'js' => array('components/Stalker.js'),
        'filters' => array(
            'threshold' => array('title' => 'Threshold', 'type' => 'number', 'default' => 50),
            'throttle' => array('title' => 'Throttle', 'type' => 'number', 'default' => 50),
            'applyToParent' => array('title' => 'Apply active to parent?', 'type' => 'boolean', 'default' => true),
            'onlyWithin' => array('title' => 'Only within marker?', 'type' => 'boolean', 'default' => true),
        )
    ),
    'step' => array(
        'title' => 'Step',
        'css' => array('layout/step.css'),
        'filters' => array(
            'size' => array('title' => 'Size', 'data' => $sizes),
            'count' => array('title' => 'Steps', 'type' => 'number', 'default' => 5),
            'complete' => array('title' => 'Completed', 'type' => 'number', 'default' => 3)
        )
    ),
    'switch' => array(
        'title' => 'Switch',
        'css' => array('layout/switch.css'),
        'filters' => array(
            'size' => array('title' => 'Size', 'data' => $sizes),
            'shape' => array('title' => 'Shape', 'data' => array(
                '' => 'Square (Default)',
                'round' => 'Round',
                'pill' => 'Pill'
            )),
            'modifier' => array('title' => 'Modifier', 'data' => array(
                '' => '-- None --',
                'stacked' => 'Stacked Labels'
            )),
        )
    ),
    'table' => array(
        'title' => 'Table',
        'css' => array('layout/table.css'),
        'filters' => array(
            'size' => array('title' => 'Size', 'data' => $sizes),
            'hover' => array('title' => 'Show hover?', 'type' => 'boolean', 'default' => false),
            'striped' => array('title' => 'Striped rows?', 'type' => 'boolean', 'default' => false),
            'sortable' => array('title' => 'Sortable headers?', 'type' => 'boolean', 'default' => false),
            'count' => array('title' => 'Count', 'type' => 'number', 'default' => 25)
        )
    ),
    'tabs' => array(
        'title' => 'Tabs',
        'css' => array('components/tabs.css'),
        'js' => array('components/Tabs.js'),
        'filters' => array(
            'mode' => array('title' => 'Mode', 'data' => array('click' => 'Click', 'hover' => 'Hover'), 'default' => 'click'),
            'defaultIndex' => array('title' => 'Default Index', 'type' => 'number', 'default' => 0),
            'cookie' => array('title' => 'Cookie Name', 'type' => 'text'),
            'cookieDuration' => array('title' => 'Cookie Duration', 'type' => 'number', 'default' => 30),
            'ajax' => array('title' => 'Allow AJAX?', 'type' => 'boolean', 'default' => true),
            'collapsible' => array('title' => 'Collapsible?', 'type' => 'boolean', 'default' => false),
            'persistState' => array('title' => 'Persist state?', 'type' => 'boolean', 'default' => false),
            'loadFragment' => array('title' => 'Load from fragment?', 'type' => 'boolean', 'default' => true),
            'preventDefault' => array('title' => 'Prevent default?', 'type' => 'boolean', 'default' => true),
        )
    ),
    'toast' => array(
        'title' => 'Toast',
        'css' => array('components/toast.css'),
        'js' => array('components/Toast.js'),
        'filters' => array(
            'animation' => array('title' => 'Animation', 'data' => array(
                'fade' => 'Fade',
                'slide-up' => 'Slide Up',
                'slide-down' => 'Slide Down',
                'slide-left' => 'Slide Left',
                'slide-right' => 'Slide Right',
            ), 'default' => 'slide-up'),
            'position' => array('title' => 'Position', 'data' => array(
                'top-left' => 'Top Left',
                'top-center' => 'Top Center',
                'top-right' => 'Top Right',
                'center-left' => 'Center Left',
                'center-right' => 'Center Right',
                'bottom-left' => 'Bottom Left',
                'bottom-center' => 'Bottom Center',
                'bottom-right' => 'Bottom Right'
            ), 'default' => 'bottom-left'),
            'duration' => array('title' => 'Duration', 'type' => 'number', 'default' => 5000)
        )
    ),
    'tooltip' => array(
        'title' => 'Tooltip',
        'css' => array('components/tooltip.css'),
        'js' => array('components/Tooltip.js'),
        'filters' => array(
            'className' => array('title' => 'Class', 'type' => 'text'),
            'animation' => array('title' => 'Animation', 'data' => array(
                '' => '-- None -- ',
                'fade' => 'Fade',
                'from-above' => 'From Above',
                'from-below' => 'From Below',
                'flip-rotate' => 'Flip Rotate'
            )),
            'position' => array('title' => 'Position', 'data' => array(
                'top-left' => 'Top Left',
                'top-center' => 'Top Center',
                'top-right' => 'Top Right',
                'center-left' => 'Center Left',
                'center-right' => 'Center Right',
                'bottom-left' => 'Bottom Left',
                'bottom-center' => 'Bottom Center',
                'bottom-right' => 'Bottom Right'
            ), 'default' => 'top-center'),
            'mode' => array('title' => 'Mode', 'data' => array('click' => 'Click', 'hover' => 'Hover'), 'default' => 'hover'),
            'mouseThrottle' => array('title' => 'Mouse Throttle', 'type' => 'number', 'default' => 50),
            'xOffset' => array('title' => 'X Offset', 'type' => 'number', 'default' => 0),
            'yOffset' => array('title' => 'Y Offset', 'type' => 'number', 'default' => 0),
            'delay' => array('title' => 'Delay', 'type' => 'number', 'default' => 0),
            'ajax' => array('title' => 'Is AJAX?', 'type' => 'boolean', 'default' => false),
            'follow' => array('title' => 'Follow mouse?', 'type' => 'boolean', 'default' => false),
            'showLoading' => array('title' => 'Show loading?', 'type' => 'boolean', 'default' => true),
            'showTitle' => array('title' => 'Show title?', 'type' => 'boolean', 'default' => true),
        )
    ),
    'type-ahead' => array(
        'title' => 'Type Ahead',
        'css' => array('components/type-ahead.css'),
        'js' => array('class/Cache.js', 'components/TypeAhead.js'),
        'filters' => array(
            'className' => array('title' => 'Class', 'type' => 'text'),
            'minLength' => array('title' => 'Minimum Characters', 'type' => 'number', 'default' => 1),
            'itemLimit' => array('title' => 'Item Limit', 'type' => 'number', 'default' => 15),
            'throttle' => array('title' => 'Lookup Throttle', 'type' => 'number', 'default' => 250),
            'prefetch' => array('title' => 'Prefetch lookup?', 'type' => 'boolean', 'default' => false),
            'shadow' => array('title' => 'Shadow text?', 'type' => 'boolean', 'default' => false),
        )
    ),
);

$themes = array(
    'titon' => array(
        'title' => 'Demo',
        'css' => 'demo.css'
    )
);

// Detect theme and component
$componentKey = value('component', 'home');
$themeKey = value('theme', 'titon');

$component = isset($components[$componentKey]) ? $components[$componentKey] : $components['home'];
$theme = isset($themes[$themeKey]) ? $themes[$themeKey] : array();
$vendor = value('vendor', 'jquery1');
$vendorFolder = 'jquery';
$time = time(); ?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Titon - Toolkit - <?php echo $component['title']; ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimal-ui">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link href="css/toolkit.css?<?= $time; ?>" rel="stylesheet" type="text/css">
    <link href="css/example.css?<?= $time; ?>" rel="stylesheet" type="text/css">

    <?php if (!empty($theme)) { ?>
        <link href="css/<?php echo $theme['css']; ?>?<?= $time; ?>" rel="stylesheet" type="text/css">
    <?php } ?>

    <?php if ($vendor === 'jquery2') { ?>
        <script src="js/jquery-2.1.1.js"></script>
        <!--<script src="js/jquery-ui-1.10.4.js"></script>-->
        <script src="js/toolkit.js?<?= $time; ?>"></script>
        <script>
            $.extend(Toolkit.messages, {
                loading: '[CUSTOM] Loading...',
                error: '[CUSTOM] Error!'
            });
        </script>

    <?php } else if ($vendor === 'jquery1') { ?>
        <script src="js/jquery-1.11.1.js"></script>
        <!--<script src="js/jquery-ui-1.10.4.js"></script>-->
        <script src="js/toolkit.js?<?= $time; ?>"></script>
        <script>
            $.extend(Toolkit.messages, {
                loading: '[CUSTOM] Loading...',
                error: '[CUSTOM] Error!'
            });
        </script>
    <?php } ?>
</head>
<body class="<?php echo $themeKey; ?>">
    <div id="skeleton" class="skeleton">
        <form action="" method="get">
            <ul class="example-form example-switcher">
                <li>
                    <label for="component">Component</label>
                    <select name="component" id="component">
                        <option value="">-- None --</option>
                        <?php foreach ($components as $key => $value) {
                            if ($key === 'home') {
                                continue;
                            } ?>
                            <option value="<?php echo $key; ?>"<?php if ($key === $componentKey) echo ' selected'; ?>>
                                <?php echo $value['title']; ?>
                                <?php if (!empty($value['js'])) echo '(JS)'; ?>
                            </option>
                        <?php } ?>
                    </select>
                </li>
                <li>
                    <label for="theme">Theme</label>
                    <select name="theme" id="theme">
                        <option value="">-- None --</option>
                        <?php foreach ($themes as $key => $value) { ?>
                            <option value="<?php echo $key; ?>"<?php if ($key === $themeKey) echo ' selected'; ?>><?php echo $value['title']; ?></option>
                        <?php } ?>
                    </select>
                </li>
                <li>
                    <label for="vendor">Vendor</label>
                    <select name="vendor" id="vendor">
                        <option value="jquery1"<?php if ($vendor === 'jquery1') echo ' selected'; ?>>jQuery 1.11</option>
                        <option value="jquery2"<?php if ($vendor === 'jquery2') echo ' selected'; ?>>jQuery 2.1</option>
                    </select>
                </li>
                <li class="resolution">
                    Resolution <span id="res-width"></span>x<span id="res-height"></span>
                </li>
                <li><button type="submit">Switch</button></li>
            </ul>
        </form>

        <form action="" method="get">
            <?php if (!empty($component['filters'])) { ?>
                <ul class="example-form example-filters">
                    <?php foreach ($component['filters'] as $name => $filter) {
                        $default = isset($filter['default']) ? $filter['default'] : ''; ?>

                        <li>
                            <label for="<?php echo $name; ?>"><?php echo $filter['title']; ?></label>

                            <?php if (!empty($filter['data'])) {
                                $selected = value($name, $default); ?>

                                <select id="<?php echo $name; ?>" name="<?php echo $name; ?>">
                                    <?php foreach ($filter['data'] as $k => $v) { ?>
                                        <option value="<?php echo $k; ?>"<?php if ($selected === $k) echo ' selected'; ?>><?php echo $v; ?></option>
                                    <?php } ?>
                                </select>

                            <?php } else if ($filter['type'] === 'text') { ?>
                                <input type="text" id="<?php echo $name; ?>" name="<?php echo $name; ?>" value="<?php echo value($name, $default); ?>">

                            <?php } else if ($filter['type'] === 'number') { ?>
                                <input type="number" id="<?php echo $name; ?>" name="<?php echo $name; ?>" value="<?php echo value($name, $default); ?>" pattern="\d+">

                            <?php } else if ($filter['type'] === 'boolean') { ?>
                                <input type="hidden" name="<?php echo $name; ?>" value="">
                                <input type="checkbox" id="<?php echo $name; ?>" name="<?php echo $name; ?>" value="1"<?php if (value($name, $default)) echo ' checked'; ?>>

                            <?php } ?>
                        </li>
                    <?php } ?>

                    <li>
                        <input type="hidden" name="component" value="<?php echo value('component'); ?>">
                        <input type="hidden" name="theme" value="<?php echo value('theme', 'titon'); ?>">
                        <input type="hidden" name="vendor" value="<?php echo value('vendor', 'jquery'); ?>">
                        <button type="submit">Filter</button>
                    </li>
                </ul>
            <?php } ?>
        </form>

        <div class="example">
            <?php $path = sprintf('./%s.php', $componentKey ?: 'home');

            if (isset($unsupported[$vendor]) && in_array($componentKey, $unsupported[$vendor])) {
                include './unsupported.php';

            } else if (file_exists($path)) {
                include $path;

            } else {
                echo 'No such component ' . $componentKey;
            } ?>
        </div>
    </div>

    <script>
        <?php if ($vendor === 'mootools') { ?>
            function resize() {
                $('res-width').set('html', window.getWidth());
                $('res-height').set('html', window.getHeight());
            }

            window.addEvent('domready', resize).addEvent('resize', resize);
        <?php } else { ?>
            function resize() {
                $('#res-width').html($(window).width());
                $('#res-height').html($(window).height());
            }

            $(document).ready(resize);
            $(window).on('resize', resize);
        <?php } ?>
    </script>
</body>
</html>