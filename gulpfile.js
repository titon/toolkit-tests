'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    prefixer = require('gulp-autoprefixer');

gulp.task('css', function() {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({ style: 'expanded' }))
        .pipe(prefixer('last 3 versions'))
        .pipe(gulp.dest('./css/'));
});

gulp.task('default', ['css']);

gulp.task('watch', function() {
    gulp.watch('./scss/**/*.scss', ['css']);
});

/**
 downloaded - http://placehold.it/400x400/283442/ffffff.png&text=4:10 - ./img/lazy-load/4-10.png
 downloaded - http://placehold.it/150x150/42586e/ffffff.png&text=1:2 - ./img/lazy-load/1-2.png
 downloaded - http://placehold.it/150x150/293f54/ffffff.png&text=1:4 - ./img/lazy-load/1-4.png
 downloaded - http://placehold.it/200x500/4c6278/ffffff.png&text=1:6 - ./img/matrix/1-6.png
 downloaded - http://placehold.it/225x150/283442/ffffff.png&text=2:5 - ./img/matrix/2-5.png
 downloaded - http://placehold.it/150x150/4c6278/ffffff.png&text=1:1 - ./img/lazy-load/1-1.png
 downloaded - http://placehold.it/600x300/4c6278/ffffff.png&text=2:1 - ./img/carousel/5-1.png
 downloaded - http://placehold.it/400x900/42586e/ffffff.png&text=4:9 - ./img/carousel/4-2.png
 downloaded - http://placehold.it/600x300/293f54/ffffff.png&text=2:1 - ./img/carousel/5-4.png
 */
