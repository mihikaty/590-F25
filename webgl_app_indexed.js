// Request html canvas element
var canvas = document.getElementById("canvas");

// Create a WebGL rendering context  
var gl = canvas.getContext("webgl2");

// Tell user if their browser does not support WebGL
if (!gl) {
    alert("Your browser does not support WebGL");
}
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


// Define shaders: vertex shader and fragment shader
const shaders = {
    vs: `#version 300 es
        in vec2 vertPosition;
        in vec3 vertColor;
        out vec3 fragColor;
    
        void main() {
            fragColor = vertColor;
            gl_Position = vec4(vertPosition, 0, 1);
        }`,

    fs: `#version 300 es
        precision mediump float;
        in vec3 fragColor;
        out vec4 outColor;
    
        void main() {
            outColor = vec4(fragColor, 1);
        }`
};

// Create WebGl Shader objects
var vertexShader = gl.createShader(gl.VERTEX_SHADER);
var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

// sets the source code of the WebGL shader
gl.shaderSource(vertexShader, shaders.vs);
gl.shaderSource(fragmentShader, shaders.fs);

// Compile GLSL Shaders to a binary data so
// WebGLProgram can use them
gl.compileShader(vertexShader);
gl.compileShader(fragmentShader);

// Create a WebGLProgram
var program = gl.createProgram();

// Attach pre-existing shaders
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);
// Set program as part of the current rendering state
gl.useProgram(program);
const vertexAttributes = {
    position: {
  
        // X and Y ordered pair coordinates
        numberOfComponents: 2, 
        data: new Float32Array([0.0,
            0.5, -0.5, -0.5, 0.5, -0.5, 0.0,-0.9])
    },
    color: { 
        numberOfComponents: 3, // RGB triple
        data: new Float32Array([1.0, 0.0, 
            0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0,1.0,1.0,1.0])
    }
};

// Create and initialize vertex buffers
var vertexBufferObjectPosition = gl.createBuffer();
var vertexBufferObjectColor = gl.createBuffer();

// Bind existing attribute data
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObjectPosition);
gl.bufferData(gl.ARRAY_BUFFER, 
    vertexAttributes.position.data, gl.STATIC_DRAW);

var positionAttribLocation = 
    gl.getAttribLocation(program, 'vertPosition');

gl.vertexAttribPointer(positionAttribLocation,
    vertexAttributes.position.numberOfComponents, 
    gl.FLOAT, gl.FALSE, 0, 0);
gl.enableVertexAttribArray(positionAttribLocation);

// Bind existing attribute data
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObjectColor);
gl.bufferData(gl.ARRAY_BUFFER, 
    vertexAttributes.color.data, gl.STATIC_DRAW);

var colorAttribLocation = 
    gl.getAttribLocation(program, 'vertColor');

gl.vertexAttribPointer(colorAttribLocation,
    vertexAttributes.color.numberOfComponents, 
    gl.FLOAT, gl.FALSE, 0, 0);
gl.enableVertexAttribArray(colorAttribLocation);

const indices = new Uint16Array( [0,1,2,2,1,3]);
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices,gl.STATIC_DRAW);


// Set the color of the canvas. 
// Parameters are RGB colors (red, green, blue, alpha)
gl.clearColor(0, 0.6, 0.0, 1.0);
// Clear the color buffer with specified color
gl.clear(gl.COLOR_BUFFER_BIT);

//gl.enable(gl.CULL_FACE);

// Draw the triangles
gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,0);

