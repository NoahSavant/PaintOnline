(function() {
    var rAF_ID, rotologo, $window, space_phase_key_handler, player;
    var vaporwave_active = false;
    if (parent && frameElement && parent.$) {
        $window = parent.$(frameElement).closest(".window");
    } else {
        $window = $();
    }
    var wait_for_youtube_api = function(callback) {
        if (typeof YT !== "undefined") {
            callback();
        } else {
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/player_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = function() {
                callback();
            }
            ;
        }
    };
    var stop_vaporwave = function() {
        vaporwave_active = false;
        cancelAnimationFrame(rAF_ID);
        $(rotologo).remove();
        $window.css({
            transform: ""
        });
        removeEventListener("keydown", space_phase_key_handler);
        if (player) {
            player.destroy();
            player = null;
        }
    };
    var start_vaporwave = function() {
        vaporwave_active = true;
        rotologo = document.createElement("img");
        rotologo.classList.add("rotologo");
        if (frameElement) {
            frameElement.parentElement.appendChild(rotologo);
            rotologo.src = "images/logo/98.js.org.svg";
        } else {
            document.body.appendChild(rotologo);
            rotologo.src = "images/98.js.org.svg";
        }
        $(rotologo).css({
            position: "absolute",
            left: "50%",
            top: "50%",
            pointerEvents: "none",
            transformOrigin: "0% 0%",
            transition: "opacity 1s ease",
            opacity: "0",
        });
        var animate = function() {
            rAF_ID = requestAnimationFrame(animate);
            $(rotologo).css({
                transform: `perspective(4000px) rotateY(${Math.sin(Date.now() / 5000)}turn) rotateX(${0}turn) translate(-50%, -50%) translateZ(500px)`,
                filter: `hue-rotate(${Math.sin(Date.now() / 4000)}turn)`,
            });
            if ($window.length) {
                var el = $window[0];
                var offsetLeft = 0;
                var offsetTop = 0;
                do {
                    offsetLeft += el.offsetLeft;
                    offsetTop += el.offsetTop;
                    el = el.offsetParent;
                } while (el);
                $window.css({
                    transform: `perspective(4000px) rotateY(${-(offsetLeft + ($window.outerWidth() - parent.innerWidth) / 2) / parent.innerWidth / 3}turn) rotateX(${(offsetTop + ($window.outerHeight() - parent.innerHeight) / 2) / parent.innerHeight / 3}turn)`,
                    transformOrigin: "50% 50%",
                    transformStyle: "preserve-3d",
                });
            }
        };
        animate();
        var player_placeholder = document.createElement("div");
        document.querySelector(".canvas-area").appendChild(player_placeholder);
        $(player_placeholder).css({
            position: "absolute",
            top: "3px",
            left: "3px",
            mixBlendMode: "multiply",
            pointerEvents: "none",
            transition: "opacity 0.4s ease",
            width: "100vw",
            height: "100vh",
        });
        wait_for_youtube_api(function() {
            player = new YT.Player(player_placeholder,{
                height: "390",
                width: "640",
                videoId: "8TvcyPCgKSU",
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                },
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                },
            });
        });
        function onPlayerReady(event) {
            player.playVideo();
            player.unMute();
        }
        function onPlayerStateChange(event) {
            if (event.data == YT.PlayerState.PLAYING) {
                setTimeout(function() {
                    $(rotologo).css({
                        opacity: 1
                    });
                }, 14150);
            }
            if (event.data == YT.PlayerState.ENDED) {
                player.destroy();
                player = null;
                $(rotologo).css({
                    opacity: 0
                });
                setTimeout(stop_vaporwave, 1200);
            }
        }
        var is_theoretically_playing = true;
        space_phase_key_handler = function(e) {
            if (e.which === 32) {
                if (is_theoretically_playing) {
                    player.pauseVideo();
                    is_theoretically_playing = false;
                    $(player.getIframe()).add(rotologo).css({
                        opacity: "0"
                    });
                } else {
                    player.playVideo();
                    is_theoretically_playing = true;
                    $(player.getIframe()).add(rotologo).css({
                        opacity: ""
                    });
                }
                e.preventDefault();
            }
        }
        ;
        addEventListener("keydown", space_phase_key_handler);
    };
    var toggle_vaporwave = function() {
        if (vaporwave_active) {
            stop_vaporwave();
        } else {
            start_vaporwave();
        }
    };
    addEventListener("keydown", Konami.code(toggle_vaporwave));
}());
