function initializeSketchpad(){
    let touchend;
    let canvas = document.getElementById('sketchpad');
    let context = canvas.getContext('2d');
    let canvasOffset = getOffsetSum(canvas);

    const footprint = {
        width: 28,
        height: 28
    };

    let isRecognized = false;
    const zoom = 10;

    window.clearSketchpad = function clearSketchpad () {
        context.clearRect(0,0,footprint.width*zoom,footprint.height*zoom);
        isRecognized = false;
    };
    window.clearSketchpad();

    function getOffsetSum(elem) {
        let top=0;
        let left=0;
        while(elem) {
            top = top + parseInt(elem.offsetTop)
            left = left + parseInt(elem.offsetLeft)
            elem = elem.offsetParent
        }

        return {top, left}
    }

    const drawer = {
        isDrawing: false,
        touchstart(coors) {
            context.beginPath();
            context.lineWidth = 20;
            context.lineCap="round";
            context.moveTo(coors.x-canvasOffset.left, coors.y-canvasOffset.top);
            this.isDrawing = true;
        },
        touchmove(coors) {
            if (this.isDrawing) {
				try {
					clearTimeout(touchend)
				} catch(e) {

				}
                if (isRecognized) {
                    clearSketchpad();
                }
                context.lineTo(coors.x-canvasOffset.left, coors.y-canvasOffset.top);
                context.stroke();
            }
        },
        touchend(coors) {
            if (this.isDrawing) {
                this.touchmove(coors);
                this.isDrawing = false;
            }
        }
    };

    function draw(event) {
        let type = null;

        switch(event.type){
            case "mousedown":
                    event.touches = [];
                    event.touches[0] = {
                        pageX: event.pageX,
                        pageY: event.pageY
                    };
                    type = "touchstart";
            break;
            case "mousemove":
                    event.touches = [];
                    event.touches[0] = {
                        pageX: event.pageX,
                        pageY: event.pageY
                    };
                    type = "touchmove";
            break;
            case "mouseup":
                    event.touches = [];
                    event.touches[0] = {
                        pageX: event.pageX,
                        pageY: event.pageY
                    };
                    type = "touchend";
            break;
        }

        let coors;
        if(event.type === "touchend") {
            coors = {
                x: event.changedTouches[0].pageX,
                y: event.changedTouches[0].pageY
            };
        }
        else {
            coors = {
                x: event.touches[0].pageX,
                y: event.touches[0].pageY
            };
        }
        type = type || event.type
        drawer[type](coors);
    }

    const touchAvailable = ('createTouch' in document) || ('ontouchstart' in window);

    if(touchAvailable){
        canvas.addEventListener('touchstart', draw, false);
        canvas.addEventListener('touchmove', draw, false);
        canvas.addEventListener('touchend', draw, false);
    }
    else {
        canvas.addEventListener('mousedown', draw, false);
        canvas.addEventListener('mousemove', draw, false);
        canvas.addEventListener('mouseup', draw, false);
    }

    window.addEventListener("resize", event => {
        event.preventDefault();
        canvasOffset = getOffsetSum(canvas);
    }, false);

    document.body.addEventListener('touchmove', event => {
        event.preventDefault();
    }, false);
}

function centerImage(img) {
    var meanX = 0;
    var meanY = 0;
    var rows = img.length;
    var columns = img[0].length;
    var sumPixels = 0;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            var pixel = (1 - img[y][x]);
            sumPixels += pixel;
            meanY += y * pixel;
            meanX += x * pixel;
        }
    }
    meanX /= sumPixels;
    meanY /= sumPixels;

    var dY = Math.round(rows/2 - meanY);
    var dX = Math.round(columns/2 - meanX);
    return {transX: dX, transY: dY};
}

function getBoundingRectangle(img, threshold) {
    var rows = img.length;
    var columns = img[0].length;
    var minX=columns;
    var minY=rows;
    var maxX=-1;
    var maxY=-1;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            if (img[y][x] < threshold) {
                if (minX > x) minX = x;
                if (maxX < x) maxX = x;
                if (minY > y) minY = y;
                if (maxY < y) maxY = y;
            }
        }
    }
    return { minY: minY, minX: minX, maxY: maxY, maxX: maxX};
}

function imageDataToGrayscale(imgData) {
    var grayscaleImg = [];
    for (var y = 0; y < imgData.height; y++) {
        grayscaleImg[y]=[];
        for (var x = 0; x < imgData.width; x++) {
            var offset = y * 4 * imgData.width + 4 * x;
            var alpha = imgData.data[offset+3];
            if (alpha == 0) {
                imgData.data[offset] = 255;
                imgData.data[offset+1] = 255;
                imgData.data[offset+2] = 255;
            }
            imgData.data[offset+3] = 255;

            grayscaleImg[y][x] = imgData.data[y*4*imgData.width + x*4 + 0] / 255;
        }
    }
    return grayscaleImg;
}

function convertDrawToArray() {
    const canvas = document.getElementById('sketchpad');
    const context = canvas.getContext('2d');

            let imgData = context.getImageData(0, 0, 280, 280);

            grayscaleImg = imageDataToGrayscale(imgData);
            const boundingRectangle = getBoundingRectangle(grayscaleImg, 0.01);
            const trans = centerImage(grayscaleImg);

            const canvasCopy = document.createElement("canvas");
            canvasCopy.width = imgData.width;
            canvasCopy.height = imgData.height;
            const copyCtx = canvasCopy.getContext("2d");
            const brW = boundingRectangle.maxX+1-boundingRectangle.minX;
            const brH = boundingRectangle.maxY+1-boundingRectangle.minY;
            const scaling = 190 / (brW>brH?brW:brH);
            // scale
            copyCtx.translate(canvas.width/2, canvas.height/2);
            copyCtx.scale(scaling, scaling);
            copyCtx.translate(-canvas.width/2, -canvas.height/2);
            // translate to center of mass
            copyCtx.translate(trans.transX, trans.transY);
            copyCtx.drawImage(context.canvas, 0, 0);

            // now bin image into 10x10 blocks (giving a 28x28 image)
            imgData = copyCtx.getImageData(0, 0, 280, 280);
            grayscaleImg = imageDataToGrayscale(imgData);
            console.log(grayscaleImg);

            const nnInput = new Array(784);
            const nnInput2 = [];
            for (var y = 0; y < 28; y++) {
	            for (var x = 0; x < 28; x++) {
	                let mean = 0;
	                for (let v = 0; v < 10; v++) {
	                    for (let h = 0; h < 10; h++) {
	                        mean += grayscaleImg[y*10 + v][x*10 + h];
	                    }
	                }
	                mean = (1 - mean / 100); // average and invert
	                nnInput[x*28+y] = (mean - .5) / .5;
	            }
	        }

            
	        context.clearRect(0, 0, canvas.width, canvas.height);
	        context.drawImage(copyCtx.canvas, 0, 0);
	        for (var y = 0; y < 28; y++) {
	            for (var x = 0; x < 28; x++) {
	                const block = context.getImageData(x * 10, y * 10, 10, 10);
	                const newVal = 255 * (0.5 - nnInput[x*28+y]/2);
	                nnInput2.push(Math.round((255-newVal)/255*100)/100);
	                for (let i = 0; i < 4 * 10 * 10; i+=4) {
	                        block.data[i] = newVal;
	                        block.data[i+1] = newVal;
	                        block.data[i+2] = newVal;
	                        block.data[i+3] = 255;
	                }
	                context.putImageData(block, x * 10, y * 10);
	            }
	        }

            return nnInput2;
}