
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext('2d');

const pointer = {
    x: .5 * window.innerWidth,
    y: .5 * window.innerHeight,
};
const params = {
    pointsNumber: 32,
    widthFactor: 28,
};

const points = [];

window.addEventListener("mousemove", e => {
    updateMousePosition(e.x, e.y);
});
window.addEventListener("touchstart", e => {
    const touch = e.touches[0];
    updateMousePosition(touch.x, touch.y);
});
window.addEventListener("touchmove", e => {
    const touch = e.touches[0];
    updateMousePosition(touch.x, touch.y);
});

function updateMousePosition(eX, eY) {
    pointer.x = (eX - 6);
    pointer.y = (eY + 4);
}



setupCanvas();
setInterval(drawLines, 16.666);
function addPoint() {
    let x = pointer.x
    let y = pointer.y
    points.unshift({ x: x, y: y });
    if (points.length > params.pointsNumber) {
        points.pop();
    }
}

window.addEventListener("resize", setupCanvas);;

function drawLines() {
    addPoint()
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 1;
    ctx.strokeStyle = "yellow";

    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 1; i < points.length - 1; i++) {
        const xc = .5 * (points[i].x + points[i + 1].x);
        const yc = .5 * (points[i].y + points[i + 1].y);
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        ctx.lineWidth = params.widthFactor
    }
    ctx.stroke();
}
function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.filter = "blur(4px)"
}
