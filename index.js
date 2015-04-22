// Metalsmith Jade Templater.

var jade = require('jade'),
    path = require('path'),
    fs = require('fs'),
    Q = require('q');

function jadeTemplater (baseTemplatesDir) {
    var fs_readFile = Q.denodeify(fs.readFile);
    
    return function (files, metalsmith, done) {
        var jadeTemplatePromises = [];
        
        Object.keys(files).forEach(function (filename) {
            var file = files[filename];
            
            if (!file.template) {
                // No template file specified, do nothing.
                return;
            }
            
            console.log('Setting basedir:', baseTemplatesDir);
            
            // Resolve the relative template file path to an absolute path.
            var templateFilePath = path.resolve(baseTemplatesDir + '/' + file.template);
            
            console.log('Resolved templateFilePath:', templateFilePath);
            
            var templateReadPromise = fs_readFile(templateFilePath, 'utf8');
            templateReadPromise
                .then(function (fileBuffer) {
                    var templateContents = fileBuffer.toString();
                    
                    var jadeCompileOptions = {
                        pretty: true, 
                        filename: filename, 
                        basedir: baseTemplatesDir
                    };
                    
                    var templateFn = jade.compile(templateContents, jadeCompileOptions);
                    
                    var locals = Object.create(null);
                    locals.data = file;
                    
                    var htmlOutput = templateFn(locals);
                    
                    file.contents = new Buffer(htmlOutput);
                })
                .catch(function (error) {
                    // TODO: How should this error be handled?
                    console.error(error.toString());
                    
                    throw error;
                });
            
            jadeTemplatePromises.push(templateReadPromise);
        });
        
        Q.all(jadeTemplatePromises)
            .then(function (result) {
                done();
            })
            .catch(function (error) {
                console.error(error.toString());
            });
    };
}

module.exports = jadeTemplater;
