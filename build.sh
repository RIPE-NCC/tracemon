#!/bin/sh

# Set your directories here:
css_location='dev/view/css/'
css_dist_location='dev/view/css/'
#deployment_dir='/Volumes/PersonalDisk/work/weir-dev-atlas/measurements/static/measurements/widgets/tracemon/'
deployment_dir='/Volumes/PersonalDisk/work/git-workspace/atlas-ui/measurements/static/measurements/widgets/tracemon/'

#if [ "$1" == "-css" ]; then
#rm ${css_dist_location}style-lib-dist.min.css
#rm ${css_dist_location}style-lib-dist.css
#cat ${css_location}/*.css > ${css_location}style-lib-dist.tmp
#cat ${css_location}style-lib-header.tpl ${css_location}style-lib-dist.tmp ${css_location}style-lib-footer.tpl > ${css_location}style-lib-dist.scss
#rm ${css_location}style-lib-dist.tmp
#
#sass ${css_location}style-lib-dist.scss ${css_dist_location}style-lib-dist.css
#rm ${css_location}style-lib-dist.scss
#minify -o ${css_dist_location}style-lib-dist.min.css ${css_dist_location}style-lib-dist.css
#fi


#r.js -o app.build.1.js
#r.js -o app.build.2.js

cp -fR * ${deployment_dir}
rm ${deployment_dir}*html
