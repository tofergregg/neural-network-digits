# Simple Digit Recognizer

This is a simple web page that uses a pre-trained neural network to
predict digits typed into a canvas box.

The original model was trained on the [MNIST dataset](http://yann.lecun.com/exdb/mnist/).

You will need to move the `cgi-bin` directory to a directory called `digits` inside the `cgi-bin` directory on your server. If the `cgi-bin` directory is not located at `../cgi-bin/`, you will need to modify the `CGIBIN_PATH` in `js/functions.js` to reflect its location.
