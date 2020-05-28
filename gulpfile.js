var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');

function style() {
    return gulp.src('scss/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(gulp.dest('css'))
        .pipe(browserSync.stream());
}
function watch() {
    browserSync.init({
        server: {
            baseDir: './'
        }
    });
    gulp.watch('./scss/*.scss', style);
    gulp.watch('./*.html').on('change', browserSync.reload);
    gulp.watch('./js/*.js').on('change', browserSync.reload);
}

var browserSync = require('browser-sync').create();

exports.style = style;
exports.watch = watch;
