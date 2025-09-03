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
        uniform mat4 t_matrix, ry_matrix, rx_matrix, rz_matrix, s_matrix;
        uniform mat4 projection_matrix;
        uniform mat4 cam_t_inv_matrix, cam_rz_inv_matrix, cam_rx_inv_matrix, cam_ry_inv_matrix;
        uniform float u_color; 
        in vec3 vertPosition;
        in vec3 vertColor;
        out vec3 fragColor;
    
        void main() {
            // to match the visuals of the slides, draw our pixels with the red color channel
            fragColor = vec3(u_color,0.0,0.0); 
            vec4 homogeneousPosition = vec4(vertPosition,1);
            // note the order of matrix multiplication is important
            // the model transform is applied first, then the view transform, then the projection transform
            // the view transform is the inverse of the camera transform.  Note reversed multiplication order
            gl_Position = projection_matrix * cam_rz_inv_matrix * cam_rx_inv_matrix * cam_ry_inv_matrix * cam_t_inv_matrix * t_matrix*ry_matrix*rx_matrix*rz_matrix*s_matrix * homogeneousPosition;
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
        data: new Float32Array([0.0, 0.0, 0.0,
                               0.0,0.9, 0.0,
                               0.9, 0.0, 0.0, 
                               0.9, 0.9, 0.0])
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

var projectionmatrixLocation = gl.getUniformLocation(program, "projection_matrix");
var cam_inv_tmatrixLocation = gl.getUniformLocation(program, "cam_t_inv_matrix");
var cam_inv_rxmatrixLocation = gl.getUniformLocation(program, "cam_rx_inv_matrix");
var cam_inv_rymatrixLocation = gl.getUniformLocation(program, "cam_ry_inv_matrix");
var cam_inv_rzmatrixLocation = gl.getUniformLocation(program, "cam_rz_inv_matrix");

var colorLocation = gl.getUniformLocation(program, "u_color");

///////////////////////////////////////////////////
// Rasterization support functions
const GRIDSIZE = 40;
const CLEARCOLOR = 0.0;
const FILLCOLOR = 1.0;
var grid = new Float32Array(GRIDSIZE*GRIDSIZE);

// i,j are expected to be integers and color is a value 0.0 to 1.0
function fillPixel(i, j, color) {
    color = color || FILLCOLOR;
    if (i >= 0 && i < GRIDSIZE && j >= 0 && j < GRIDSIZE)
        grid[i + GRIDSIZE * j] = color;
}

function clearGrid() {
    for (var i=0;i<GRIDSIZE*GRIDSIZE; i++) {
        grid[i]=CLEARCOLOR;
    }
}
/////////////////////////////////////////////////////////


// initialize tranformation parameters
var translation = [0.0, 0.0, 0.0];
var rotationx = 0;
var rotationy = 0;
var rotationz = 0;
var scale = [1, 1, 1];

var fov = 3.14/2.0;
var zNear = 0.5;
var zFar = 2000;
var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var focal_length = 1.0/Math.tan(fov/2.0);

var camera_translation = [0, 0, GRIDSIZE*0.7]; // move the camera "back" so we can see the entire grid
var camera_rotationx = 0.0;
var camera_rotationy = 0.0;
var camera_rotationz = 0.0;


// allocate and initialize transformation matrices
var projectionMatrix = new Float32Array([focal_length/aspect, 0.0, 0.0, 0.0,
                        0.0,focal_length, 0.0, 0.0,
                        0.0, 0.0, -(zFar+zNear)/(zFar-zNear), -1.0,
                        0.0,0.0,-2*zFar*zNear/(zFar-zNear),0.0]
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
var cam_inv_translationMatrix = new Float32Array([1.0, 0.0, 0.0, 0.0,
                        0.0,1.0, 0.0, 0.0,
                        0.0,0.0,1.0, 0.0,
                        -camera_translation[0], -camera_translation[1], -camera_translation[2], 1.0]
                        );
var cam_inv_rxMatrix = new Float32Array([1.0,0.0,0.0,0.0,
                        0.0, Math.cos(-camera_rotationx), Math.sin(-camera_rotationx), 0.0,
                        0.0, -Math.sin(-camera_rotationx),Math.cos(-camera_rotationx), 0.0,
                        0.0, 0.0, 0.0, 1.0]
                        );
var cam_inv_ryMatrix = new Float32Array([Math.cos(-camera_rotationy), 0.0, -Math.sin(-camera_rotationy), 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        Math.sin(-camera_rotationy),0.0, Math.cos(-camera_rotationy), 0.0,
                        0.0, 0.0, 0.0, 1.0]
                        );
var cam_inv_rzMatrix = new Float32Array([Math.cos(-camera_rotationz), Math.sin(-camera_rotationz), 0.0, 0.0,
                        -Math.sin(-camera_rotationz),Math.cos(-camera_rotationz), 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        0.0, 0.0, 0.0, 1.0]
                        );

let start;
let preview_time;

function draw(timestamp) {

    const timestamp_sec = timestamp*0.001; // convert from milliseconds to seconds
    if (start === undefined) {
        start = timestamp_sec;
        preview_time = timestamp_sec;
    }
    const current_time = timestamp_sec - start; 
    const delta_time = current_time - preview_time;
    preview_time=current_time;

    //change some transform parameters to animate
     if (false) {
        // clear the model transform parameters to zero/identity
        translation = [0, 0, 0];
        rotationx = rotationy = rotationz = 0;
        scale = [1,1,1];

        // this implements a camera circular orbit in the xz plane always looking at the origin.  The circle radius is GRIDSIZE.
        // it looks just like the camera is standing still and the model is rotating in place! 
        camera_translation[0] = Math.sin(current_time)*GRIDSIZE;
        camera_translation[1] = 0;
        camera_translation[2] = Math.cos(current_time)*GRIDSIZE;
        camera_rotationy = current_time;
        camera_rotationx = camera_rotationz = 0;
     }



    // update the model transform matrices based on the transform parameters
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

    // update view transform matrices based on the camera transform parameters
    // note the view transform is the inverse of the camera transform, 
    // so we can construct the inverse camera matrices by negating the rotation angles and translation
    cam_inv_rzMatrix[0]=cam_inv_rzMatrix[5]=Math.cos(-camera_rotationz);
    cam_inv_rzMatrix[1]=Math.sin(-camera_rotationz); cam_inv_rzMatrix[4]=-Math.sin(-camera_rotationz);

    cam_inv_rxMatrix[5]=cam_inv_rxMatrix[10]=Math.cos(-camera_rotationx);
    cam_inv_rxMatrix[6]=Math.sin(-camera_rotationx); cam_inv_rxMatrix[9]=-Math.sin(-camera_rotationx);

    cam_inv_ryMatrix[0]=cam_inv_ryMatrix[10]=Math.cos(-camera_rotationy);
    cam_inv_ryMatrix[2]=-Math.sin(-camera_rotationy); cam_inv_ryMatrix[8]=Math.sin(-camera_rotationy);

    cam_inv_translationMatrix[12]=-camera_translation[0]; cam_inv_translationMatrix[13]=-camera_translation[1]; cam_inv_translationMatrix[14]=-camera_translation[2];

   // set shader uniform values
    gl.uniformMatrix4fv(tmatrixLocation, false, translationMatrix);
    gl.uniformMatrix4fv(rxmatrixLocation, false, rxMatrix);
    gl.uniformMatrix4fv(rymatrixLocation, false, ryMatrix);
    gl.uniformMatrix4fv(rzmatrixLocation, false, rzMatrix);
    gl.uniformMatrix4fv(smatrixLocation, false, scaleMatrix);
    gl.uniformMatrix4fv(projectionmatrixLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(cam_inv_tmatrixLocation, false, cam_inv_translationMatrix);
    gl.uniformMatrix4fv(cam_inv_rxmatrixLocation, false, cam_inv_rxMatrix);
    gl.uniformMatrix4fv(cam_inv_rymatrixLocation, false, cam_inv_ryMatrix);
    gl.uniformMatrix4fv(cam_inv_rzmatrixLocation, false, cam_inv_rzMatrix);


    // Rasterization code.

    // TODO #1:  Make this function work
    // Hint: x,y are real numbers.  What does fillPixel expect?
    function rasterize_point(x, y) {
        fillPixel(x,y);
    }

    // TODO #2: Implement a basic line drawing algorithm
    function rasterize_line(x1,y1,x2,y2) {
        // Your job is to implement a much better algorithm than this completely broken one!
        for (var i=0;i<=x2-x1;i++) {
            rasterize_point( x1 + i, y1 + i);
        }
    }

    function rasterize_wireframe_triangle(x1, y1, x2, y2, x3, y3) {
        rasterize_line(x1,y1,x2,y2);
        rasterize_line(x1,y1,x3,y3);
        rasterize_line(x2,y2,x3,y3);
    }

    // TODO #3: Implement a filled triangle rasterization algorithm using scan conversion
    function rasterize_filled_triangle(x1, y1, x2, y2, x3, y3) {
   
    }

    // not really related to rasterization, but hey
    function draw_smiley() {
        // draw smiley
        fillPixel(GRIDSIZE/4,GRIDSIZE*3/4);
        fillPixel(GRIDSIZE*3/4,GRIDSIZE*3/4);
        for (var i=0;i<=GRIDSIZE/2;i++) {
            fillPixel(i+GRIDSIZE/4, GRIDSIZE/4-Math.trunc(GRIDSIZE/6*Math.sin(i*2*Math.PI/GRIDSIZE)));
        }
    }

    // draw some stuff into our rasterization grid
    clearGrid();
    rasterize_point(2,1)

    // some things to test
    // TODO #1
    rasterize_point(2.9,1.9)

    // TODO #2
    //rasterize_line(2.0, 1.0, 18.0,13.0);
    //rasterize_line(2.0, 1.0, 13.0, 18.0);
    //rasterize_wireframe_triangle(2.0, 1.0, 18.0, 13.0, 6.0, 16.0);

    // TODO #3
    //rasterize_filled_triangle(2.0, 1.0, 18.0, 13.0, 6.0, 16.0);

    // just for fun :)
    //draw_smiley()

    // Set the color of the canvas. 
    // Parameters are RGB colors (red, green, blue, alpha)
    gl.clearColor(0, 0.6, 0.0, 1.0);
    // Clear the color buffer with specified color
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the rasterization grid
    // Note this is a VERY inefficient way to draw this
    // but it is simple and uses our existing framework
    for (var y=0;y<GRIDSIZE;y++) {
        for (var x=0;x<GRIDSIZE;x++) {

            // set the model translation matrix to draw a unit square for every grid pixel
            translationMatrix[12]=x-GRIDSIZE/2; translationMatrix[13]=y-GRIDSIZE/2;
            gl.uniformMatrix4fv(tmatrixLocation, false, translationMatrix);
            
            // update color uniform to the grid pixel value
            gl.uniform1f(colorLocation, grid[x+y*GRIDSIZE]);

            // draw a grid pixel
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
    }

    // request the draw function be called again at the next display refresh
    requestAnimationFrame(draw)

}

requestAnimationFrame(draw);

