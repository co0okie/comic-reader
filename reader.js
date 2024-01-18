window.addEventListener('wheel', e => e.preventDefault(), { passive: false })

window.onload = async function() {
    const files = await new Promise(r => {
        document.querySelector("input").onchange = r
    }).then(e => Array.from(e.target.files)
        .filter(f => f.type.includes('image/'))
        .map((f, i) => ({file: f, index: i}))
    )
    
    document.querySelector("label").style.display = 'none'
    
    const container = document.getElementById('container')
    
    await Promise.all(files.slice(0, 6).map(file => loadFile(file)))
    
    let scale = 1;
    let anchorX = 0; // leftward
    let anchorY = 0; // downward
    let width = container.offsetWidth;
    let height = container.offsetHeight;
    let current = files[0];
    
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
        
        updateCurrent();
    })
    
    document.addEventListener('mousedown', e => {
        function onDrag(e) {
            anchorX -= e.movementX;
            anchorY += e.movementY;
            if (anchorX > 0) anchorX = 0
            if (anchorX < window.innerWidth - width) anchorX = window.innerWidth - width
            if (anchorY > 0) anchorY = 0
            if (anchorY < window.innerHeight - height) anchorY = window.innerHeight - height
            container.style.translate = `${-anchorX}px ${anchorY}px`
            
            updateCurrent();
        }
        document.addEventListener('mousemove', onDrag)
        document.addEventListener('mouseup', () => document.removeEventListener('mousemove', onDrag), {once: true})
    })
    
    document.addEventListener('keydown', e => {
        const dir = {
            'KeyW':       ['y', -1],
            'ArrowUp':    ['y', -1],
            'KeyA':       ['x',  1],
            'ArrowLeft':  ['x',  1],
            'KeyS':       ['y',  1],
            'ArrowDown':  ['y',  1],
            'KeyD':       ['x', -1],
            'ArrowRight': ['x', -1],
        }[e.code]
        if (dir) {
            direction[dir[0]] = dir[1];
            startPanning()
            return;
        }
        
        function goto(file) {
            scale = window.innerWidth / file.image.width;
            if (scale < 1) scale = 1;
            width = container.offsetWidth * scale
            height = container.offsetHeight * scale
            let offsetRight = container.offsetWidth - file.image.offsetLeft - file.image.offsetWidth
            anchorX = -offsetRight * scale;
            anchorY = 0;
            if (anchorX < window.innerWidth - width) anchorX = window.innerWidth - width;
            container.style.scale = `${scale}`;
            container.style.translate = `${-anchorX}px ${anchorY}px`;
            
            dynamicLoad()
        }
        ({
            'KeyQ': () => {
                const next = files[current.index + 1]
                if (!next) return;
                current = next;
                goto(next);
            },
            'KeyE': () => {
                const previous = files[current.index - 1]
                if (!previous) return;
                current = previous;
                goto(previous)
            },
        })[e.code]?.()
    })
    
    document.addEventListener('keyup', e => {
        const dir = {
            'KeyW':       'y',
            'ArrowUp':    'y',
            'KeyA':       'x',
            'ArrowLeft':  'x',
            'KeyS':       'y',
            'ArrowDown':  'y',
            'KeyD':       'x',
            'ArrowRight': 'x',
        }[e.code]
        if (dir) direction[dir] = 0;
    })
    
    function updateCurrent() {
        for (;;) {
            const rect = current.image.getBoundingClientRect();
            if (rect.left >= window.innerWidth - 10) {
                const next = files[current.index + 1];
                if (!next.image) break;
                current = next;
                continue;
            }
            if (rect.right < window.innerWidth - 10) {
                const previous = files[current.index - 1]
                if (!previous.image) break;
                current =  previous;
                continue;
            }
            break;
        }
        
        dynamicLoad();
    }
    
    function dynamicLoad() {
        files.slice(current.index, current.index + 6).filter(f => f.image === undefined).forEach(file => {
            loadFile(file).then(() => {
                width = container.offsetWidth * scale
            })
        })
    }
    
    function loadFile(file) {
        return new Promise(r => {
            const reader = new FileReader()
            reader.readAsDataURL(file.file)
            delete file.file
            const image = new Image()
            container.appendChild(image);
            file.image = image;
            image.style.order = `${file.index}`
            reader.onload = () => {
                image.src = reader.result;
                image.onload = r;
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
            
        updateCurrent();
        
        lastTimeStamp = timeStamp
        window.requestAnimationFrame(pan)
    }
    
    function startPanning() {
        if (panning) return;
        panning = true;
        lastTimeStamp = document.timeline.currentTime
        window.requestAnimationFrame(pan)
    }
    
    const debugInfo = document.createElement('div');
    document.body.appendChild(debugInfo);
    debugInfo.style.position = 'fixed'
    debugInfo.style.top = '0'
    debugInfo.style.left = '0'
    
    for (let type of ['mousemove', 'mousedown', 'mouseup', 'wheel', 'keydown', 'keyup']) {
        document.addEventListener(type, e => {
            debugInfo.innerHTML = `
                current.index: ${current.index}<br>
            `;
        });
    }
}

