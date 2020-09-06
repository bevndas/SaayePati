var gulp = require('gulp');
const {series} = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
const useref = require('gulp-useref');
const uglify = require('gulp-uglify');
const gulpIf = require('gulp-if');
const cssnano = require('gulp-cssnano');
const imagemin = require('gulp-imagemin');
const cache = require('gulp-cache');
const babel = require('gulp-babel');
const del = require('del');

function userref() {
    return gulp.src('index.html')
        .pipe(useref())
        .pipe(gulpIf('css/main.css', cssnano()))
        .pipe(gulp.dest('dist'))
}
function jsUglify() {
    return gulp.src('js/script.js')
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
}
function images() {
    return gulp.src('src/images/**/*.+(png|jpg|gif|svg)')
        .pipe(cache(imagemin({
            interlaced: true
        })))
        .pipe(gulp.dest('dist/assets/image'))
}

function style() {
    return gulp.src('scss/main.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(gulp.dest('css'))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
}
function cleanDist(done) {
    del.sync('dist')
    done();
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
    gulp.watch('./data/*.json').on('change', browserSync.reload);
}


var browserSync = require('browser-sync').create();

exports.style = style;
exports.watch = watch;
exports.build = series(cleanDist, style, userref,jsUglify, images);
