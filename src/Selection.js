function Selection(x, y, width, height) {
    var sel = this;
    OnCanvasObject.call(sel, x, y, width, height);
    sel.$el.addClass("selection");
    var last_transparent_opaque_option = transparent_opaque;
    var last_background_color = colors.background;
    this._on_option_changed = function() {
        if (!sel.source_canvas) {
            return;
        }
        if (last_transparent_opaque_option !== transparent_opaque || last_background_color !== colors.background) {
            last_transparent_opaque_option = transparent_opaque;
            last_background_color = colors.background;
            sel.update_transparent_opaque();
        }
    }
    ;
    $G.on("option-changed", this._on_option_changed);
}
Selection.prototype = Object.create(OnCanvasObject.prototype);
Selection.prototype.instantiate = function(_img, _passive) {
    var sel = this;
    sel.$el.addClass("instantiated").css({
        cursor: Cursor(["move", [8, 8], "move"])
    });
    sel.$el.attr("touch-action", "none");
    sel.position();
    if (_passive) {
        instantiate();
    } else if (!undoable(instantiate)) {
        sel.destroy();
    }
    function instantiate() {
        if (_img) {
            sel.source_canvas = new Canvas(_img);
            if (sel.source_canvas.width !== sel.width) {
                sel.source_canvas.width = sel.width;
            }
            if (sel.source_canvas.height !== sel.height) {
                sel.source_canvas.height = sel.height;
            }
            sel.canvas = new Canvas(sel.source_canvas);
        } else {
            sel.source_canvas = new Canvas(sel.width,sel.height);
            sel.source_canvas.ctx.drawImage(canvas, sel.x, sel.y, sel.width, sel.height, 0, 0, sel.width, sel.height);
            sel.canvas = new Canvas(sel.source_canvas);
            if (!_passive) {
                sel.cut_out_background();
            }
        }
        sel.$el.append(sel.canvas);
        sel.$handles = $Handles(sel.$el, sel.canvas, {
            outset: 2
        });
        sel.$el.on("user-resized", function(e, delta_x, delta_y, width, height) {
            sel.x += delta_x;
            sel.y += delta_y;
            sel.width = width;
            sel.height = height;
            sel.position();
            sel.resize();
        });
        var mox, moy;
        var pointermove = function(e) {
            var m = e2c(e);
            sel.x = Math.max(Math.min(m.x - mox, canvas.width), -sel.width);
            sel.y = Math.max(Math.min(m.y - moy, canvas.height), -sel.height);
            sel.position();
            if (e.shiftKey) {
                sel.draw();
            }
        };
        sel.canvas_pointerdown = function(e) {
            e.preventDefault();
            var rect = sel.canvas.getBoundingClientRect();
            var cx = e.clientX - rect.left;
            var cy = e.clientY - rect.top;
            mox = ~~(cx / rect.width * sel.canvas.width);
            moy = ~~(cy / rect.height * sel.canvas.height);
            $G.on("pointermove", pointermove);
            $G.one("pointerup", function() {
                $G.off("pointermove", pointermove);
            });
            if (e.shiftKey) {
                sel.draw();
            } else if (e.ctrlKey) {
                sel.draw();
            }
        }
        ;
        $(sel.canvas).on("pointerdown", sel.canvas_pointerdown);
        $canvas_area.trigger("resize");
        $status_position.text("");
        $status_size.text("");
    }
}
;
Selection.prototype.cut_out_background = function() {
    var sel = this;
    var cutout = sel.canvas;
    var canvasImageData = ctx.getImageData(sel.x, sel.y, sel.width, sel.height);
    var cutoutImageData = cutout.ctx.getImageData(0, 0, sel.width, sel.height);
    var colored_cutout = new Canvas(cutout);
    replace_colors_with_swatch(colored_cutout.ctx, colors.background, sel.x, sel.y);
    var colored_cutout_image_data = colored_cutout.ctx.getImageData(0, 0, sel.width, sel.height);
    for (var i = 0; i < cutoutImageData.data.length; i += 4) {
        var in_cutout = cutoutImageData.data[i + 3] > 0;
        if (in_cutout) {
            cutoutImageData.data[i + 0] = canvasImageData.data[i + 0];
            cutoutImageData.data[i + 1] = canvasImageData.data[i + 1];
            cutoutImageData.data[i + 2] = canvasImageData.data[i + 2];
            cutoutImageData.data[i + 3] = canvasImageData.data[i + 3];
            canvasImageData.data[i + 0] = 0;
            canvasImageData.data[i + 1] = 0;
            canvasImageData.data[i + 2] = 0;
            canvasImageData.data[i + 3] = 0;
        } else {
            cutoutImageData.data[i + 0] = 0;
            cutoutImageData.data[i + 1] = 0;
            cutoutImageData.data[i + 2] = 0;
            cutoutImageData.data[i + 3] = 0;
        }
    }
    ctx.putImageData(canvasImageData, sel.x, sel.y);
    cutout.ctx.putImageData(cutoutImageData, 0, 0);
    sel.update_transparent_opaque();
    if (!transparency || transparent_opaque == "transparent") {
        ctx.drawImage(colored_cutout, sel.x, sel.y);
    }
}
;
Selection.prototype.update_transparent_opaque = function() {
    var sel = this;
    var sourceImageData = sel.source_canvas.ctx.getImageData(0, 0, sel.width, sel.height);
    var cutoutImageData = sel.canvas.ctx.createImageData(sel.width, sel.height);
    var background_color_rgba = get_rgba_from_color(colors.background);
    for (var i = 0; i < cutoutImageData.data.length; i += 4) {
        var in_cutout = sourceImageData.data[i + 3] > 0;
        if (transparent_opaque == "transparent") {
            if (sourceImageData.data[i + 0] === background_color_rgba[0] && sourceImageData.data[i + 1] === background_color_rgba[1] && sourceImageData.data[i + 2] === background_color_rgba[2] && sourceImageData.data[i + 3] === background_color_rgba[3]) {
                in_cutout = false;
            }
        }
        if (in_cutout) {
            cutoutImageData.data[i + 0] = sourceImageData.data[i + 0];
            cutoutImageData.data[i + 1] = sourceImageData.data[i + 1];
            cutoutImageData.data[i + 2] = sourceImageData.data[i + 2];
            cutoutImageData.data[i + 3] = sourceImageData.data[i + 3];
        } else {}
    }
    sel.canvas.ctx.putImageData(cutoutImageData, 0, 0);
}
;
Selection.prototype.replace_source_canvas = function(new_source_canvas) {
    var sel = this;
    sel.source_canvas = new_source_canvas;
    var new_canvas = new Canvas(new_source_canvas);
    $(sel.canvas).replaceWith(new_canvas);
    sel.canvas = new_canvas;
    var center_x = sel.x + sel.width / 2;
    var center_y = sel.y + sel.height / 2;
    var new_width = new_canvas.width;
    var new_height = new_canvas.height;
    sel.x = ~~(center_x - new_width / 2);
    sel.y = ~~(center_y - new_height / 2);
    sel.width = new_width;
    sel.height = new_height;
    sel.position();
    $(sel.canvas).on("pointerdown", sel.canvas_pointerdown);
    sel.$el.triggerHandler("new-element", [sel.canvas]);
    sel.$el.triggerHandler("resize");
    sel.update_transparent_opaque();
}
;
Selection.prototype.resize = function() {
    var sel = this;
    var new_source_canvas = new Canvas(sel.width,sel.height);
    new_source_canvas.ctx.drawImage(sel.source_canvas, 0, 0, sel.width, sel.height);
    sel.replace_source_canvas(new_source_canvas);
}
;
Selection.prototype.scale = function(factor) {
    var sel = this;
    var new_source_canvas = new Canvas(sel.width * factor,sel.height * factor);
    new_source_canvas.ctx.drawImage(sel.source_canvas, 0, 0, new_source_canvas.width, new_source_canvas.height);
    sel.replace_source_canvas(new_source_canvas);
}
;
Selection.prototype.draw = function() {
    try {
        ctx.drawImage(this.canvas, this.x, this.y);
    } catch (e) {}
}
;
Selection.prototype.destroy = function() {
    OnCanvasObject.prototype.destroy.call(this);
    $G.triggerHandler("session-update");
    $G.off("option-changed", this._on_option_changed);
}
;
Selection.prototype.crop = function() {
    var sel = this;
    sel.instantiate(null, "passive");
    if (sel.canvas) {
        undoable(0, function() {
            ctx.copy(sel.canvas);
            $canvas_area.trigger("resize");
        });
    }
}
;
