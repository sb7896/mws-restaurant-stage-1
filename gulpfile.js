/*eslint-env node */

var browserSync = require('browser-sync').create();
var del = require('del');
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var sourcemaps = require('gulp-sourcemaps');
var uglifyjs = require('gulp-uglify-es').default;
var uglifycss = require('gulp-uglifycss');
var gzip = require('gulp-gzip');
var webp = require('gulp-webp');

gulp.task('default', ['clean', 'copy-html', 'copy-icons', 'jpgtowebp',
        'styles', 'scripts', 'service-worker', 'copy-manifest'
    ],
    function () {
        gulp.watch('./*.html', ['copy-html']);
        gulp.watch('css/**/*.css', ['styles']);
        gulp.watch('js/**/*.js', ['scripts']);
        gulp.watch('./serviceworker.js', ['service-worker']);

        browserSync.init({
            server: './dist'
        });
    });

gulp.task('dist', [
    'clean',
    'copy-html',
    'copy-icons',
    'jpgtowebp',
    'styles',
    'scripts-dist',
    'service-worker',
    'copy-manifest'
],function(){
    browserSync.init({
        server: './dist'
    });
});

gulp.task('clean', function () {
    return del('dist/**', {
        force: true
    });
});

gulp.task('copy-html', function () {
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist'));
});

gulp.task('copy-icons', function () {
    gulp.src('img/**/*.png')
        .pipe(gulp.dest('dist/img'));
});

gulp.task('jpgtowebp', function () {
    return gulp.src('img/*.jpg')
        .pipe(imagemin([
            imagemin.jpegtran({progressive: true})
        ]))
        .pipe(webp())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('styles', function () {
    gulp.src('css/**/*.css')
        .pipe(uglifycss())
        .pipe(gulp.dest('dist/css'))
});

gulp.task('scripts', function () {
    gulp.src('js/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', function () {
    gulp.src('js/**/*.js')
        .pipe(uglifyjs())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('service-worker', function () {
    return gulp.src('./serviceworker.js')
        .pipe(uglifyjs())
        .pipe(gulp.dest('dist'));
});

gulp.task('copy-manifest', function () {
    return gulp.src('./manifest.json')
        .pipe(gulp.dest('dist'));
});
