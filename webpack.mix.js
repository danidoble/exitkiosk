let mix = require('laravel-mix');

mix.setPublicPath('exitkiosk/dist');
mix
    .scripts([
        './resources/js/background.js'
    ], './exitkiosk/dist/js/background.js')
    .scripts([
        './resources/js/lang/es.js',
        './resources/js/lang/ja.js',
        './resources/js/lang/ko.js',
        './resources/js/lang/zh_CN.js',
        './resources/js/lang/fr.js',
        './resources/js/config.js'
    ], './exitkiosk/dist/js/config.js')
    .postCss('resources/css/app.css', 'css', [
        require('postcss-import'),
        require('tailwindcss'),
        require('autoprefixer'),
    ])
;