var gulp = require('gulp');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var cache = require('gulp-cache');
var cp = require('child_process');


// Serve the Jekyll Site
gulp.task('jekyll-serve', function (done) {
    return cp.spawn('bundle' , ['exec', 'jekyll', 'serve'], {stdio: 'inherit'})
        .on('close', done);
});

// Compile files
gulp.task('sass', function () {
    return gulp.src('assets/css/sass/main.sass')
        .pipe(sass({
            outputStyle: 'expanded',
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('_site/assets/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('assets/css'));
});

// Compression images
gulp.task('img', function() {
  return gulp.src('assets/img/**/*')
    .pipe(cache(imagemin({
      interlaced: true,
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    })))
    .pipe(gulp.dest('_site/assets/img'))
    .pipe(browserSync.reload({stream:true}));
});

// Fonts
gulp.task('fonts', function() {
    return gulp.src('assets/fonts/**/*')
        .pipe(gulp.dest('_site/assets/fonts'))
        .pipe(browserSync.reload({stream:true}));
});

// Watch scss, html, img files
gulp.task('watch', function () {
    gulp.watch('assets/css/sass/*.*', ['sass']);
    gulp.watch('assets/img/**/*', ['img']);
    gulp.watch('assets/fonts/**/*', ['fonts']);
});

//  Default task
gulp.task('default', ['jekyll-serve', 'watch']);
