#!/bin/bash

glib-compile-schemas schemas

DIR="po"
SUFFIX="po"

xgettext --from-code='utf-8' -k_ -kN_ -o $DIR/files-launcher.pot prefs.js extension.js

if ! [ -x "$DIR"/en.$SUFFIX ]
then
    msginit --input="$DIR"/files-launcher.pot --output-file="$DIR"/en.po --no-translator
else
    for file in "$DIR"/*.$SUFFIX 
    do
        msgmerge --previous --update "$DIR"/$file "$DIR"/files-launcher.pot
    done
fi

for file in "$DIR"/*.$SUFFIX
do 
	lingua=${file%.*}
	lingua=${lingua#*/}
	msgfmt $file
	mkdir locale/$lingua/LC_MESSAGES -p
	mv messages.mo locale/$lingua/LC_MESSAGES/files-launcher.mo
done
