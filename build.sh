#!/bin/sh
# this script is called by `npm run build`
# it builds a release-mode (dist) build for the gh-pages git branch
# for other branches, it builds in development mode.

current_branch=`git name-rev --name-only HEAD`

if [ $current_branch = 'gh-pages' ]
then
    npm run build:dist
else
    npm run build:dev
fi
