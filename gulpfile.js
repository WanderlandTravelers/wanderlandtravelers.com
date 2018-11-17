var gulp = require('gulp');
var browserSync = require('browser-sync');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var cache = require('gulp-cache');
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var fs = require('fs');
var merge = require('merge-stream');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var cp = require('child_process');
var cssnano = require('gulp-cssnano');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');

sass.compiler = require('sass');

var jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllServe: '<span style="color: grey">Running:</span> $ jekyll serve'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyllServe', ['img', 'fonts', 'sass', 'js'], function (done) {
    browserSync.notify(messages.jekyllServe);
    return cp.spawn('bundle', ['exec', jekyll, 'serve'], { stdio: 'inherit' })
        .on('close', done);
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browserSync', ['jekyllServe'], function () {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

// Compress images
gulp.task('img', function() {
  return gulp.src('images/**/*')
    .pipe(cache(imagemin({
      interlaced: true,
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    })))
    .pipe(gulp.dest('images'))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('fonts', function () {
    return gulp.src([
        './node_modules/font-awesome/fonts/*',
    ]).pipe(gulp.dest('assets/dist/fonts/'));
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    var sassStream,
    cssStream;

    //compile sass
    sassStream = gulp.src('src/scss/style.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 3 versions'], { cascade: true }));

    //select additional css files
    cssStream = gulp.src([
        './node_modules/font-awesome/css/font-awesome.css',
        './node_modules/bootstrap/dist/css/bootstrap.css',
    ]);

    //merge the two streams and concatenate their contents into a single file
    return merge(cssStream, sassStream)
        .pipe(sourcemaps.init())
        .pipe(concat('style.css'))
        .pipe(cssnano())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('assets/dist/css'))
        .pipe(browserSync.reload({ stream: true }));
});

gulp.task('js', function () {
    return gulp.src([
        './node_modules/jquery/dist/jquery.js',
        './node_modules/liquidjs/dist/liquid.min.js',
        './node_modules/lunr/lunr.js',
        './node_modules/bootstrap/dist/js/bootstrap.js',
        './node_modules/html5shiv/dist/html5shiv.js',
    ].concat(['src/js/*']))
        .pipe(sourcemaps.init())
        .pipe(concat('main.js'))
        .pipe(uglify({ mangle: false }))
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('assets/dist/js'))
        .pipe(browserSync.reload({ stream: true }));
});

function pausableWatch(watchedFiles, tasks) {
  var watcher = watch(watchedFiles, function() {
    watcher.close();
    gulp.start(tasks, function() {
      pausableWatch(watchedFiles, tasks);
    });
  });
}

/**
 * Watch img/scss/js files for changes & recompile
 */
gulp.task('watch', function () {
    pausableWatch(['images/**/*'], ['img']);
    pausableWatch(['src/scss/*.scss', 'src/scss/*/*.scss'], ['sass']);
    pausableWatch(['src/js/*.js'], ['js']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browserSync', 'watch']);
