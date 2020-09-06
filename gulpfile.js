var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
const useref = require('gulp-useref');
const uglify = require('gulp-uglify');
const gulpIf = require('gulp-if');
const cssnano = require('gulp-cssnano');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const del = require('del');

gulp.task('useref', () => {
    return gulp.src('src/.html')
.pipe(useref())
        .pipe(gulpIf('.js', uglify()))
.pipe(gulpIf('*.css', cssnano()))
.pipe(gulp.dest('dist'))
});
gulp.task('images', () => {
    return gulp.src('src/images/**/*.+(png|jpg|gif|svg)')
.pipe(cache(imagemin({
        interlaced: true
    })))
        .pipe(gulp.dest('dist'))
});

function style() {
    return gulp.src('scss/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(gulp.dest('css'))
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
}
gulp.task('clean:dist', (done) => {
    del.sync('dist')
    done();
});
gulp.task('build', gulp.series('clean:dist', 'sass', 'useref', 'images'));
function watch() {
    browserSync.init({
        server: {
            baseDir: './'
        }
    });
    gulp.watch('./scss/*.scss', style);
    gulp.watch('./*.html').on('change', browserSync.reload);
    gulp.watch('./js/*.js').on('change', browserSync.reload);
    gulp.watch('./data/*.json').on('change', browserSync.reload);
}


var browserSync = require('browser-sync').create();

exports.style = style;
exports.watch = watch;
