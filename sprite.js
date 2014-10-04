var gutil = require('gulp-util');
var log = gutil.log;
//var PluginError = gutil.PluginError;
var path = require('path');
var sprite = require('node-sprite');
var Def = require('./deferred.js');
var exec = require('child_process').exec;
var fs = require('fs');
var imagemagick = require('node-imagemagick');

var defaultStyles = [
  '.{I}',
  '  display: inline-block;',
  '  background: url("{DIR}/{I}.png?{HASH}") no-repeat 0 0;',
  ''
].join('\n');

var defaultStylesTmpl = [
  '.i--{F}',
  '  width: {W}px;',
  '  height: {H}px;',
  '  background-position: -{PX}px -{PY}px;',
  ''
].join('\n');
var retinaStyles = [
    '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
    '  .{I}',
    '    background-image: url("{DIR}/{I}@2x.png?{HASH}");',
    '    background-size: {S}px auto;\n',
].join('\n');

module.exports = function (options) {
  if (! ('buildDir' in options) ) {
    options.buildDir = 'build/';
  }
  if (! ('dir' in options) ) {
    options.dir = '';
  }

  sprite.sprites({
    path: path.resolve(options.src)
  }, function (err, result) {
    if (err) {
      log(gutil.colors.red(err));
    } else {

      var spriteStr = '';
      var promises = [];
      log('folders:', gutil.colors.green(Object.keys(result).join(',')));
      
      Object.keys(result).forEach(function (e) {

        var defer = Def();
        var pack = result[e];
        var currentStyles = defaultStyles
          .replace(/\{DIR\}/g, options.dir)
          .replace(/\{I\}/g, e)
          .replace(/\{HASH\}/g, pack.shortsum());

        var spritePath = pack.path + '/' + pack.filename();
        var lnPath = [options.buildDir, e, '@2x.png'].join('');

        pack.images.forEach(function (file) {
          currentStyles += defaultStylesTmpl
            .replace('{F}', file.name)
            .replace('{W}', Math.ceil(file.width / 2))
            .replace('{H}', Math.ceil(file.height / 2))
            .replace('{PX}', Math.round(file.positionX / 2))
            .replace('{PY}', Math.round(file.positionY / 2))
        });
        retinaStyles = retinaStyles
            .replace(/\{DIR\}/g, options.dir)
            .replace(/\{I\}/g, e)
            .replace(/\{HASH\}/g, pack.shortsum())
            .replace('{S}', Math.round(pack.mapper.width / 2));

        spriteStr += currentStyles + retinaStyles;
        promises.push(defer);
        exec('ln -sf ' + [spritePath, lnPath].join(' '), {}, function (error, stdout, stderr) {
          if (error) {
            log(gutil.colors.red(error));
          } else {
            log('ln -sf ', [spritePath, lnPath].join(' '), gutil.colors.green('successed!'));
            defer.resolve({
              spritePath : spritePath,
              name: e,
              height: pack.mapper.height
            });
          }
          if (stderr) {
            log(gutil.colors.red(stderr));
          }
          if (stdout) {
            log(stdout);
          }
        });
      });

      Def.when(promises).then(function (retObj) {
        log(gutil.colors.green('all promises resolved!'));
        fs.writeFile(path.resolve(options.dest), spriteStr, function (error, result) {
          if (result) {
            log(result);
          }
          if (error) {
            log(gutil.colors.red(error));
          } else {
            var imagemagickPromises = [];
            retObj.forEach(function(o) {
              var imagemagickPromise = Def();
              imagemagickPromises.push(imagemagickPromise);
              imagemagick.resize({
                srcPath: o.spritePath,
                dstPath: options.buildDir + o.name + '.png',
                width: 0,
                height: Math.round(o.height / 2),
                format: 'png',
                quality: 1
              }, function(err, stdout, stderr) {
                if (err) {
                  log(err, stdout, stderr);
                } else {
                  log(stdout);
                  imagemagickPromise.resolve();
                }
              });
            });
            Def.when(imagemagickPromises).then(function(){
              options.done();
            });
          }
        });
      });
    }
  });
}
