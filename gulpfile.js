'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    prefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin');

gulp.task('css', function() {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({ style: 'expanded' }))
        .pipe(prefixer({ browsers: ['last 3 versions'] }))
        .pipe(gulp.dest('./css/'));
});

gulp.task('img', function () {
    return gulp.src('./img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./img/'));
});

gulp.task('default', ['css']);

gulp.task('watch', ['css'], function() {
    gulp.watch('./scss/**/*.scss', ['css']);
});
