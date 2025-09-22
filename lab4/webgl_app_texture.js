// Request html canvas element
var canvas = document.getElementById("canvas");

// Create a WebGL rendering context  
var gl = canvas.getContext("webgl2");

// Tell user if their browser does not support WebGL
if (!gl) {
    alert("Your browser does not support WebGL");
}

// Define shaders: vertex shader and fragment shader
const shaders = {
    vs: `#version 300 es

        uniform mat4 u_modelMatrix, u_viewMatrix, u_projectionMatrix;

        in vec3 vertPosition;
        in vec3 vertNormal;
        in vec2 vertUV;

        out vec3 fragWorldPosition;
        out vec2 fragUV;
    
        void main() {
            vec4 vertWorldPosition=u_modelMatrix*vec4(vertPosition,1);
            fragWorldPosition = vertWorldPosition.xyz;

            fragUV = vertUV;

            mat4 inverseModel = inverse(u_modelMatrix);
            mat4 modelInverseTranspose = transpose(inverseModel);
            vec4 worldNormal4 = modelInverseTranspose * vec4(vertNormal,0);
            vec3 worldNormal = normalize(worldNormal4.xyz);

            gl_Position = u_projectionMatrix* u_viewMatrix * vertWorldPosition;
        }`,

    fs: `#version 300 es
        precision mediump float;
        
        uniform vec3 u_matAmbient, u_matDiffuse, u_matSpecular;
        uniform float u_matShininess;
        uniform vec3 u_lightAmbient, u_lightDiffuse, u_lightSpecular, u_lightWorldPosition;
        uniform vec3 u_cameraWorldPosition;

        in vec3 fragWorldPosition;
        out vec4 outColor;
        in vec2 fragUV;
        uniform sampler2D u_texture;
    
        void main() {
            vec4 texColor = texture(u_texture, fragUV);
            vec3 fragColor = texColor.rgb;

            // TODO implement diffuse and specular component of Phong lighting here.
            // I already provided the in parameter fragWorldPosition, which is the world-space position of the fragment, 
            //   but you'll need another "in" parameter (which you'll need to pass from the vertex shader using "out") 
            outColor = vec4(fragColor, 1);
        }`
};

// dst = a * b                        
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


const vertexAttributes = {
    position: {
        // XYZ ordered pair coordinates
        numberOfComponents: 3, 
        data: new Float32Array([-1.0, 0.0, 0.0, 
                                0.0, 0.0, 1.0, 
                                0.0, -1.0, 0.0,
                                0.0, 1.0, 0.0,
                                0.0, 0.0, -1.0,
                                1.0, 0.0, 0.0])
    },
    normal: {
        numberOfComponents: 3,
        data: new Float32Array([-1.0, 0.0, 0.0, 
                                0.0, 0.0, 1.0, 
                                0.0, -1.0, 0.0,
                                0.0, 1.0, 0.0,
                                0.0, 0.0, -1.0,
                                1.0, 0.0, 0.0])
    },
    uv: {
        numberOfComponents: 2,
        data: new Float32Array([
            0.0, 0.0,
            0.5, 0.0,
            1.0, 0.0,
            0.0, 0.5,
            0.0, 1.0,
            1.0, 1.0])
    }
};

var normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
var uvAttribLocation = gl.getAttribLocation(program, 'vertUV');

const indices = new Uint16Array( [2,4,5, 0,1,3, 1,5,3, 0,4,2, 0,2,1, 3,5,4, 0,3,4, 1,2,5]);
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices,gl.STATIC_DRAW);

// Create and initialize vertex buffers
var vertexBufferObjectPosition = gl.createBuffer();
var vertexBufferObjectNormal = gl.createBuffer();
var vertexBufferObjectUV = gl.createBuffer();

// Bind existing attribute data
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObjectPosition);
gl.bufferData(gl.ARRAY_BUFFER, vertexAttributes.position.data, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionAttribLocation);
gl.vertexAttribPointer(positionAttribLocation,
    vertexAttributes.position.numberOfComponents, 
    gl.FLOAT, gl.FALSE, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObjectNormal);
