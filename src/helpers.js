$.event.props.push("button", "buttons", "clientX", "clientY", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "toElement");
$.event.props.push("pointerType", "pointerId", "width", "height", "pressure", "tiltX", "tiltY", "hwTimestamp", "isPrimary");
FontDetective.swf = "./lib/FontList.swf";
var TAU = 2 * Math.PI;
var $G = $(window);
function Cursor(cursor_def) {
    return "url(images/cursors/" + cursor_def[0] + ".png) " + cursor_def[1].join(" ") + ", " + cursor_def[2];
}
function E(t) {
    return document.createElement(t);
}
function get_rgba_from_color(color) {
    var single_pixel_canvas = new Canvas(1,1);
    single_pixel_canvas.ctx.fillStyle = color;
    single_pixel_canvas.ctx.fillRect(0, 0, 1, 1);
    var image_data = single_pixel_canvas.ctx.getImageData(0, 0, 1, 1);
    return Array.from(image_data.data);
}
function Canvas(width, height) {
    var image = width;
    var new_canvas = E("canvas");
    var new_ctx = new_canvas.getContext("2d");
    new_canvas.ctx = new_ctx;
    new_ctx.disable_image_smoothing = function(image) {
        new_ctx.mozImageSmoothingEnabled = false;
        new_ctx.webkitImageSmoothingEnabled = false;
        new_ctx.msImageSmoothingEnabled = false;
        new_ctx.imageSmoothingEnabled = false;
    }
    ;
    new_ctx.copy = function(image) {
        new_canvas.width = image.naturalWidth || image.width;
        new_canvas.height = image.naturalHeight || image.height;
        new_ctx.disable_image_smoothing();
        new_ctx.drawImage(image, 0, 0);
    }
    ;
    if (width && height) {
        new_canvas.width = width;
        new_canvas.height = height;
        new_ctx.disable_image_smoothing();
    } else if (image) {
        new_ctx.copy(image);
    }
    return new_canvas;
}
