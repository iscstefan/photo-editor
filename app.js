const app = {
    offscreenCanvas: null,
    visibleCanvas: null,
    selectionCanvas: null,
    currentEffect: "normal",
    selectEnabled: false,
    sw: null,
    sh: null,
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
    mouseDown: false
}

app.draw = function () {
    switch (app.currentEffect) {
        case "normal":
            const vContext = app.visibleCanvas.getContext("2d");
            const imageData = app.offscreenCanvas.getContext("2d").getImageData(app.x0, app.y0, app.sw, app.sh);
            vContext.putImageData(imageData, app.x0, app.y0);

            break;
    }
}

app.drawSelection = function () {
    if (app.selectEnabled && app.mouseDown) {

        const ctx = app.selectionCanvas.getContext("2d");
        ctx.clearRect(0, 0, app.visibleCanvas.width, app.visibleCanvas.height);

        //calculare dimensiuni dreptunghi selectie
        const x0 = app.x0 * app.visibleCanvas.width / app.visibleCanvas.clientWidth;
        const y0 = app.y0 * app.visibleCanvas.height / app.visibleCanvas.clientHeight;
        const x1 = app.x1 * app.visibleCanvas.width / app.visibleCanvas.clientWidth;
        const y1 = app.y1 * app.visibleCanvas.height / app.visibleCanvas.clientHeight;

        const w = x0 - x1 > 0 ? - Math.sqrt((x0 - x1) ** 2) : Math.sqrt((x0 - x1) ** 2);
        const h = y0 - y1 > 0 ? - Math.sqrt((y0 - y1) ** 2) : Math.sqrt((y0 - y1) ** 2)

        ctx.strokeRect(x0, y0, w, h);
        requestAnimationFrame(app.drawSelection);
    }
}

app.load = function () {
    app.visibleCanvas = document.getElementById("visibleCanvas");
    app.selectionCanvas = document.getElementById("selectionCanvas");

    app.selectionCanvas.x = app.visibleCanvas.x;
    app.selectionCanvas.y = app.visibleCanvas.y;

    //abonare la evenimente pentru tratarea selectiei
    app.selectionCanvas.addEventListener("mousedown", function (ev) {
        if (app.selectEnabled === true) {
            app.x0 = ev.offsetX;
            app.y0 = ev.offsetY;
            app.mouseDown = true;
        }
    });

    app.selectionCanvas.addEventListener("mousemove", function (ev) {
        if (app.selectEnabled === true)
            if (app.mouseDown === true) {
                app.x1 = ev.offsetX;
                app.y1 = ev.offsetY;
                requestAnimationFrame(app.drawSelection);
            }
    });

    app.selectionCanvas.addEventListener("mouseup", function (ev) {
        if (app.selectEnabled === true)
            if (app.mouseDown === true) {
                app.mouseDown = false;
            }
    });

    //mod selectare
    const enableSelectButton = document.getElementById("selectionButton");
    enableSelectButton.addEventListener("click", function (){
        if(app.visibleCanvas) {
            app.selectEnabled = !app.selectEnabled;

            //resetare selectie initiala
            if(!app.selectEnabled) {
                const ctx = app.selectionCanvas.getContext("2d");
                ctx.clearRect(0, 0, app.visibleCanvas.width, app.visibleCanvas.height);
                app.setSelectedArea(0, 0, app.visibleCanvas.width, app.visibleCanvas.height);
            }
        }
        
    });
    
    app.offscreenCanvas = document.createElement("canvas");

    app.enableDragAndDrop();

    //implementare fileBrowser
    document.getElementById("fileBrowser").addEventListener("change", function (ev) {
        const files = ev.target.files;

        const reader = new FileReader();
        
        reader.addEventListener("load", function (ev) {
            const dataUrl = ev.target.result;

            const img = document.createElement("img");

            img.addEventListener("load", (ev) => {
                app.selectionCanvas.width = app.visibleCanvas.width = app.offscreenCanvas.width = img.naturalWidth;
                app.selectionCanvas.height = app.visibleCanvas.height = app.offscreenCanvas.height = img.naturalHeight;

                //canvasul pentru selectie devine vizibil
                app.selectionCanvas.style.display = "block";

                const oContext = app.offscreenCanvas.getContext("2d");
                oContext.drawImage(ev.target, 0, 0);

                app.currentEffect = "normal";

                //initial, se selecteaza toata imaginea
                app.setSelectedArea(0, 0, img.naturalWidth, img.naturalHeight);
                app.draw();
            })

            img.src = dataUrl;
        })

        reader.readAsDataURL(files[0]);
    })
};


app.setSelectedArea = function (x, y, w, h) {
    app.x0 = x;
    app.y0 = y;
    app.sw = w;
    app.sh = h;
}

app.enableDragAndDrop = function () {
    document.addEventListener("dragover", function (e) {
        e.preventDefault();
    })

    document.addEventListener("drop", function (e) {
        e.preventDefault();

        let data = e.dataTransfer;
        let files = data.files;

        if (files.length > 0) {
            let file = files[0];

            let fileReader = new FileReader();
            fileReader.addEventListener("load", function (e) {
                let dataUrl = e.target.result;

                let img = document.createElement("img");

                img.addEventListener("load", function () {
                    app.selectionCanvas.width = app.visibleCanvas.width = app.offscreenCanvas.width = img.naturalWidth;
                    app.selectionCanvas.height = app.visibleCanvas.height = app.offscreenCanvas.height = img.naturalHeight;
                    app.selectionCanvas.style.display = "block";


                    let context = app.offscreenCanvas.getContext('2d');
                    context.drawImage(img, 0, 0);

                    app.currentEffect = "normal";
                    app.setSelectedArea(0, 0, img.naturalWidth, img.naturalHeight);
                    app.draw();

                    //drawHistogram();
                })

                img.src = dataUrl;
            })
            fileReader.readAsDataURL(file);
        }
    })
}