gl.bufferData(gl.ARRAY_BUFFER, vertexAttributes.normal.data, gl.STATIC_DRAW);
gl.enableVertexAttribArray(normalAttribLocation);
gl.vertexAttribPointer(normalAttribLocation,
    vertexAttributes.normal.numberOfComponents, 
    gl.FLOAT, gl.FALSE, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObjectUV);
gl.bufferData(gl.ARRAY_BUFFER, vertexAttributes.uv.data, gl.STATIC_DRAW);
gl.enableVertexAttribArray(uvAttribLocation);
gl.vertexAttribPointer(uvAttribLocation,
    vertexAttributes.uv.numberOfComponents,
    gl.FLOAT, gl.FALSE, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObjectPosition);

var matrixLocation = gl.getUniformLocation(program, "u_modelMatrix");
var projectionMatrixLocation = gl.getUniformLocation(program, "u_projectionMatrix");
var viewMatrixLocation = gl.getUniformLocation(program, "u_viewMatrix");

var matAmbientLocation = gl.getUniformLocation(program, "u_matAmbient");
var matDiffuseLocation = gl.getUniformLocation(program, "u_matDiffuse");
var matSpecularLocation = gl.getUniformLocation(program, "u_matSpecular");
var matShininessLocation = gl.getUniformLocation(program, "u_matShininess");

var lightAmbientLocation = gl.getUniformLocation(program, "u_lightAmbient");
var lightDiffuseLocation = gl.getUniformLocation(program, "u_lightDiffuse");
var lightSpecularLocation = gl.getUniformLocation(program, "u_lightSpecular");

var lightPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
var cameraPositionLocation = gl.getUniformLocation(program, "u_cameraWorldPosition");

var samplerLocation = gl.getUniformLocation(program, "u_texture");
gl.useProgram(program);

var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
var image = new Image();
image.crossOrigin = 'Anonymous'; // to avoid CORS
image.src = "https://png.pngtree.com/png-vector/20240814/ourlarge/pngtree-3d-cute-small-puppy-of-corgi-dog-png-image_13481304.png";

image.addEventListener('load', function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
});





// set material properties
var matAmbient = new Float32Array([1.0, 0.0, 0.0]);  // red surface
var matDiffuse = new Float32Array([1.0, 0.0, 0.0]);  // red surface
var matSpecular = new Float32Array([1.0, 1.0, 1.0]); // white highlights
var matShininess = 10.0;

var lightAmbient = new Float32Array([0.2, 0.2, 0.2]);
var lightDiffuse = new Float32Array([1.0, 1.0, 1.0]);
var lightSpecular = new Float32Array([1.0, 1.0, 1.0]);

var lightPosition = new Float32Array([100,100,0]); // overhead and to the right

 
// transformation parameters
var translation = [0, 0, 0];
var rotationx = 0;
var rotationy = 0;
var rotationz = 0;
var scale = [1, 1, 1];

var camera_translation_start_z = 4;
var camera_translation = [0, 0, camera_translation_start_z];
var camera_rotationx = 0;
var camera_rotationy = 0;
var camera_rotationz = 0;

var fov = 3.14/2.0;
var zNear = 0.5;
var zFar = 2000;


// allocate transformation matrices
var modelMatrix = new Float32Array(16);
var viewMatrix = new Float32Array(16);

var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
var focal_length = 1.0/Math.tan(fov/2.0);
var projectionMatrix = new Float32Array([focal_length/aspect, 0.0, 0.0, 0.0,
                        0.0,focal_length, 0.0, 0.0,
                        0.0, 0.0, (zNear+zFar)/(zNear-zFar),-1.0,
                        0.0,0.0,2*zNear*zFar/(zNear-zFar),0.0]
                        );

var invCameraTranslationMatrix = new Float32Array([1.0, 0.0, 0.0, 0.0,
                        0.0,1.0, 0.0, 0.0,
                        0.0,0.0,1.0, 0.0, 
                        -camera_translation[0], -camera_translation[1],-camera_translation[2], 1.0]
                        );
var invCameraRxMatrix = new Float32Array([1.0,0.0,0.0,0.0,
                        0.0, Math.cos(-camera_rotationx), Math.sin(-camera_rotationx), 0.0,
                        0.0, -Math.sin(-camera_rotationx),Math.cos(-camera_rotationx), 0.0,
                        0.0, 0.0, 0.0, 1.0]
                        );
