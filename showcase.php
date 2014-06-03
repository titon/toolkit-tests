<?php
$group = value('group', true) ? 'Titon' : '';

$dimensions = array(
    array(400, 400),
    array(1600, 900),
    array(800, 600),
    array(900, 1600)
);

for ($i = 1; $i <= value('count', 5); $i++) {
    if (isset($dimensions[$i])) {
        $width = $dimensions[$i][0];
        $height = $dimensions[$i][1];
    } else {
        $width = rand(400, 1600);
        $height = rand(400, 1600);
    } ?>

    <a href="http://placehold.it/<?= $width; ?>x<?= $height; ?>/<?= color(); ?>/ffffff&text=<?= $i; ?>"
       title="#<?php echo $i; ?>: Lorem ipsum dolor sit amet."
       class="js-showcase"
       data-showcase="<?php echo $group; ?>">
        <img src="http://placehold.it/200x150/<?= color(); ?>/ffffff&text=<?= $i; ?>">
    </a>

<?php } ?>

<script>
    <?php if ($vendor === 'mootools') { ?>
        window.addEvent('domready', function() {
            $$('.js-showcase').showcase({
                className: <?php string('className'); ?>,
                blackout: <?php bool('blackout', true); ?>,
                gutter: <?php number('gutter', 50); ?>,
                stopScroll: <?php bool('stopScroll', true); ?>
            });
        });
    <?php } else { ?>
        $(function() {
            $('.js-showcase').showcase({
                className: <?php string('className'); ?>,
                blackout: <?php bool('blackout', true); ?>,
                gutter: <?php number('gutter', 50); ?>,
                stopScroll: <?php bool('stopScroll', true); ?>
            });
        });
    <?php } ?>
</script>