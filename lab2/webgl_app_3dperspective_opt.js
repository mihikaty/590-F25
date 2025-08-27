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
        uniform mat4 u_combinedmatrix;
        in vec3 vertPosition;
        in vec3 vertColor;
        out vec3 fragColor;
    
        void main() {
            fragColor = vertColor;
            vec4 homogeneousPosition = vec4(vertPosition,1);
            gl_Position = u_combinedmatrix * homogeneousPosition;
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

// Multiplies two 4x4 matrices.  dst = a * b.  This code handles the case when dst is a or b
function mult4x4(a, b, dst) {
    dst = dst || new Float32Array(16);
    var b00 = b[0 * 4 + 0]; var b01 = b[0 * 4 + 1]; var b02 = b[0 * 4 + 2]; var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0]; var b11 = b[1 * 4 + 1]; var b12 = b[1 * 4 + 2]; var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0]; var b21 = b[2 * 4 + 1]; var b22 = b[2 * 4 + 2]; var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0]; var b31 = b[3 * 4 + 1]; var b32 = b[3 * 4 + 2]; var b33 = b[3 * 4 + 3];
    var a00 = a[0 * 4 + 0]; var a01 = a[0 * 4 + 1]; var a02 = a[0 * 4 + 2]; var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0]; var a11 = a[1 * 4 + 1]; var a12 = a[1 * 4 + 2]; var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0]; var a21 = a[2 * 4 + 1]; var a22 = a[2 * 4 + 2]; var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0]; var a31 = a[3 * 4 + 1]; var a32 = a[3 * 4 + 2]; var a33 = a[3 * 4 + 3];
    dst[ 0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    dst[ 1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    dst[ 2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    dst[ 3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    dst[ 4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    dst[ 5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    dst[ 6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    dst[ 7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    dst[ 8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    dst[ 9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    dst[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    dst[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    dst[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    dst[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    dst[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    dst[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
    return dst;
}



var combinedMatrixLocation = gl.getUniformLocation(program, "u_combinedmatrix");

// transformation parameters
var translation = [0.0, 0.0, -2.0];
var rotationx = 0;
var rotationy = 0;
var rotationz = 0;
var scale = [1, 1, 1];

var fov = 3.14/2.0;
var zNear = 0.5;
var zFar = 2000;
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var focal_length = 1.0/Math.tan(fov/2.0);

// allocate a 4x4 matrix for the combined transform
var matrix = new Float32Array(16);

// allocate tranformation matrices
var projectionMatrix = new Float32Array([focal_length/aspect, 0.0, 0.0, 0.0,
                        0.0,focal_length, 0.0, 0.0,
                        0.0, 0.0, (zNear+zFar)/(zNear-zFar),-1.0,
                        0.0,0.0,2*zNear*zFar/(zNear-zFar),0.0]
                        );

var translationMatrix = new Float32Array([1.0, 0.0, 0.0, 0.0,
                        0.0,1.0, 0.0, 0.0,
                        0.0,0.0,1.0, 0.0, 
                        translation[0], translation[1],translation[2], 1.0]
                        );
var rxMatrix = new Float32Array([1.0,0.0,0.0,0.0,
                        0.0, Math.cos(rotationx), Math.sin(rotationx), 0.0,
                        0.0, -Math.sin(rotationx),Math.cos(rotationx), 0.0,
                        0.0, 0.0, 0.0, 1.0]
                        );
var ryMatrix = new Float32Array([Math.cos(rotationy), 0.0, -Math.sin(rotationy), 0.0,
                        0.0, 1.0, 0.0, 0.0, 
                        Math.sin(rotationy),0.0, Math.cos(rotationy), 0.0,
                        0.0, 0.0, 0.0, 1.0]
                        );
var rzMatrix = new Float32Array([Math.cos(rotationz), Math.sin(rotationz), 0.0, 0.0,
                        -Math.sin(rotationz),Math.cos(rotationz), 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        0.0, 0.0, 0.0, 1.0]
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


    // change some transform parameters to animate
    rotationz = current_time;
    rotationy +=  delta_time;
    translation[0]=Math.sin(current_time);

    // update the model matrices based on the transform parameters
    rzMatrix[0]=rzMatrix[5]=Math.cos(rotationz);
    rzMatrix[1]=Math.sin(rotationz); rzMatrix[4]=-Math.sin(rotationz);

    rxMatrix[5]=rxMatrix[10]=Math.cos(rotationx);
    rxMatrix[6]=Math.sin(rotationx); rxMatrix[9]=-Math.sin(rotationx);

    ryMatrix[0]=ryMatrix[10]=Math.cos(rotationy);
    ryMatrix[2]=-Math.sin(rotationy); ryMatrix[8]=Math.sin(rotationy);

    scaleMatrix[0]=scale[0]; scaleMatrix[5]=scale[1]; scaleMatrix[10]=scale[2];

    translationMatrix[12]=translation[0]; translationMatrix[13]=translation[1]; translationMatrix[14]=translation[2];

    // update projection transform matrix based on the transform parameters
    projectionMatrix[0]=focal_length/aspect;
    projectionMatrix[5]=focal_length;
    projectionMatrix[10]= -(zFar+zNear)/(zFar-zNear);
    projectionMatrix[14]=-2*zFar*zNear/(zFar-zNear);
 
    // combine the model and projection matrices into a single 4x4.
    mult4x4(rzMatrix, scaleMatrix, matrix);
    mult4x4(rxMatrix, matrix, matrix);
    mult4x4(ryMatrix, matrix, matrix);
    mult4x4(translationMatrix, matrix, matrix);
    mult4x4(projectionMatrix, matrix, matrix);

    // set shader uniform values
    gl.uniformMatrix4fv(combinedMatrixLocation, false, matrix);

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