var invCameraRyMatrix = new Float32Array([Math.cos(-camera_rotationy), 0.0, -Math.sin(-camera_rotationy), 0.0,
                        0.0, 1.0, 0.0, 0.0, 
                        Math.sin(-camera_rotationy),0.0, Math.cos(-camera_rotationy), 0.0,
                        0.0, 0.0, 0.0, 1.0]
                        );

var invCameraRzMatrix = new Float32Array([Math.cos(-camera_rotationz), Math.sin(-camera_rotationz), 0.0, 0.0,
                        -Math.sin(-camera_rotationz),Math.cos(-camera_rotationz), 0.0, 0.0,
                        0.0, 0.0, 1.0, 0.0,
                        0.0, 0.0, 0.0, 1.0]
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

animation_flag = false;
interactive_camera_flag = true;


// mouse interaction
let rotation_speed = 1/100;
let movement_speed = 1/20;
let isDragging = false;
let lastX, lastY;
let mouse_rotationx = 0;
let mouse_rotationy = 0;
let mouse_rotationz = 0;

let keysPressed = {};
if (interactive_camera_flag) {
    canvas.addEventListener("mousedown", (e) => {
        lastX = e.clientX
        lastY = e.clientY;
        isDragging = true;
    })

    canvas.addEventListener("mouseup", (e) => {
        isDragging = false;
        lastX = e.clientX
        lastY = e.clientY;
    })

    canvas.addEventListener("mouseleave", (e) => {
        isDragging = false;
        lastX = e.clientX
        lastY = e.clientY;
    })

    canvas.addEventListener("mousemove", (e) => {

        // Calculating mouse deltas and adjusting camera
        if (isDragging) {
            let dx = e.clientX - lastX;
            let dy = e.clientY - lastY;

            mouse_rotationy = dx * rotation_speed; // yaw
            mouse_rotationx = dy * rotation_speed; // pitch
        }

        // Updating last mouse location
        lastX = e.clientX;
        lastY = e.clientY;

    })
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();   
        mouse_rotationz = e.deltaY * 0.2 * rotation_speed; // roll
    })


    document.addEventListener("keydown", (e) => {
        keysPressed[e.key] = true;
    })

    document.addEventListener("keyup", (e) => {
        delete keysPressed[e.key];
    })
}

