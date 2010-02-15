level=$1

pack="";
if [ $level -ge 34 ] ; then
    let level=${level}-33;
    pack='100';
fi
while [ $level -gt 60 ] ; do
    let level=${level}-60;
    let pack=$pack+100;
done

let level=$pack+$level

echo $level;