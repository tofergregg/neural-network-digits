var canvas, ctx, flag = false,
    prevX = 0,
    currX = 0,
    prevY = 0,
    currY = 0,
    dot_flag = false;

var pencolor = "black",
    penwidth = 10;

function init() {
    getCorrectPredictions();
    canvas = document.getElementById('can');
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;

    canvas.addEventListener("mousemove", function (e) {
        findxy('move', e)
    }, false);
    /*
    canvas.addEventListener("touchmove", function (e) {
        findxy('move', e)
    }, false);
    */
    canvas.addEventListener("mousedown", function (e) {
        findxy('down', e)
    }, false);
    /*
    canvas.addEventListener("touchstart", function (e) {
        findxy('down', e)
    }, false);
    */
    canvas.addEventListener("mouseup", function (e) {
        findxy('up', e)
    }, false);
    /*
    canvas.addEventListener("touchend", function (e) {
        findxy('up', e)
    }, false);
    */
    canvas.addEventListener("mouseout", function (e) {
        findxy('out', e)
    }, false);
}

function draw() {
    ctx.beginPath();
    // ctx.lineJoin = "bevel";
    ctx.lineCap = "round";
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = pencolor;
    ctx.lineWidth = penwidth;
    ctx.stroke();
    ctx.closePath();
}

function erase() {
    ctx.canvas.width = w;
    ctx.canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    guessSpan = document.getElementById("guess");
    guessSpan.innerText = ""; 
    hideElement('after_buttons')
}

function postStats(stats) {
    (async () => {
        const rawResponse = await fetch('../cgi-bin/digits/postModelResults.py', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(stats),
        });
        const content = await rawResponse.json();
        // const content = await rawResponse.text();

        console.log(content);
        updateStats(content);
    })();
}

function correct() {
    hideElement('after_buttons');
    if (document.getElementById('clear_chk').checked) {
        erase();
    }
    postStats({
        uuid: window.lastImgUuid,
        prediction: window.lastPrediction,
        correct: true,
        actual: window.lastPrediction,
        clarity: "N/A",
    });
}

function incorrect() {
    hideElement('after_buttons');
    if (document.getElementById('clear_chk').checked) {
        erase();
    }
    let actual = prompt("Oh no! What digit did you write?");
    let answer_a = "A. It is clearly the digit " + actual + " and it completely fills the box";
    let answer_b = "B. It is clearly the digit " + actual + " but it does not completely fill the box";
    let answer_c = "C. It is not clearly the digit " + actual;
    let clarity = prompt("Please answer the following:\n" + 
            "How would you describe the digit you drew?\n" +
            answer_a + "\n" +
            answer_b + "\n" +
            answer_c + "\n\n" +
            "Your answer (A/B/C): "
            );
    if (clarity.toLowerCase() == 'a') {
        clarity = answer_a;
    } else if (clarity.toLowerCase() == 'b') {
        clarity = answer_b;
    } else if (clarity.toLowerCase() == 'c') {
        clarity = answer_c;
    } else {
        clarity = "Not answered";
    }
    
    postStats({
        uuid: window.lastImgUuid,
        prediction: window.lastPrediction,
        correct: false,
        actual: actual,
        clarity: clarity,
    });

}

// from: https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
}

function sendToServer(imgsrc) {
    window.lastImgUuid = uuidv4();
    (async () => {
        const rawResponse = await fetch('../cgi-bin/digits/postImage.py', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'uuid': window.lastImgUuid,
                'imgData': imgsrc,
            }),
        });
        const content = await rawResponse.json();
        // const content = await rawResponse.text();

        console.log(content);
        guessSpan = document.getElementById("guess");
        guessSpan.innerText = "The neural network predicts that the digit is " + content.guess; 
        window.lastPrediction = content.guess;
        showElement('after_buttons');
    })();
}

function showElement(elId) {
    document.getElementById(elId).style.visibility = 'visible';
}

function hideElement(elId) {
    console.log(elId);
    document.getElementById(elId).style.visibility = 'hidden';
}

function cropImageFromCanvas(ctx) {
    var canvas = ctx.canvas;
    let origw = canvas.width;
    let origh = canvas.height;
    let origImg = ctx.getImageData(0, 0, origw, origh);
    var w = origw, h = origh,
    imageData = ctx.getImageData(0,0,canvas.width,canvas.height),
        x, y, index;

    var firstx = w, firsty = h, lastx = 0, lasty = 0 ;
    for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
            index = (y * w + x) * 4;
            if (imageData.data[index+3] > 0) {
                if (firstx > x) {
                    firstx = x;
                }
                if (firsty > y) {
                    firsty = y;
                }
                if (lastx < x) {
                    lastx = x;
                }
                if (lasty < y) {
                    lasty = y;
                }
            } 
        }
    }
    /*
       console.log("firstx: " + firstx);
       console.log("firsty: " + firsty);

       console.log("lastx: " + lastx);
       console.log("lasty: " + lasty);
       */
    let posWidth = lastx - firstx + 1;
    let posHeight = lasty - firsty + 1;
    w = h = Math.max(posWidth, posHeight); 
    console.log("w/h = " + w);

    // minxy = Math.min(firstx, firsty)
    // var cut = ctx.getImageData(pix.x[0], pix.y[0], w, h);
    var cut = ctx.getImageData(firstx, firsty, w, h);

    canvas.width = w;
    canvas.height = h;
    ctx.putImageData(cut, 0, 0);

    var image = canvas.toDataURL();
    canvas.width = origw;
    canvas.height = origh;
    ctx.putImageData(origImg, 0, 0);

    return image;
}

function guess() {
    var imgsrc = cropImageFromCanvas(ctx);
    // var imgsrc = canvas.toDataURL();
    guessSpan = document.getElementById("guess");
    guessSpan.innerText = ""; 
    sendToServer(imgsrc);
    // var dataURL = canvas.toDataURL();
    // document.getElementById("canvasimg").src = dataURL;
    // document.getElementById("canvasimg").style.display = "inline";
}

function findxy(res, e) {
    if (res == 'down') {
        prevX = currX;
        prevY = currY;
        currX = e.pageX - canvas.offsetLeft; // was e.clientX
        currY = e.pageY - canvas.offsetTop;

        flag = true;
        dot_flag = true;
        if (dot_flag) {
            ctx.beginPath();
            ctx.fillStyle = pencolor;
            ctx.fillRect(currX, currY, 2, 2);
            ctx.closePath();
            dot_flag = false;
        }
    }
    if (res == 'up' || res == "out") {
        flag = false;
    }
    if (res == 'move') {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = e.pageX - canvas.offsetLeft;
            currY = e.pageY - canvas.offsetTop;
            draw();
        }
    }
}

function getCorrectPredictions() {
    (async () => {
        const rawResponse = await fetch('../cgi-bin/digits/getStats.py', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });
        const content = await rawResponse.json();
        // const content = await rawResponse.text();
        console.log(content);
        updateStats(content);
    })();
}

function updateStats(stats) {
        numCorrect = document.getElementById('num_correct'); 
        totalGuesses = document.getElementById('total_guesses'); 
        perc_correct = document.getElementById('perc_correct'); 
        numCorrect.innerText = stats.correct_predictions;
        totalGuesses.innerText = stats.total_guesses;
        perc_correct.innerText = Math.round((stats.correct_predictions / stats.total_guesses) * 100, 2);
}
