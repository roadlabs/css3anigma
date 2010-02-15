#!/bin/bash

level="${QUERY_STRING}"
if [ -z "${level}" ] ; then
    level=1
fi

log=`cat`
if [ -z "${log}" ] ; then
  level=$level;
else 
  mkdir logs/$level;
  file=`date +%m%d%y_%H_%M_%s`;
  let lastlevel=$level - 1;
  echo "${log}" > logs/$lastlevel/$file;
fi

if [ ! -f ../levels/${level}.level ] ; then
    offset=$(($level % 100));
    let level=$level-$offset;
    let level=$level+101;
fi

echo "Status: 200";
echo "Content-type: text/html";
echo "";
cat ../levels/${level}.level;

#printenv
