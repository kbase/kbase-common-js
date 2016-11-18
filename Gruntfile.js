/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
module.exports = function (grunt) {
    
    
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            build: {
                files: [
                    {
                        cwd: 'src/js',
                        src: '**/*',
                        dest: 'dist/kb/common',
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
        }
    });
    
    grunt.registerTask('build', [        
        'copy:build'
    ]);
    
};
