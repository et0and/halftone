let ctx;
let layers = {};
let halftones = {
    cyan: true,
    yellow: true,
    magenta: true,
    key: true
};
let anglesList = [
{
    yellow: 0,
    cyan: 15,
    magenta: 45,
    key: 75
},
{
    yellow: 90,
    cyan: 105,
    magenta: 75,
    key: 15
},
{
    yellow: 0,
    cyan: 15,
    magenta: 75,
    key: 45
},
{
    yellow: 90,
    cyan: 165,
    magenta: 45,
    key: 105
}
];
let angles = anglesList[0];
let mode = "halftone";
let currentLayer = "original";
let cellSize = 5;

const img = new Image();
img.addEventListener('load', function () {
    changeImage(img);
}, false);
img.src = "cat.png";

function handleFiles(files) {
    layers = {};
    var reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
        changeImage(img);
    };
    reader.readAsDataURL(files[0]);
}

function changeType(type) {
    mode = type;
    changeMode();
}

function changeMode() {
    if (mode == "raster") {
        document.getElementById('raster-layer-select').classList = "field";
        document.getElementById('halftone-layer-select').classList = "field hide";
        drawRasterLayer();
    } else {
        document.getElementById('raster-layer-select').classList = "field hide";
        document.getElementById('halftone-layer-select').classList = "field";
        drawHalftone();
    }
}

function changeRasterLayer(layer) {
    currentLayer = layer;
    drawRasterLayer();
}

function changeHalftoneLayer(element) {
    halftones[element.name] = element.checked;
    drawHalftone();
}

function changeAngle(value) {
    angles = anglesList[value];
    drawHalftone();
}

function changeCellSize(value) {
    cellSize = parseInt(value);
    drawHalftone();
}

changeMode();

function changeImage(img) {
    const canvas = document.getElementById('screen');
    ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const cImg = ctx.createImageData(imageData);
    const mImg = ctx.createImageData(imageData);
    const yImg = ctx.createImageData(imageData);
    const kImg = ctx.createImageData(imageData);
    layers = {
        original: imageData,
        cyan: cImg,
        magenta: mImg,
        yellow: yImg,
        key: kImg
    };

    function putPixel(image, i, c, b) {
        const r = b & 1 ? ((1 - c) * 255) & 0xFF : 0xFF;
        const g = b & 2 ? ((1 - c) * 255) & 0xFF : 0xFF;
        const b = b & 4 ? ((1 - c) * 255) & 0xFF : 0xFF;

        const isWhite = r > 245 && g > 245 && b > 245;

        image.data[i] = r;
        image.data[i+1] = g;
        image.data[i+2] = b;
        image.data[i+3] = isWhite ? 0 : 0xFF;
    }

    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const c = 1 - (r / 255);
        const m = 1 - (g / 255);
        const y = 1 - (b / 255);
        const k = Math.min(c, m, y);
        const c1 = (c - k) / (1 - k);
        const m1 = (m - k) / (1 - k);
        const y1 = (y - k) / (1 - k);
        putPixel(cImg, i, c1, 2);
        putPixel(mImg, i, m1, 1);
        putPixel(yImg, i, y1, 4);
        putPixel(kImg, i, k, 7);
    }

    drawHalftone();
}

function drawRasterLayer() {
    if (ctx === undefined) return;
    ctx.putImageData(layers[currentLayer], 0, 0);
}

function drawHalftone() {
    if (ctx === undefined || layers.key === undefined) return;
    ctx.clearRect(0, 0, layers.key.width, layers.key.height);
    if (halftones.yellow)  screening(layers.yellow, 2, "rgba(255, 255, 0, 1)", angles.yellow);
    if (halftones.cyan)    screening(layers.cyan, 0, "rgba(0, 255, 255, 1)", angles.cyan);
    if (halftones.magenta) screening(layers.magenta, 1, "rgba(255, 0, 255, 1)", angles.magenta);
    if (halftones.key)     screening(layers.key, 0, "rgba(0, 0, 0, 1)", angles.key);
}

function screening(image, channel, color, angle) {
    ctx.fillStyle = color;
    ctx.translate(layers.key.width / 2, layers.key.height / 2);
    ctx.rotate(angle * Math.PI / 180);
    ctx.translate(-layers.key.width / 2, -layers.key.height / 2);
    for (let x = 0; x < layers.key.width; x++) {
        for (let y = 0; y < layers.key.height; y++) {
            const i = (y * layers.key.width + x) * 4;
            const c = image.data[i + channel];
            if (c > 127) continue;
            const size = cellSize * (1 - c / 255);
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}
