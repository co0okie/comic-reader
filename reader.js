const container = document.getElementById('container')

let scale = 1;
let anchorX = 0; // leftward
let anchorY = 0; // downward
let width;
let height;

window.addEventListener('wheel', e => e.preventDefault(), { passive: false })

window.onload = async function() {
    const files = await new Promise(resolve => {
        document.querySelector("input").onchange = e => {
            resolve([...e.target.files].filter(f => f.type.includes('image/')))
        }
    })
    
    document.querySelector("label").style.display = 'none'
    
    await Promise.all(files.map((file, i) => new Promise(r => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        const image = new Image()
        image.addEventListener('click', () => console.log(i))
        container.appendChild(image);
        reader.onload = () => {
            image.src = reader.result;
            image.onload = r
        }
    })))
    
    width = container.offsetWidth;
    height = container.offsetHeight;
    
    document.addEventListener('wheel', e => {
        if (!e.deltaY) return;
        let rate = 100 ** (-0.0005 * e.deltaY);
        const x = window.innerWidth - e.clientX, y = e.clientY;
        let newScale = scale * rate;
        if (newScale < 1) rate = 1 / scale;
        if (newScale > 1000) rate = 1000 / scale;
        scale *= rate;
        width = container.offsetWidth * scale
        height = container.offsetHeight * scale
        anchorX = x + rate * (anchorX - x);
        anchorY = y + rate * (anchorY - y);
        if (anchorX > 0) anchorX = 0
        if (anchorX < window.innerWidth - width) anchorX = window.innerWidth - width
        if (anchorY > 0) anchorY = 0
        if (anchorY < window.innerHeight - height) anchorY = window.innerHeight - height
        container.style.scale = `${scale}`
        container.style.translate = `${-anchorX}px ${anchorY}px`
    })
    
    document.addEventListener('mousedown', e => {
        function onDrag(e) {
            anchorX -= e.movementX;
            anchorY += e.movementY;
            if (anchorX > 0) anchorX = 0
            if (anchorX < window.innerWidth - width) anchorX = window.innerWidth - width
            if (anchorY > 0) anchorY = 0
            if (anchorY < window.innerHeight - height) anchorY = window.innerHeight - height
            container.style.scale = `${scale}`
            container.style.translate = `${-anchorX}px ${anchorY}px`
        }
        document.addEventListener('mousemove', onDrag)
        document.addEventListener('mouseup', () => document.removeEventListener('mousemove', onDrag), {once: true})
    })
    
    document.addEventListener('keydown', e => {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                direction.y = -1;
                startPanning()
                break;
            case 'KeyA':
            case 'ArrowLeft':
                direction.x = 1;
                startPanning()
                break;
            case 'KeyS':
            case 'ArrowDown':
                direction.y = 1;
                startPanning()
                break;
            case 'KeyD':
            case 'ArrowRight':
                direction.x = -1;
                startPanning()
                break;
        }
    })
    
    document.addEventListener('keyup', e => {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                if (direction.y === -1) direction.y = 0;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                if (direction.x === 1) direction.x = 0;
                break;
            case 'KeyS':
            case 'ArrowDown':
                if (direction.y === 1) direction.y = 0;
                break;
            case 'KeyD':
            case 'ArrowRight':
                if (direction.x === -1) direction.x = 0;
                break;
        }
    })
}

let direction = {x: 0, y: 0}
let panning = false
let lastTimeStamp;
function pan(timeStamp) {
    if (direction.x === 0 && direction.y === 0) {
        panning = false;
        return;
    }
    const dt = timeStamp - lastTimeStamp
    anchorX -= dt * direction.x;
    anchorY -= dt * direction.y;
    if (anchorX > 0) anchorX = 0
    if (anchorX < window.innerWidth - width) anchorX = window.innerWidth - width
    if (anchorY > 0) anchorY = 0
    if (anchorY < window.innerHeight - height) anchorY = window.innerHeight - height
    container.style.scale = `${scale}`
    container.style.translate = `${-anchorX}px ${anchorY}px`
    
    lastTimeStamp = timeStamp
    window.requestAnimationFrame(pan)
}

function startPanning() {
    if (panning) return;
    panning = true;
    lastTimeStamp = document.timeline.currentTime
    window.requestAnimationFrame(pan)
}
