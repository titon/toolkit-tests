<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Titon Toolkit</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimal-ui">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link href="//fonts.googleapis.com/css?family=Droid+Sans:400,700" media="screen" rel="stylesheet" type="text/css">
    <link href="css/toolkit.css" rel="stylesheet" type="text/css">
    <link href="css/ui.css" rel="stylesheet" type="text/css">
    <link href="css/style.css" rel="stylesheet" type="text/css">
    <script src="js/jquery-2.1.1.js"></script>
    <script src="js/toolkit.js"></script>
    <script>
        $.extend(Toolkit.messages, {
            loading: 'Hold on just a second...',
            error: 'Something terrible has happened!'
        });
    </script>
</head>
<body>
    <div id="skeleton">
        <?php include sprintf('./tests/%s.html', $_GET['test']); ?>
    </div>

    <script>
        function resize() {
            $('#res-width').html($(window).width());
            $('#res-height').html($(window).height());
        }

        $(document).ready(resize);
        $(window).on('resize', resize);
    </script>
</body>
</html>