var Konami = {};
(function() {
    var afterSequence = function(sequence, action) {
        var index = 0;
        return function(event) {
            var matchedKey = event.keyCode === sequence[index];
            if (!matchedKey) {
                index = 0;
                matchedKey = event.keyCode === sequence[index];
            }
            if (matchedKey) {
                index += 1;
                if (event.keyCode === 66 || event.keyCode === 65) {
                    event.preventDefault();
                }
                if (index === sequence.length) {
                    index = 0;
                    action();
                }
            }
        }
        ;
    };
    Konami.code = function(action) {
        return afterSequence([38, 38, 40, 40, 37, 39, 37, 39, 66, 65], action);
    }
    ;
}());
