level=$1

pack="";
if [ $level -le 60 ] ; then
    pack='100';
fi

if [[ $level -ge 61 && $level -le 93 ]] ; then
    let level=${level}-60;
    pack='';
fi

if [ $level -ge 94 ] ; then
    pack='100';
fi

while [ $level -gt 60 ] ; do
    let level=${level}-60;
    let pack=$pack+100;
done

let level=$pack+$level

echo $level;
