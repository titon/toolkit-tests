
<div class="grid">

    <div class="col span-4 lazy-container">
        <p style="margin-top: 0">Loads background images.</p>

        <?php for ($x = 0; $x <= 10; $x++) { ?>

            <div class="lazy-load example-lazy-load" style="background-image: url('http://placehold.it/200x200/<?= color(); ?>/ffffff&text=1:<?= $x; ?>')">
                <!-- Background styles are lazy loaded via CSS -->
            </div>

        <?php } ?>
    </div>

    <div class="col span-4 lazy-container">
        <p style="margin-top: 0">Loads inline images.</p>

        <?php for ($x = 0; $x <= 10; $x++) { ?>

            <div class="lazy-load example-lazy-load">
                <img data-src="http://placehold.it/200x200/<?= color(); ?>/ffffff&text=2:<?= $x; ?>">
            </div>

        <?php } ?>
    </div>

    <div class="col span-4">
        <p style="margin-top: 0">Loads overflown images.</p>

        <div id="overflow" style="height: 400px; overflow: auto;">
            <?php for ($x = 0; $x <= 10; $x++) { ?>

                <div class="lazy-load example-lazy-load">
                    <img data-src="http://placehold.it/200x200/<?= color(); ?>/ffffff&text=3:<?= $x; ?>">
                </div>

            <?php } ?>
        </div>
    </div>

    <span class="clear"></span>
</div>

<script>
    <?php if ($vendor === 'mootools') { ?>
        $$('.lazy-container').lazyLoad({
            forceLoad: <?php bool('forceLoad', false); ?>,
            delay: <?php number('delay', 10000); ?>,
            threshold: <?php number('threshold', 150); ?>
        });

        $$('#overflow').lazyLoad({
            forceLoad: <?php bool('forceLoad', false); ?>,
            delay: <?php number('delay', 10000); ?>,
            threshold: <?php number('threshold', 150); ?>
        });
    <?php } else { ?>
        $('.lazy-container').lazyLoad({
            forceLoad: <?php bool('forceLoad', false); ?>,
            delay: <?php number('delay', 10000); ?>,
            threshold: <?php number('threshold', 150); ?>
        });

        $('#overflow').lazyLoad({
            forceLoad: <?php bool('forceLoad', false); ?>,
            delay: <?php number('delay', 10000); ?>,
            threshold: <?php number('threshold', 150); ?>
        });
    <?php } ?>
</script>