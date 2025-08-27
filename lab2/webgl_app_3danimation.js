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
        uniform mat4 t_matrix, rx_matrix, ry_matrix, rz_matrix, s_matrix;
        in vec3 vertPosition;
        in vec3 vertColor;
        out vec3 fragColor;
    
        void main() {
            fragColor = vertColor;
            vec4 homogeneousPosition = vec4(vertPosition,1);
            vec4 transformedHomogeneousPosition = t_matrix*ry_matrix*rx_matrix*rz_matrix*s_matrix * homogeneousPosition;
            gl_Position = transformedHomogeneousPosition;
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
  
        // XYZ ordered pair coordinates
        numberOfComponents: 3, 
        data: new Float32Array([0.0,0.5, 0.0,
                               -0.5, -0.5, 0.0, 
                               0.5, -0.5, 0.0,
                               0.0,-0.9, 0.5])
    },
    color: { 
        numberOfComponents: 3, // RGB triple
        data: new Float32Array([1.0, 0.0, 0.0, 
                                0.0, 1.0, 0.0, 
                                0.0, 0.0, 0.0,
                                1.0, 1.0, 1.0])
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

var tmatrixLocation = gl.getUniformLocation(program, "t_matrix");
var rxmatrixLocation = gl.getUniformLocation(program, "rx_matrix");
var rymatrixLocation = gl.getUniformLocation(program, "ry_matrix");
var rzmatrixLocation = gl.getUniformLocation(program, "rz_matrix");
var smatrixLocation = gl.getUniformLocation(program, "s_matrix");

// set tranformation parameters
var translation = [0.0, 0.0, 0.0];
var rotationx = 0;
var rotationy = 0;
var rotationz = 0;
var scale = [1, 1, 1];

// allocate tranformation matrices
var translationMatrix = new Float32Array([1.0, 0.0, 0.0, 0.0,
                        0.0,1.0, 0.0, 0.0,
                        0.0,0.0,1.0, 0.0, 
                        translation[0], translation[1],translation[2], 1.0]
                        );
var rxMatrix = new Float32Array([1.0,0.0,0.0,0.0,
                        0.0, Math.cos(rotationx), Math.sin(rotationx), 0.0,
                        0.0, -Math.sin(rotationx),Math.cos(rotationx), 0.0,
                        0.0,0.0,0.0,1.0]
                        );
var ryMatrix = new Float32Array([Math.cos(rotationy), 0.0, -Math.sin(rotationy), 0.0,
                        0.0, 1.0, 0.0, 0.0, 
                        Math.sin(rotationy),0.0, Math.cos(rotationy), 0.0,
                        0.0,0.0,0.0,1.0]
                        );
var rzMatrix = new Float32Array([Math.cos(rotationz), Math.sin(rotationz), 0.0, 0.0,
                        -Math.sin(rotationz),Math.cos(rotationz), 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        0.0,0.0,0.0,1.0]
                        );
var scaleMatrix = new Float32Array([scale[0], 0.0, 0.0, 0.0,
                        0.0,scale[1], 0.0, 0.0,
                        0.0, 0.0, scale[2], 0.0,
                        0.0,0.0,0.0,1.0]
                        );                        

let start;
let prev_time;

function draw(timestamp) {

    const timestamp_sec = timestamp*0.001; // convert from milliseconds to seconds
    if (start === undefined) {
        start = timestamp_sec;
        prev_time = timestamp_sec;
    }
    const current_time = timestamp_sec - start; 
    const delta_time = current_time - prev_time;
    prev_time=current_time;

    //change some transform parameters to animate
    scale[0]=scale[1]=scale[2] = 1.0 - 0.5 * Math.sin(current_time);
    rotationz = current_time;
    rotationy +=  delta_time;

    // update the model transform matrices based on the transform parameters
    rzMatrix[0]=rzMatrix[5]=Math.cos(rotationz);
    rzMatrix[1]=Math.sin(rotationz); rzMatrix[4]=-Math.sin(rotationz);

    rxMatrix[5]=rxMatrix[10]=Math.cos(rotationx);
    rxMatrix[6]=Math.sin(rotationx); rxMatrix[9]=-Math.sin(rotationx);

    ryMatrix[0]=ryMatrix[10]=Math.cos(rotationy);
    ryMatrix[2]=-Math.sin(rotationy); ryMatrix[8]=Math.sin(rotationy);

    scaleMatrix[0]=scale[0]; scaleMatrix[5]=scale[1]; scaleMatrix[10]=scale[2];

    translationMatrix[12]=translation[0]; translationMatrix[13]=translation[1]; translationMatrix[14]=translation[2];
 
    // set shader uniform values
    gl.uniformMatrix4fv(tmatrixLocation, false, translationMatrix);
    gl.uniformMatrix4fv(rxmatrixLocation, false, rxMatrix);
    gl.uniformMatrix4fv(rymatrixLocation, false, ryMatrix);
    gl.uniformMatrix4fv(rzmatrixLocation, false, rzMatrix);
    gl.uniformMatrix4fv(smatrixLocation, false, scaleMatrix);

    // Set the color of the canvas. 
    // Parameters are RGB colors (red, green, blue, alpha)
    gl.clearColor(0, 0.6, 0.0, 1.0);
    // Clear the color buffer with specified color
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the triangles
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // request the draw function be called again at the next display refresh
    requestAnimationFrame(draw)
}

requestAnimationFrame(draw);

