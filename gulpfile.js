'use strict';

var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
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