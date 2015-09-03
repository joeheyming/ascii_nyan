#!/bin/bash

function usage() { 
    cat <<EOF
./nyan.sh [-e] [-h] [-m]
-e --> run in emacs
-m --> play music
-h --> show help

^_^
EOF
    exit 1;
}

function init() { 
    return;
}
function nextFrame() {
    clear;
    cat /tmp/nyan;
}

while getopts "meh" o; do
    case "${o}" in
	e) 
	    function init() {
		emacsclient -e '(if (get-buffer "nyan") (kill-buffer "nyan"))' > /dev/null;
		emacsclient --no-wait -c /tmp/nyan > /dev/null;
	    };
	    function nextFrame() {
		emacsclient -e '(progn (switch-to-buffer "nyan") (revert-buffer t t t))' > /dev/null; 
	    };
	    ;;
	h)
	    h='1';
	    ;;
	m)  
	    m="1";
	    ;;
	*)
	    ;;
    esac
done
if [ ! -z "${h}" ]; then usage; fi

init;

if [ ! -z "${m}" ]; then
    echo '♫♪♫♪♫♪♫♪♫♪♫♪♫♪';
    if [ "$OSTYPE" = linux-gnu ]; then
        xdg-open ./original.mp3
    else
        open ./original.mp3 &
    fi
fi

cat <<EOF
Running NYAN!
    Type Ctrl-c to exit"
EOF
BASEDIR=`dirname $0`;
chmod 777 /tmp/nyan;
FRAMEDIR="$BASEDIR/frames"
frames=`ls $FRAMEDIR | grep txt$ | sort`;
while true; 
do
    for x in $frames; do 
        cat $FRAMEDIR/$x > /tmp/nyan;
        sleep .2;
	nextFrame;
    done; 
done;