function draw(now) {
    // Set program as part of the current rendering state
    gl.useProgram(program);
    gl.uniform1i(samplerLocation, 0); // texture unit 0


    if (animation_flag) {
        //change transform parameters to animate
        rotationz=rotationz+0.01;
        rotationx=rotationx-0.01;
        rotationy=rotationy+0.01;
        translation[0]=Math.sin(rotationz);
    }

    if (interactive_camera_flag) {
        // update camera rotation based on mouse movement
        camera_rotationx -= mouse_rotationx;
        camera_rotationy -= mouse_rotationy;
        camera_rotationz -= mouse_rotationz;
        mouse_rotationx = mouse_rotationy = mouse_rotationz = 0;
                // 1st-person camera movement in world xz plane using WASD
        let moveDirection = [0, 0, 0];
        if (keysPressed["w"] == true) { // forward
            camera_translation[2] -= movement_speed*Math.cos(camera_rotationy);
            camera_translation[0] -= movement_speed*Math.sin(camera_rotationy);
        }
        if (keysPressed["a"] == true) { // left
            camera_translation[2] += movement_speed*Math.sin(camera_rotationy);
            camera_translation[0] -= movement_speed*Math.cos(camera_rotationy);
        }
        if (keysPressed["s"] == true) { // backward
            camera_translation[2] += movement_speed*Math.cos(camera_rotationy);
            camera_translation[0] += movement_speed*Math.sin(camera_rotationy);
        }
        if (keysPressed["d"] == true) { // right
            camera_translation[2] -= movement_speed*Math.sin(camera_rotationy);
            camera_translation[0] += movement_speed*Math.cos(camera_rotationy);
        }

        if (keysPressed["h"] == true) { // home (reset camera to starting position/orientation)
            camera_translation = [0, 0, camera_translation_start_z];
            camera_rotationx = camera_rotationy = camera_rotationz = 0;
            delete keysPressed["h"];
        }
        if (keysPressed["t"]) { // toggle animation
            animation_flag = !animation_flag;
            delete keysPressed["t"];
        }
    }
    
 

    // update the model matrices
    translationMatrix[12]=translation[0]; translationMatrix[13]=translation[1]; translationMatrix[14]=translation[2];
   
    rzMatrix[0]=rzMatrix[5]=Math.cos(rotationz);
    rzMatrix[1]=Math.sin(rotationz); rzMatrix[4]=-Math.sin(rotationz);

    rxMatrix[5]=rxMatrix[10]=Math.cos(rotationx);
    rxMatrix[6]=Math.sin(rotationx); rxMatrix[9]=-Math.sin(rotationx);

    ryMatrix[0]=ryMatrix[10]=Math.cos(rotationy);
    ryMatrix[2]=-Math.sin(rotationy); ryMatrix[8]=Math.sin(rotationy);

    scaleMatrix[0]=scale[0]; scaleMatrix[5]=scale[1]; scaleMatrix[10]=scale[2];

    // form the model transform
    mult4x4(rzMatrix, scaleMatrix, modelMatrix);
    mult4x4(rxMatrix, modelMatrix, modelMatrix);
    mult4x4(ryMatrix, modelMatrix, modelMatrix);
    mult4x4(translationMatrix, modelMatrix, modelMatrix);

    // update the view matrices
    invCameraRzMatrix[0]=invCameraRzMatrix[5]=Math.cos(-camera_rotationz);
    invCameraRzMatrix[1]=Math.sin(-camera_rotationz); invCameraRzMatrix[4]=-Math.sin(-camera_rotationz);

    invCameraRxMatrix[5]=invCameraRxMatrix[10]=Math.cos(-camera_rotationx);
    invCameraRxMatrix[6]=Math.sin(-camera_rotationx); invCameraRxMatrix[9]=-Math.sin(-camera_rotationx);

    invCameraRyMatrix[0]=invCameraRyMatrix[10]=Math.cos(-camera_rotationy);
    invCameraRyMatrix[2]=-Math.sin(-camera_rotationy); invCameraRyMatrix[8]=Math.sin(-camera_rotationy);

    invCameraTranslationMatrix[12]=-camera_translation[0]; 
    invCameraTranslationMatrix[13]=-camera_translation[1]; 
    invCameraTranslationMatrix[14]=-camera_translation[2];

    // form the view transform (note the order of operations is reversed compared to the model transform)
    mult4x4(invCameraRyMatrix, invCameraTranslationMatrix, viewMatrix);
    mult4x4(invCameraRxMatrix, viewMatrix, viewMatrix);
    mult4x4(invCameraRzMatrix, viewMatrix, viewMatrix);

    // set the matrices
    gl.uniformMatrix4fv(matrixLocation, false, modelMatrix);
    gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
 
    // set lighting parameters (in case they changed)
    gl.uniform3fv(lightAmbientLocation, lightAmbient);
    gl.uniform3fv(lightDiffuseLocation, lightDiffuse);
    gl.uniform3fv(lightSpecularLocation, lightSpecular);

    // set material properties (in case they changed)
    gl.uniform3fv(matAmbientLocation, matAmbient);
    gl.uniform3fv(matDiffuseLocation, matDiffuse);
    gl.uniform3fv(matSpecularLocation, matSpecular);
    gl.uniform1f(matShininessLocation, matShininess);

    // set light and camera position
    gl.uniform3fv(lightPositionLocation, lightPosition);
    gl.uniform3fv(cameraPositionLocation, camera_translation);
 
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Set the color of the canvas. 
    // Parameters are RGB colors (red, green, blue, alpha)
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0.6, 0.0, 1.0);

    // Clear the color buffer with specified color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the triangle

    //gl.drawArrays(gl.TRIANGLE_STRIP, 0, 5);
    gl.drawElements(gl.TRIANGLES, 3*8, gl.UNSIGNED_SHORT,0);

    // request the draw function be called again at the next display refresh
    requestAnimationFrame(draw);

}

requestAnimationFrame(draw);

