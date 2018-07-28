/*eslint-env node */

var browserSync = require('browser-sync').create();
var del = require('del');
var gulp = require('gulp');
// var babel = require('gulp-babel');
var concat = require('gulp-concat');
var eslint = require('gulp-eslint');
var imagemin = require('gulp-imagemin');
var sourcemaps = require('gulp-sourcemaps');
// var uglify = require('gulp-uglify');
var uglifyjs = require('gulp-uglify-es').default;
var uglifycss = require('gulp-uglifycss');
var gzip = require('gulp-gzip');
var webp = require('gulp-webp');

gulp.task('default', ['clean', 'copy-html', 'copy-images', 'jpgtowebp',
        'styles', 'scripts', 'service-worker', /*'lint', 'manifest'*/
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
    // 'copy-images',
    'jpgtowebp',
    'styles',
    'scripts-dist',
    'service-worker'
]);

gulp.task('clean', function () {
    return del('dist/**', {
        force: true
    });
});

gulp.task('copy-html', function () {
    gulp.src('./*.html')
        .pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function () {
    gulp.src('img/*')
        .pipe(imagemin([
            imagemin.jpegtran({progressive: true})
        ]))
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
        // .pipe(gzip())
        .pipe(gulp.dest('dist/css'))
        // .pipe(browserSync.stream());
});

gulp.task('scripts', function () {
    gulp.src('js/**/*.js')
        .pipe(sourcemaps.init())
        // .pipe(babel())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', function () {
    gulp.src('js/**/*.js')
        // .pipe(sourcemaps.init())
        // .pipe(babel())
        // .pipe(concat('minified.js'))
        .pipe(uglifyjs())
        // .pipe(gzip())
        // .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/js'));
});

gulp.task('service-worker', function () {
    return gulp.src('./serviceworker.js')
        // .pipe(sourcemaps.init())
        .pipe(uglifyjs())
        // .pipe(gzip())
        // .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'));
});

gulp.task('lint', function () {
    return gulp.src(['js/**/*.js'])
        // eslint() attaches the lint output to the eslint property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failOnError last.
        .pipe(eslint.failOnError());
});

gulp.task('manifest', function () {
    return gulp.src('./manifest.json')
        .pipe(gulp.dest('dist'));
});
