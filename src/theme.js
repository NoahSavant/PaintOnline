(function() {
    var default_theme = "classic.css";
    var theme_storage_key = "jspaint theme";
    var current_theme = get_current_theme();
    var theme_link = create_theme_link_element(href_for(current_theme));
    var theme_style = create_element("style", {});
    load_initial_theme_into_head();
    export_methods_to_window();
    function load_initial_theme_into_head() {
        document.head.appendChild(theme_link);
    }
    function export_methods_to_window() {
        window.set_theme = set_theme;
        window.get_theme = get_theme;
    }
    function set_theme(theme) {
        current_theme = theme;
        var can_probably_refresh_to_switch = true;
        try {
            localStorage[theme_storage_key] = theme;
        } catch (e) {
            can_probably_refresh_to_switch = false;
        }
        fetch_theme_css(theme, can_probably_refresh_to_switch).then(function(css) {
            replace_existing_theme_with_loaded_css(theme_link, theme_style, css);
        });
    }
    function get_theme() {
        return current_theme;
    }
    function get_current_theme() {
        try {
            return localStorage[theme_storage_key] || default_theme;
        } catch (exception) {
            return default_theme;
        }
    }
    function href_for(theme) {
        return "styles/themes/" + theme;
    }
    function create_theme_link_element(href) {
        return create_element("link", {
            "rel": "stylesheet",
            "type": "text/css",
            "href": href,
            "id": "theme-link"
        });
    }
    function create_element(name, attributes) {
        var element = document.createElement(name);
        for (var attribute_name in attributes) {
            element.setAttribute(attribute_name, attributes[attribute_name]);
        }
        return element;
    }
    function fetch_theme_css(theme, can_probably_refresh_to_switch) {
        var error_message = "Failed to load theme.";
        if (can_probably_refresh_to_switch) {
            error_message += " You can probably reload the app to finish switching themes.";
        }
        return fetch(href_for(theme)).catch(function(error_thrown) {
            show_error_message(error_message, error_thrown);
        }).then(function(response) {
            return response.text();
        });
    }
    function replace_existing_theme_with_loaded_css(theme_link, theme_style, css_content) {
        if (theme_link.parentElement) {
            theme_link.parentElement.removeChild(theme_link);
        }
        theme_style.textContent = css_content;
        document.head.appendChild(theme_style);
        $(window).triggerHandler("theme-load");
    }
}
)();
