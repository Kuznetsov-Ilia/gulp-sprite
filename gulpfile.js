'use strict';

var gulp = require('gulp');
var sprite = require('./sprite.js');

gulp.task('sprite', function (cb) {
  sprites({
    src: 'images/sprites',// require! 
    dest: 'build/styles/sprites.styl',// require! where to write styl file
    dir: '',// optional. default ''. `background: url("{DIR}/{I}.png")`
    buildDir: 'build/', // optional. default 'build/'
    done: cb // gulp callback to be called when task is complete 
  });
});
