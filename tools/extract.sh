s="1"
out="$HOME/public_html/anigma_web/levels"

let x=1
while [ $x -le 8 ] ; do
    let next=$x+1
    cat levels |
        sed -e s/\",.*//g |
        sed -e s/\"//g |
        awk "/^00$x.*/,/^00$next.*/ {print \$0}" | 
        head -n-2 > "${out}/${s}0$x.level"
    let x=$x+1;
done

cat levels  | sed -e s/\",.*//g | sed -e s/\"//g | awk "/^009.*/,/^010.*/ {print \$00}" | head -n-2 > ${out}/${s}09.level

let x=10
while [ $x -le 60 ] ; do
  let next=$x+1
cat levels  | sed -e s/\",.*//g | sed -e s/\"//g | awk "/^0$x.*/,/^0$next.*/ {print \$0}" | head -n-2 > ${out}/${s}$x.level
    let x=$x+1;
done
