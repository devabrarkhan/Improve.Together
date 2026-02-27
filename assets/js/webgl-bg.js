class WebGLBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'webgl-canvas';
        this.gl = this.canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: "high-performance" });
        
        if (!this.gl) {
            console.warn("WebGL not supported, falling back to basic background.");
            return;
        }

        this.initCanvas();
        this.initShaders();
        this.initBuffers();
        this.resize();
        this.addEventListeners();
        
        this.startTime = performance.now();
        this.render = this.render.bind(this);
        requestAnimationFrame(this.render);
    }

    initCanvas() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';
        document.body.prepend(this.canvas);
    }

    getVertexShader() {
        return `
            attribute vec2 position;
            void main() {
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;
    }

    getFragmentShader() {
        // A bold, smooth, sweeping liquid plasma shader
        return `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;

            void main() {
                // Normalize and center coordinates, adjust aspect ratio
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                vec2 p = uv * 2.0 - 1.0;
                p.x *= u_resolution.x / u_resolution.y;

                // Slow down time for a smooth, majestic flow
                float t = u_time * 0.3;

                // Domain warping for bold, smooth flowing liquid shapes
                vec2 q = vec2(0.0);
                q.x = sin(p.x * 1.2 + t) + cos(p.y * 0.8 + t * 0.6);
                q.y = cos(p.x * 0.9 - t * 0.7) + sin(p.y * 1.3 - t * 0.5);

                vec2 r = vec2(0.0);
                r.x = sin(q.x * 1.5 + t * 1.1) + cos(q.y * 1.4 - t * 0.8);
                r.y = cos(q.x * 1.1 - t * 0.9) + sin(q.y * 1.6 + t * 0.7);

                // Create a smooth distance field
                float d = length(p + r * 0.6);
                
                // Map distance to bold sweeping waves
                float wave = sin(d * 3.5 - t * 1.5) * 0.5 + 0.5;
                
                // Enhance contrast for a bolder look
                float pattern = smoothstep(0.1, 0.9, wave);

                // Color Palette
                // Base: #0a001f, Neon Purple: #8f00ff, Electric Violet: #4a00e0
                vec3 baseColor = vec3(0.039, 0.0, 0.121);
                vec3 electricViolet = vec3(0.290, 0.0, 0.878);
                vec3 neonPurple = vec3(0.561, 0.0, 1.0);

                // Smoothly mix the deep background with the electric waves
                vec3 color = mix(baseColor, electricViolet, pattern * 0.8);
                
                // Add high-contrast glowing neon cores to the waves
                float glow = smoothstep(0.6, 1.0, wave);
                color = mix(color, neonPurple, glow * 0.9);

                // Bold vignette to keep focus centered and edges sharp
                float vignette = 1.0 - smoothstep(0.8, 2.5, length(p));
                color *= vignette;

                gl_FragColor = vec4(color, 1.0);
            }
        `;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    initShaders() {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, this.getVertexShader());
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, this.getFragmentShader());

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(this.program));
            return;
        }

        this.gl.useProgram(this.program);

        this.positionLocation = this.gl.getAttribLocation(this.program, "position");
        this.resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.timeLocation = this.gl.getUniformLocation(this.program, "u_time");
    }

    initBuffers() {
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        
        // Fullscreen quad
        const positions = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0,
        ]);

        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    resize() {
        // Optimize resolution based on screen size to maintain 60fps
        const pixelRatio = window.innerWidth < 768 ? 1.0 : Math.min(window.devicePixelRatio, 1.5);
        
        const width = window.innerWidth * pixelRatio;
        const height = window.innerHeight * pixelRatio;

        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        
        this.gl.uniform2f(this.resolutionLocation, width, height);
    }

    addEventListeners() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.resize(), 150);
        });
    }

    render(time) {
        const currentTime = (time - this.startTime) * 0.001;
        
        this.gl.uniform1f(this.timeLocation, currentTime);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        requestAnimationFrame(this.render);
    }
}

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    new WebGLBackground();
});
