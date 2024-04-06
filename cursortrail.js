function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (!isMobile()) {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext('2d');

    const pointer = {
        x: .5 * window.innerWidth,
        y: .5 * window.innerHeight,
    };
    const params = {
        pointsNumber: 31,
        widthFactor: 1,
    };

    const points = [];
    const rate = 1000;

    window.addEventListener("click", e => {
        updateMousePosition(e.pageX, e.pageY);
    });
    window.addEventListener("mousemove", e => {
        updateMousePosition(e.pageX, e.pageY);
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
        points.push({ x: x, y: y });
        if (points.length > params.pointsNumber) {
            points.shift();
        }
    }

    window.addEventListener("resize", setupCanvas);;

    function drawLines() {
        addPoint()
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = "yellow";

        ctx.lineCap = "round";
        ctx.beginPath();

        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 1; i++) {
            const xc = .5 * (points[i].x + points[i + 1].x);
            const yc = .5 * (points[i].y + points[i + 1].y);
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            ctx.lineWidth = params.widthFactor * (i);
            ctx.stroke();
        }

        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
    }


    function setupCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}
