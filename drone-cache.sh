#!/bin/bash

MAIN_REPO="DevExpress/DevExtreme"
MAIN_BRANCH=$(node -e "console.log(require('./package.json').version.split(/\./g).slice(0, 2).join('_'))")

CACHE_DIRS="node_modules dotnet_packages"
CACHE_URL="http://devextreme-ci-cache.s3.amazonaws.com/$MAIN_BRANCH"

if [ "$1" == "rebuild" ]; then
    if [ "$DRONE_BUILD_EVENT" != "push" ] || [ "$DRONE_REPO" != "$MAIN_REPO" ] || [ "$DRONE_BRANCH" != "$MAIN_BRANCH" ]; then
        echo "Skip"
        exit 0
    fi

    for i in $CACHE_DIRS; do
        if [ -e $i ]; then
            if tar cfz - $i | curl -Lsf -X PUT -H "x-amz-acl: bucket-owner-full-control" --data-binary @- "$CACHE_URL/$i.tar.gz"; then
                echo "Uploaded: $i"
            else
                echo "Failed to upload: $i"
            fi
        else
            echo "Does not exist: $i"
        fi
    done

    exit 0
fi

if [ "$1" == "restore" ]; then
    for i in $CACHE_DIRS; do
        if curl -Lsf "$CACHE_URL/$i.tar.gz" | tar xfz - 2>/dev/null; then
            echo "Restored: $i"
        else
            echo "Failed to restore: $i"
        fi
    done

    exit 0
fi


echo "Not enough arguments"
exit 1
