/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
module.exports = function (grunt) {
    
    
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsvalidate');
    
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            build: {
                files: [
                    {
                        cwd: 'src/js',
                        src: '**/*',
                        dest: 'dist/kb_common',
                        expand: true
                    }
                ]
            }
        },
        clean: {
            build: {
                src: 'dist'
            }
        },
        watch: {
            files: ['src/js/**/*'],
            tasks: ['build']
        },
        jsvalidate: {
            options: {
                globals: {},
                esprimaOptions: {
                    strict: true,
                    comment: true
                },
                verbose: true
            },
            targetName: {
                files: {
                    src: 'src/js/test.js'
                }
            }
        }
    });
    
    grunt.registerTask('build', [
        'jsvalidate',     
        'copy:build'
    ]);

    
};
