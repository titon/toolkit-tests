<?php
$mode = value('mode', 'single'); ?>

<p>
    <button type="button" onclick="appendItem();" class="button">Append Item</button>
    <button type="button" onclick="prependItem();" class="button">Prepend Item</button>
    <button type="button" onclick="removeItem();" class="button">Remove Item</button>
</p>

<br>

<ul id="matrix" class="matrix">
    <?php for ($i = 0, $x = 0; $i < 25; $i++) { ?>

        <li>
            <?php if ($mode === 'single') { ?>
                <img src="http://placehold.it/200x<?php echo rand(200, 600); ?>/<?= color(); ?>/ffffff&text=<?= $i + 1; ?>" class="fluid">
            <?php } else { ?>
                <img src="http://placehold.it/<?php echo rand(200, 600); ?>x<?php echo rand(100, 600); ?>/<?= color(); ?>/ffffff&text=<?= $i + 1; ?>" class="fluid">
            <?php } ?>
        </li>

    <?php } ?>
</ul>

<script>
    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function appendItem() {
        newItem('append');
    }

    function prependItem() {
        newItem('prepend');
    }

    function removeItem() {
        <?php if ($vendor === 'mootools') { ?>
            $('matrix').toolkit('matrix').remove($$('.matrix li')[0]);
        <?php } else { ?>
            $('#matrix').toolkit('matrix').remove($('.matrix li')[0]);
        <?php } ?>
    }

    function newItem(where) {
        var w = 200,
            h = random(200, 600),
            i = new Image(),
            <?php if ($vendor === 'mootools') { ?>
                matrix = $('matrix').toolkit('matrix');
            <?php } else { ?>
                matrix = $('#matrix').toolkit('matrix');
            <?php } ?>

        <?php if ($mode === 'multiple') { ?>
            w = random(200, 600);
        <?php } ?>

        i.src = 'http://placehold.it/' + w + 'x' + h + '/000000/ffffff&text=' + (matrix.items.length + 1);
        i.className = 'fluid';
        i.onload = function() {
            <?php if ($vendor === 'mootools') { ?>
                matrix[where](new Element('li').grab(i));
            <?php } else { ?>
                matrix[where]($('<li/>').html(i));
            <?php } ?>
        };
    }

    <?php if ($vendor === 'mootools') { ?>
        window.addEvent('domready', function() {
            $('matrix').matrix({
                gutter: <?php number('gutter', 20); ?>,
                rtl: <?php bool('rtl', false); ?>,
                defer: <?php bool('defer', true); ?>
            });
        });
    <?php } else { ?>
        $(function() {
            $('#matrix').matrix({
                gutter: <?php number('gutter', 20); ?>,
                rtl: <?php bool('rtl', false); ?>,
                defer: <?php bool('defer', true); ?>
            });
        });
    <?php } ?>
</script>