'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    prefixer = require('gulp-autoprefixer'),
    imagemin = require('gulp-imagemin'),
    web = require('node-static');

gulp.task('server', ['watch'], function() {
    var server = new web.Server('.', {
        serverInfo: 'Titon Toolkit',
        indexFile: 'index.html'
    });

    require('http').createServer(function(request, response) {
        request.addListener('end', function () {
            server.serve(request, response);
        }).resume();
    }).listen(8080);
});

gulp.task('css', function() {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({
            style: 'expanded',
            includePaths: ['toolkit/scss-3.0/']
        }))
        .pipe(prefixer({
            browsers: ['last 3 versions']
        }))
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
