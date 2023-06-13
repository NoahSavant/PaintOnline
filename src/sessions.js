(function() {
    var log = function() {
        if (typeof console !== "undefined") {
            console.log.apply(console, arguments);
        }
    };
    var LocalSession = function(session_id) {
        var lsid = "image#" + session_id;
        log("local storage id: " + lsid);
        var save_image_to_storage = function() {
            storage.set(lsid, canvas.toDataURL("image/png"), function(err) {
                if (err) {
                    if (err.quotaExceeded) {
                        storage_quota_exceeded();
                    } else {}
                }
            });
        }
        storage.get(lsid, function(err, uri) {
            if (err) {
                show_error_message("Failed to retrieve image from local storage:", err);
            } else if (uri) {
                open_from_URI(uri, function(err) {
                    if (err) {
                        return show_error_message("Failed to open image from local storage:", err);
                    }
                    saved = false;
                });
            } else {
                save_image_to_storage();
            }
        });
        $canvas.on("change.session-hook", save_image_to_storage);
    };
    LocalSession.prototype.end = function() {
        $app.find("*").off(".session-hook");
        $G.off(".session-hook");
    }
    ;
    var user_id;
    var user = {
        cursor: {
            x: 0,
            y: 0,
            away: true,
        },
        tool: "Pencil",
        hue: ~~(Math.random() * 360),
        saturation: ~~(Math.random() * 50) + 50,
        lightness: ~~(Math.random() * 40) + 50,
    };
    user.color = "hsla(" + user.hue + ", " + user.saturation + "%, " + user.lightness + "%, 1)";
    user.color_transparent = "hsla(" + user.hue + ", " + user.saturation + "%, " + user.lightness + "%, 0.5)";
    user.color_desaturated = "hsla(" + user.hue + ", " + ~~(user.saturation * 0.4) + "%, " + user.lightness + "%, 0.8)";
    var cursor_image = new Image();
    cursor_image.src = "images/cursors/default.png";
    var FireSession = function(session_id) {
        var session = this;
        session.id = session_id;
        file_name = "[Loading " + session.id + "]";
        update_title();
        var on_firebase_loaded = function() {
            file_name = "[" + session.id + "]";
            update_title();
            session.start();
        };
        if (!FireSession.fb_root) {
            $.getScript("lib/firebase.js").done(function() {
                var config = {
                    apiKey: "AIzaSyBgau8Vu9ZE8u_j0rp-Lc044gYTX5O3X9k",
                    authDomain: "jspaint.firebaseapp.com",
                    databaseURL: "https://jspaint.firebaseio.com",
                    projectId: "firebase-jspaint",
                    storageBucket: "",
                    messagingSenderId: "63395010995"
                };
                firebase.initializeApp(config);
                FireSession.fb_root = firebase.database().ref("/");
                on_firebase_loaded();
            }).fail(function() {
                show_error_message("Failed to load Firebase; the document will not load, and changes will not be saved.");
                file_name = "[Failed to load " + session.id + "]";
                update_title();
            });
        } else {
            on_firebase_loaded();
        }
    };
    FireSession.prototype.start = function() {
        var session = this;
        var $w = $FormWindow().title("Warning").addClass("dialogue-window");
        $w.$main.html("<p>The Firebase quota was exceeded very quickly when JS Paint got a ton of traffic.</p>" + "<p>I haven't found any way to actually <i>detect</i> this case, " + "so for now I'm showing this message, regardless of whether it's working.</p>" + "<p>There's a bit more quota at the start of the month, " + "but the document may not load, and changes may not be saved.</p>" + "<p>If you're interested in using this feature, please subscribe to and thumbs-up " + "<a href='https://github.com/1j01/jspaint/issues/68'>this issue</a>.</p>");
        $w.$main.css({
            maxWidth: "500px"
        });
        $w.$Button("OK", function() {
            $w.close();
        });
        $w.center();
        session._fb_listeners = [];
        var _fb_on = function(fb, event_type, callback, error_callback) {
            session._fb_listeners.push([fb, event_type, callback, error_callback]);
            fb.on(event_type, callback, error_callback);
        };
        session.fb = FireSession.fb_root.child(session.id);
        session.fb_data = session.fb.child("data");
        session.fb_users = session.fb.child("users");
        if (user_id) {
            session.fb_user = session.fb_users.child(user_id);
        } else {
            session.fb_user = session.fb_users.push();
            user_id = session.fb_user.key;
        }
        session.fb_user.onDisconnect().remove();
        session.fb_user.set(user);
        _fb_on(session.fb_users, "child_added", function(snap) {
            if (snap.key === user_id) {
                return;
            }
            var fb_other_user = snap.ref;
            var other_user = snap.val();
            var cursor_canvas = new Canvas(32,32);
            var $cursor = $(cursor_canvas).addClass("user-cursor").appendTo($app);
            $cursor.css({
                display: "none",
                position: "absolute",
                left: 0,
                top: 0,
                opacity: 0,
                zIndex: 500,
                pointerEvents: "none",
                transition: "opacity 0.5s",
            });
            _fb_on(fb_other_user, "value", function(snap) {
                other_user = snap.val();
                if (other_user == null) {
                    $cursor.remove();
                } else {
                    var draw_cursor = function() {
                        cursor_canvas.width = cursor_image.width;
                        cursor_canvas.height = cursor_image.height;
                        var cctx = cursor_canvas.ctx;
                        cctx.fillStyle = other_user.color;
                        cctx.fillRect(0, 0, cursor_canvas.width, cursor_canvas.height);
                        cctx.globalCompositeOperation = "darker";
                        cctx.drawImage(cursor_image, 0, 0);
                        cctx.globalCompositeOperation = "destination-atop";
                        cctx.drawImage(cursor_image, 0, 0);
                    };
                    if (cursor_image.complete) {
                        draw_cursor();
                    } else {
                        $(cursor_image).one("load", draw_cursor);
                    }
                    var canvas_rect = canvas.getBoundingClientRect();
                    $cursor.css({
                        display: "block",
                        position: "absolute",
                        left: canvas_rect.left + magnification * other_user.cursor.x,
                        top: canvas_rect.top + magnification * other_user.cursor.y,
                        opacity: 1 - other_user.cursor.away,
                    });
                }
            });
        });
        var previous_uri;
        var pointer_operations = [];
        var sync = function() {
            var uri = canvas.toDataURL();
            if (previous_uri !== uri) {
                log("clear pointer operations to set data", pointer_operations);
                pointer_operations = [];
                log("set data");
                session.fb_data.set(uri);
                previous_uri = uri;
            } else {
                log("don't set data; it hasn't changed");
            }
        };
        $canvas.on("change.session-hook", sync);
        _fb_on(session.fb_data, "value", function(snap) {
            log("data update");
            var uri = snap.val();
            if (uri == null) {
                sync();
            } else {
                previous_uri = uri;
                saved = true;
                var img = new Image();
                img.onload = function() {
                    if (pointer_operations.length) {
                        $G.triggerHandler("pointerup", "cancel");
                    }
                    ctx.copy(img);
                    $canvas_area.trigger("resize");
                    window.console && console.log("playback", pointer_operations);
                    for (var i = 0; i < pointer_operations.length; i++) {
                        var e = pointer_operations[i];
                        $canvas.triggerHandler(e, ["synthetic"]);
                        $G.triggerHandler(e, ["synthetic"]);
                    }
                }
                ;
                img.src = uri;
            }
        }, function(error) {
            show_error_message("Failed to retrieve data from Firebase. The document will not load, and changes will not be saved.", error);
            file_name = "[Failed to load " + session.id + "]";
            update_title();
        });
        $G.on("pointermove.session-hook", function(e) {
            var m = e2c(e);
            session.fb_user.child("cursor").update({
                x: m.x,
                y: m.y,
                away: false,
            });
        });
        $G.on("blur.session-hook", function(e) {
            session.fb_user.child("cursor").update({
                away: true,
            });
        });
    }
    ;
    FireSession.prototype.end = function() {
        var session = this;
        $app.find("*").off(".session-hook");
        $G.off(".session-hook");
        var _;
        while (_ = session._fb_listeners.pop()) {
            log("remove listener for " + _[0].path.toString() + " .on " + _[1]);
            _[0].off(_[1], _[2], _[3]);
        }
        session.fb_user.remove();
        $app.find(".user-cursor").remove();
        reset_file();
    }
    ;
    var current_session;
    var end_current_session = function() {
        if (current_session) {
            log("ending current session");
            current_session.end();
            current_session = null;
        }
    };
    var generate_session_id = function() {
        return (Math.random() * Math.pow(2, 32)).toString(16).replace(".", "");
    };
    var update_session_from_location_hash = function(e) {
        var session_match = location.hash.match(/^#?(session|local):(.*)$/i);
        var load_from_url_match = location.hash.match(/^#?(load):(.*)$/i);
        if (session_match) {
            var local = session_match[1] === "local";
            var session_id = session_match[2];
            if (session_id === "") {
                log("invalid session id; session id cannot be empty");
                end_current_session();
            } else if (!local && session_id.match(/[\.\/\[\]#$]/)) {
                log("session id is not a valid Firebase location; it cannot contain any of ./[]#$");
                end_current_session();
            } else if (!session_id.match(/[\-0-9A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02af\u1d00-\u1d25\u1d62-\u1d65\u1d6b-\u1d77\u1d79-\u1d9a\u1e00-\u1eff\u2090-\u2094\u2184-\u2184\u2488-\u2490\u271d-\u271d\u2c60-\u2c7c\u2c7e-\u2c7f\ua722-\ua76f\ua771-\ua787\ua78b-\ua78c\ua7fb-\ua7ff\ufb00-\ufb06]+/)) {
                log("invalid session id; it must consist of 'alphanumeric-esque' character");
                end_current_session();
            } else if (current_session && current_session.id === session_id) {
                log("hash changed but the session id is the same");
            } else {
                end_current_session();
                if (local) {
                    log("starting a new local session, id: " + session_id);
                    current_session = new LocalSession(session_id);
                } else {
                    log("starting a new Firebase session, id: " + session_id);
                    current_session = new FireSession(session_id);
                }
            }
        } else if (load_from_url_match) {
            var url = decodeURIComponent(load_from_url_match[2]);
            var hash_loading_url_from = location.hash;
            end_current_session();
            open_from_URI(url, function(err) {
                if (err) {
                    show_resource_load_error_message();
                }
                setTimeout(function() {
                    $canvas.one("change", function() {
                        if (location.hash === hash_loading_url_from) {
                            log("switching to new session from #load: URL because of user interaction");
                            end_current_session();
                            var new_session_id = generate_session_id();
                            location.hash = "local:" + new_session_id;
                        }
                    });
                }, 100);
            });
        } else {
            log("no session id in hash");
            end_current_session();
            var new_session_id = generate_session_id();
            history.replaceState(null, document.title, "#local:" + new_session_id);
            log("after replaceState", location.hash);
            update_session_from_location_hash();
        }
    };
    $G.on("hashchange popstate", function(e) {
        log(e.type, location.hash);
        update_session_from_location_hash();
    });
    log("init with location hash", location.hash);
    update_session_from_location_hash();
}
)();
