var gulp = require('gulp');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
// var babel = require('gulp-babel');
var watch = require('gulp-watch');
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task('ts', function() {
	return gulp.src('./src/**/*')
		.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(ts(tsProject))
		    .on('error', function(e) {
				console.log(e);
				this.emit('end');
			})
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./build/'));
});

gulp.task('clean', function() {
	return del('./build/**/*');
});

gulp.task('watch', function() {
    return gulp.src('src/**/*')
		.on('error', console.log)
        .pipe(watch('src/**/*'))
			.pipe(sourcemaps.init({ loadMaps: true }))
				.pipe(ts(tsProject))
			    .on('error', function(e) {
					console.log(e);
					this.emit('end');
				})
			.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('build', ['ts']);

gulp.task('default', ['watch']);
