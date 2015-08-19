'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    prefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin'),
    web = require('node-static');

gulp.task('test', ['watch'], function() {
    require('http').createServer(function(request, response) {
        request.addListener('end', function() {
            new web.Server('.', {
                serverInfo: 'Titon Toolkit',
                indexFile: 'index.html'
            }).serve(request, response);
        }).resume();
    }).listen(8080);
});

gulp.task('css', function() {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({
            style: 'expanded',
            includePaths: ['./toolkit/scss-3.0/']
        }))
        .pipe(prefixer({
            browsers: ['last 3 versions']
        }))
        .pipe(gulp.dest('./css/'));
});

gulp.task('img', function() {
    return gulp.src('./img/**/*')
        .pipe(imagemin())
        .pipe(gulp.dest('./img/'));
});

gulp.task('default', ['css']);

gulp.task('watch', ['default'], function() {
    gulp.watch([
        './scss/**/*.scss',
        './toolkit/scss-3.0/**/*.scss'
    ], ['css']);
});
