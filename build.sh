#!/bin/sh

css_location='dev/view/css/'
css_dist_location='dev/view/css/'
deployment_dir='/Volumes/PersonalDisk/work/git-workspace/atlas-ui/measurements/static/measurements/widgets/latencymon/'

if [ "$1" == "-css" ]; then
rm ${css_dist_location}style-lib-dist.min.css
rm ${css_dist_location}style-lib-dist.css
cat ${css_location}/*.css > ${css_location}style-lib-dist.tmp
#cleancss -o ${css_location}style-lib-dist.min.tmp ${css_location}style-lib-dist.tmp
cat ${css_location}style-lib-header.tpl ${css_location}style-lib-dist.tmp ${css_location}style-lib-footer.tpl > ${css_location}style-lib-dist.scss
rm ${css_location}style-lib-dist.tmp

sass ${css_location}style-lib-dist.scss ${css_dist_location}style-lib-dist.css
rm ${css_location}style-lib-dist.scss
#lessc ${css_location}style-lib-dist.min.scss ${css_location}style-lib-dist.css
#cleancss --s0 --skip-aggressive-merging --skip-media-merging --skip-restructuring  -o ${css_dist_location}style-lib-dist.min.css ${css_dist_location}style-lib-dist.css
minify -o ${css_dist_location}style-lib-dist.min.css ${css_dist_location}style-lib-dist.css
#mv ${css_location}/images ${css_dist_location}/images
#mv ${view_location}/fonts ${dist_location}/fonts
#mv ${view_location}/img ${dist_location}/img
fi


#r.js -o app.build.1.js
r.js -o app.build.2.js

cp -fR * ${deployment_dir}
rm ${deployment_dir}*html
