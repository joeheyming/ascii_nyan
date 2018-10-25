ascii_nyan
==========

put a nyan cat on the command line, or in emacs

usage
==========
```bash
./nyan.sh [-e] [-h] [-m]

-e --> run in emacs
-m --> play music
-h --> show help
```
^_^

Make sure when running emacs that you start the emacsclient server:

M-x server-start

Enjoy!

nyan server
==========

Now you can run a nodejs server.

I found code at https://github.com/hugomd/parrot.live
and it had the same directory structure as ascii_nyan.

I dropped it in, ran npm install and voila!

curl localhost:3000 # <~ so awesome!

# :nyancat:
![nyan](nyan.gif)
