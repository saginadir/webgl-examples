"use strict";

window.onload = main;

function main() {
    var video = document.createElement('video');
    // using a dataURL because stackoverflow
    video.src = "../assets/demo.mp4";  // MUST BE SAME DOMAIN!!!
    setTimeout(function() {
        video.play();
    },2000);

    var interval;
    video.addEventListener('play',function() {
        interval = setInterval(function() {
            if(video.currentTime > 0) {
                render(video);
            }
        },30);
    });

    video.addEventListener('ended',function() {
        clearInterval(interval);
        console.log("Frames: "+ frames.length);
        console.log("Ended");
    });
}


// Get A WebGL context
var canvas = document.getElementById("c");
var gl = canvas.getContext("webgl") || canvas.getContext("webgl-experimental");
var frames = [];

function render(resource) {

   var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, resource);

    frames.push(texture);
}

function drawFrame(int) {
    // setup GLSL program
    var program = createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");

    // look up uniform locations
    var u_imageLoc = gl.getUniformLocation(program, "u_image");
    var u_matrixLoc = gl.getUniformLocation(program, "u_matrix");

    // provide texture coordinates for the rectangle.
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindTexture(gl.TEXTURE_2D, frames[int]);

    var dstX = 0;
    var dstY = 0;
    var dstWidth = gl.canvas.width;
    var dstHeight = gl.canvas.height;

    // convert dst pixel coords to clipspace coords
    var clipX = dstX / gl.canvas.width  *  2 - 1;
    var clipY = dstY / gl.canvas.height * -2 + 1;
    var clipWidth = dstWidth  / gl.canvas.width  *  2;
    var clipHeight = dstHeight / gl.canvas.height * -2;

    // build a matrix that will stretch our
    // unit quad to our desired size and location
    gl.uniformMatrix3fv(u_matrixLoc, false, [
        clipWidth, 0, 0,
        0, clipHeight, 0,
        clipX, clipY, 1,
    ]);

    // Draw the rectangle.
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}