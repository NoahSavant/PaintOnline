/*!
* PEP v0.3.0 | https://github.com/jquery/PEP
* Copyright jQuery Foundation and other contributors | http://jquery.org/license
*/
(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.PointerEventsPolyfill = factory()
}(this, function() {
    'use strict';
    var USE_MAP = window.Map && window.Map.prototype.forEach;
    var POINTERS_FN = function() {
        return this.size;
    };
    function PointerMap() {
        if (USE_MAP) {
            var m = new Map();
            m.pointers = POINTERS_FN;
            return m;
        } else {
            this.keys = [];
            this.values = [];
        }
    }
    PointerMap.prototype = {
        set: function(inId, inEvent) {
            var i = this.keys.indexOf(inId);
            if (i > -1) {
                this.values[i] = inEvent;
            } else {
                this.keys.push(inId);
                this.values.push(inEvent);
            }
        },
        has: function(inId) {
            return this.keys.indexOf(inId) > -1;
        },
        'delete': function(inId) {
            var i = this.keys.indexOf(inId);
            if (i > -1) {
                this.keys.splice(i, 1);
                this.values.splice(i, 1);
            }
        },
        get: function(inId) {
            var i = this.keys.indexOf(inId);
            return this.values[i];
        },
        clear: function() {
            this.keys.length = 0;
            this.values.length = 0;
        },
        forEach: function(callback, thisArg) {
            this.values.forEach(function(v, i) {
                callback.call(thisArg, v, this.keys[i], this);
            }, this);
        },
        pointers: function() {
            return this.keys.length;
        }
    };
    var _pointermap = PointerMap;
    var CLONE_PROPS = ['bubbles', 'cancelable', 'view', 'detail', 'screenX', 'screenY', 'clientX', 'clientY', 'ctrlKey', 'altKey', 'shiftKey', 'metaKey', 'button', 'relatedTarget', 'buttons', 'pointerId', 'width', 'height', 'pressure', 'tiltX', 'tiltY', 'pointerType', 'hwTimestamp', 'isPrimary', 'type', 'target', 'currentTarget', 'which', 'pageX', 'pageY', 'timeStamp'];
    var CLONE_DEFAULTS = [false, false, null, null, 0, 0, 0, 0, false, false, false, false, 0, null, 0, 0, 0, 0, 0, 0, 0, '', 0, false, '', null, null, 0, 0, 0, 0];
    var HAS_SVG_INSTANCE = (typeof SVGElementInstance !== 'undefined');
    var dispatcher = {
        pointermap: new _pointermap(),
        eventMap: Object.create(null),
        captureInfo: Object.create(null),
        eventSources: Object.create(null),
        eventSourceList: [],
        registerSource: function(name, source) {
            var s = source;
            var newEvents = s.events;
            if (newEvents) {
                newEvents.forEach(function(e) {
                    if (s[e]) {
                        this.eventMap[e] = s[e].bind(s);
                    }
                }, this);
                this.eventSources[name] = s;
                this.eventSourceList.push(s);
            }
        },
        register: function(element) {
            var l = this.eventSourceList.length;
            for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
                es.register.call(es, element);
            }
        },
        unregister: function(element) {
            var l = this.eventSourceList.length;
            for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
                es.unregister.call(es, element);
            }
        },
        contains: function(container, contained) {
            return container.contains(contained);
        },
        down: function(inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointerdown', inEvent);
        },
        move: function(inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointermove', inEvent);
        },
        up: function(inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointerup', inEvent);
        },
        enter: function(inEvent) {
            inEvent.bubbles = false;
            this.fireEvent('pointerenter', inEvent);
        },
        leave: function(inEvent) {
            inEvent.bubbles = false;
            this.fireEvent('pointerleave', inEvent);
        },
        over: function(inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointerover', inEvent);
        },
        out: function(inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointerout', inEvent);
        },
        cancel: function(inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointercancel', inEvent);
        },
        leaveOut: function(event) {
            this.out(event);
            if (!this.contains(event.target, event.relatedTarget)) {
                this.leave(event);
            }
        },
        enterOver: function(event) {
            this.over(event);
            if (!this.contains(event.target, event.relatedTarget)) {
                this.enter(event);
            }
        },
        eventHandler: function(inEvent) {
            if (inEvent._handledByPE) {
                return;
            }
            var type = inEvent.type;
            var fn = this.eventMap && this.eventMap[type];
            if (fn) {
                fn(inEvent);
            }
            inEvent._handledByPE = true;
        },
        listen: function(target, events) {
            events.forEach(function(e) {
                this.addEvent(target, e);
            }, this);
        },
        unlisten: function(target, events) {
            events.forEach(function(e) {
                this.removeEvent(target, e);
            }, this);
        },
        addEvent: function(target, eventName) {
            target.addEventListener(eventName, this.boundHandler);
        },
        removeEvent: function(target, eventName) {
            target.removeEventListener(eventName, this.boundHandler);
        },
        makeEvent: function(inType, inEvent) {
            if (this.captureInfo[inEvent.pointerId]) {
                inEvent.relatedTarget = null;
            }
            var e = new PointerEvent(inType,inEvent);
            if (inEvent.preventDefault) {
                e.preventDefault = inEvent.preventDefault;
            }
            e._target = e._target || inEvent.target;
            return e;
        },
        fireEvent: function(inType, inEvent) {
            var e = this.makeEvent(inType, inEvent);
            return this.dispatchEvent(e);
        },
        cloneEvent: function(inEvent) {
            var eventCopy = Object.create(null), p;
            for (var i = 0; i < CLONE_PROPS.length; i++) {
                p = CLONE_PROPS[i];
                eventCopy[p] = inEvent[p] || CLONE_DEFAULTS[i];
                if (HAS_SVG_INSTANCE && (p === 'target' || p === 'relatedTarget')) {
                    if (eventCopy[p]instanceof SVGElementInstance) {
                        eventCopy[p] = eventCopy[p].correspondingUseElement;
                    }
                }
            }
            if (inEvent.preventDefault) {
                eventCopy.preventDefault = function() {
                    inEvent.preventDefault();
                }
                ;
            }
            return eventCopy;
        },
        getTarget: function(inEvent) {
            return this.captureInfo[inEvent.pointerId] || inEvent._target;
        },
        setCapture: function(inPointerId, inTarget) {
            if (this.captureInfo[inPointerId]) {
                this.releaseCapture(inPointerId);
            }
            this.captureInfo[inPointerId] = inTarget;
            var e = document.createEvent('Event');
            e.initEvent('gotpointercapture', true, false);
            e.pointerId = inPointerId;
            this.implicitRelease = this.releaseCapture.bind(this, inPointerId);
            document.addEventListener('pointerup', this.implicitRelease);
            document.addEventListener('pointercancel', this.implicitRelease);
            e._target = inTarget;
            this.asyncDispatchEvent(e);
        },
        releaseCapture: function(inPointerId) {
            var t = this.captureInfo[inPointerId];
            if (t) {
                var e = document.createEvent('Event');
                e.initEvent('lostpointercapture', true, false);
                e.pointerId = inPointerId;
                this.captureInfo[inPointerId] = undefined;
                document.removeEventListener('pointerup', this.implicitRelease);
                document.removeEventListener('pointercancel', this.implicitRelease);
                e._target = t;
                this.asyncDispatchEvent(e);
            }
        },
        dispatchEvent: function(inEvent) {
            var t = this.getTarget(inEvent);
            if (t) {
                return t.dispatchEvent(inEvent);
            }
        },
        asyncDispatchEvent: function(inEvent) {
            requestAnimationFrame(this.dispatchEvent.bind(this, inEvent));
        }
    };
    dispatcher.boundHandler = dispatcher.eventHandler.bind(dispatcher);
    var _dispatcher = dispatcher;
    var targeting = {
        shadow: function(inEl) {
            if (inEl) {
                return inEl.shadowRoot || inEl.webkitShadowRoot;
            }
        },
        canTarget: function(shadow) {
            return shadow && Boolean(shadow.elementFromPoint);
        },
        targetingShadow: function(inEl) {
            var s = this.shadow(inEl);
            if (this.canTarget(s)) {
                return s;
            }
        },
        olderShadow: function(shadow) {
            var os = shadow.olderShadowRoot;
            if (!os) {
                var se = shadow.querySelector('shadow');
                if (se) {
                    os = se.olderShadowRoot;
                }
            }
            return os;
        },
        allShadows: function(element) {
            var shadows = []
              , s = this.shadow(element);
            while (s) {
                shadows.push(s);
                s = this.olderShadow(s);
            }
            return shadows;
        },
        searchRoot: function(inRoot, x, y) {
            if (inRoot) {
                var t = inRoot.elementFromPoint(x, y);
                var st, sr, os;
                sr = this.targetingShadow(t);
                while (sr) {
                    st = sr.elementFromPoint(x, y);
                    if (!st) {
                        sr = this.olderShadow(sr);
                    } else {
                        var ssr = this.targetingShadow(st);
                        return this.searchRoot(ssr, x, y) || st;
                    }
                }
                return t;
            }
        },
        owner: function(element) {
            var s = element;
            while (s.parentNode) {
                s = s.parentNode;
            }
            if (s.nodeType != Node.DOCUMENT_NODE && s.nodeType != Node.DOCUMENT_FRAGMENT_NODE) {
                s = document;
            }
            return s;
        },
        findTarget: function(inEvent) {
            var x = inEvent.clientX
              , y = inEvent.clientY;
            var s = this.owner(inEvent.target);
            if (!s.elementFromPoint(x, y)) {
                s = document;
            }
            return this.searchRoot(s, x, y);
        }
    };
    var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
    var map = Array.prototype.map.call.bind(Array.prototype.map);
    var toArray = Array.prototype.slice.call.bind(Array.prototype.slice);
    var filter = Array.prototype.filter.call.bind(Array.prototype.filter);
    var MO = window.MutationObserver || window.WebKitMutationObserver;
    var SELECTOR = '[touch-action]';
    var OBSERVER_INIT = {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['touch-action']
    };
    function Installer(add, remove, changed, binder) {
        this.addCallback = add.bind(binder);
        this.removeCallback = remove.bind(binder);
        this.changedCallback = changed.bind(binder);
        if (MO) {
            this.observer = new MO(this.mutationWatcher.bind(this));
        }
    }
    Installer.prototype = {
        watchSubtree: function(target) {
            if (targeting.canTarget(target)) {
                this.observer.observe(target, OBSERVER_INIT);
            }
        },
        enableOnSubtree: function(target) {
            this.watchSubtree(target);
            if (target === document && document.readyState !== 'complete') {
                this.installOnLoad();
            } else {
                this.installNewSubtree(target);
            }
        },
        installNewSubtree: function(target) {
            forEach(this.findElements(target), this.addElement, this);
        },
        findElements: function(target) {
            if (target.querySelectorAll) {
                return target.querySelectorAll(SELECTOR);
            }
            return [];
        },
        removeElement: function(el) {
            this.removeCallback(el);
        },
        addElement: function(el) {
            this.addCallback(el);
        },
        elementChanged: function(el, oldValue) {
            this.changedCallback(el, oldValue);
        },
        concatLists: function(accum, list) {
            return accum.concat(toArray(list));
        },
        installOnLoad: function() {
            document.addEventListener('readystatechange', function() {
                if (document.readyState === 'complete') {
                    this.installNewSubtree(document);
                }
            }
            .bind(this));
        },
        isElement: function(n) {
            return n.nodeType === Node.ELEMENT_NODE;
        },
        flattenMutationTree: function(inNodes) {
            var tree = map(inNodes, this.findElements, this);
            tree.push(filter(inNodes, this.isElement));
            return tree.reduce(this.concatLists, []);
        },
        mutationWatcher: function(mutations) {
            mutations.forEach(this.mutationHandler, this);
        },
        mutationHandler: function(m) {
            if (m.type === 'childList') {
                var added = this.flattenMutationTree(m.addedNodes);
                added.forEach(this.addElement, this);
                var removed = this.flattenMutationTree(m.removedNodes);
                removed.forEach(this.removeElement, this);
            } else if (m.type === 'attributes') {
                this.elementChanged(m.target, m.oldValue);
            }
        }
    };
    if (!MO) {
        Installer.prototype.watchSubtree = function() {
            console.warn('PointerEventsPolyfill: MutationObservers not found, touch-action will not be dynamically detected');
        }
        ;
    }
    var installer = Installer;
    var MOUSE_PROPS = ['bubbles', 'cancelable', 'view', 'detail', 'screenX', 'screenY', 'clientX', 'clientY', 'ctrlKey', 'altKey', 'shiftKey', 'metaKey', 'button', 'relatedTarget', 'pageX', 'pageY'];
    var MOUSE_DEFAULTS = [false, false, null, null, 0, 0, 0, 0, false, false, false, false, 0, null, 0, 0];
    function _PointerEvent__PointerEvent(inType, inDict) {
        inDict = inDict || Object.create(null);
        var e = document.createEvent('Event');
        e.initEvent(inType, inDict.bubbles || false, inDict.cancelable || false);
        for (var i = 2, p; i < MOUSE_PROPS.length; i++) {
            p = MOUSE_PROPS[i];
            e[p] = inDict[p] || MOUSE_DEFAULTS[i];
        }
        e.buttons = inDict.buttons || 0;
        var pressure = 0;
        if (inDict.pressure) {
            pressure = inDict.pressure;
        } else {
            pressure = e.buttons ? 0.5 : 0;
        }
        e.x = e.clientX;
        e.y = e.clientY;
        e.pointerId = inDict.pointerId || 0;
        e.width = inDict.width || 0;
        e.height = inDict.height || 0;
        e.pressure = pressure;
        e.tiltX = inDict.tiltX || 0;
        e.tiltY = inDict.tiltY || 0;
        e.pointerType = inDict.pointerType || '';
        e.hwTimestamp = inDict.hwTimestamp || 0;
        e.isPrimary = inDict.isPrimary || false;
        return e;
    }
    var _PointerEvent = _PointerEvent__PointerEvent;
    function shadowSelector(v) {
        return 'body /shadow-deep/ ' + selector(v);
    }
    function selector(v) {
        return '[touch-action="' + v + '"]';
    }
    function rule(v) {
        return '{ -ms-touch-action: ' + v + '; touch-action: ' + v + '; touch-action-delay: none; }';
    }
    var attrib2css = ['none', 'auto', 'pan-x', 'pan-y', {
        rule: 'pan-x pan-y',
        selectors: ['pan-x pan-y', 'pan-y pan-x']
    }];
    var styles = '';
    var head = document.head;
    var hasNativePE = window.PointerEvent || window.MSPointerEvent;
    var hasShadowRoot = !window.ShadowDOMPolyfill && document.head.createShadowRoot;
    function applyAttributeStyles() {
        if (hasNativePE) {
            attrib2css.forEach(function(r) {
                if (String(r) === r) {
                    styles += selector(r) + rule(r) + '\n';
                    if (hasShadowRoot) {
                        styles += shadowSelector(r) + rule(r) + '\n';
                    }
                } else {
                    styles += r.selectors.map(selector) + rule(r.rule) + '\n';
                    if (hasShadowRoot) {
                        styles += r.selectors.map(shadowSelector) + rule(r.rule) + '\n';
                    }
                }
            });
            var el = document.createElement('style');
            el.textContent = styles;
            document.head.appendChild(el);
        }
    }
    var mouse__pointermap = _dispatcher.pointermap;
    var DEDUP_DIST = 25;
    var WHICH_TO_BUTTONS = [0, 1, 4, 2];
    var HAS_BUTTONS = false;
    try {
        HAS_BUTTONS = new MouseEvent('test',{
            buttons: 1
        }).buttons === 1;
    } catch (e) {}
    var mouseEvents = {
        POINTER_ID: 1,
        POINTER_TYPE: 'mouse',
        events: ['mousedown', 'mousemove', 'mouseup', 'mouseover', 'mouseout'],
        register: function(target) {
            _dispatcher.listen(target, this.events);
        },
        unregister: function(target) {
            _dispatcher.unlisten(target, this.events);
        },
        lastTouches: [],
        isEventSimulatedFromTouch: function(inEvent) {
            var lts = this.lastTouches;
            var x = inEvent.clientX
              , y = inEvent.clientY;
            for (var i = 0, l = lts.length, t; i < l && (t = lts[i]); i++) {
                var dx = Math.abs(x - t.x)
                  , dy = Math.abs(y - t.y);
                if (dx <= DEDUP_DIST && dy <= DEDUP_DIST) {
                    return true;
                }
            }
        },
        prepareEvent: function(inEvent) {
            var e = _dispatcher.cloneEvent(inEvent);
            var pd = e.preventDefault;
            e.preventDefault = function() {
                inEvent.preventDefault();
                pd();
            }
            ;
            e.pointerId = this.POINTER_ID;
            e.isPrimary = true;
            e.pointerType = this.POINTER_TYPE;
            if (!HAS_BUTTONS) {
                e.buttons = WHICH_TO_BUTTONS[e.which] || 0;
            }
            return e;
        },
        mousedown: function(inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var p = mouse__pointermap.has(this.POINTER_ID);
                if (p) {
                    this.cancel(inEvent);
                }
                var e = this.prepareEvent(inEvent);
                mouse__pointermap.set(this.POINTER_ID, inEvent);
                _dispatcher.down(e);
            }
        },
        mousemove: function(inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var e = this.prepareEvent(inEvent);
                _dispatcher.move(e);
            }
        },
        mouseup: function(inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var p = mouse__pointermap.get(this.POINTER_ID);
                if (p && p.button === inEvent.button) {
                    var e = this.prepareEvent(inEvent);
                    _dispatcher.up(e);
                    this.cleanupMouse();
                }
            }
        },
        mouseover: function(inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var e = this.prepareEvent(inEvent);
                _dispatcher.enterOver(e);
            }
        },
        mouseout: function(inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var e = this.prepareEvent(inEvent);
                _dispatcher.leaveOut(e);
            }
        },
        cancel: function(inEvent) {
            var e = this.prepareEvent(inEvent);
            _dispatcher.cancel(e);
            this.cleanupMouse();
        },
        cleanupMouse: function() {
            mouse__pointermap['delete'](this.POINTER_ID);
        }
    };
    var mouse = mouseEvents;
    var captureInfo = _dispatcher.captureInfo;
    var findTarget = targeting.findTarget.bind(targeting);
    var allShadows = targeting.allShadows.bind(targeting);
    var touch__pointermap = _dispatcher.pointermap;
    var touchMap = Array.prototype.map.call.bind(Array.prototype.map);
    var DEDUP_TIMEOUT = 2500;
    var CLICK_COUNT_TIMEOUT = 200;
    var ATTRIB = 'touch-action';
    var INSTALLER;
    var HAS_TOUCH_ACTION_DELAY = false;
    var touchEvents = {
        events: ['touchstart', 'touchmove', 'touchend', 'touchcancel'],
        register: function(target) {
            if (HAS_TOUCH_ACTION_DELAY) {
                _dispatcher.listen(target, this.events);
            } else {
                INSTALLER.enableOnSubtree(target);
            }
        },
        unregister: function(target) {
            if (HAS_TOUCH_ACTION_DELAY) {
                _dispatcher.unlisten(target, this.events);
            } else {}
        },
        elementAdded: function(el) {
            var a = el.getAttribute(ATTRIB);
            var st = this.touchActionToScrollType(a);
            if (st) {
                el._scrollType = st;
                _dispatcher.listen(el, this.events);
                allShadows(el).forEach(function(s) {
                    s._scrollType = st;
                    _dispatcher.listen(s, this.events);
                }, this);
            }
        },
        elementRemoved: function(el) {
            el._scrollType = undefined;
            _dispatcher.unlisten(el, this.events);
            allShadows(el).forEach(function(s) {
                s._scrollType = undefined;
                _dispatcher.unlisten(s, this.events);
            }, this);
        },
        elementChanged: function(el, oldValue) {
            var a = el.getAttribute(ATTRIB);
            var st = this.touchActionToScrollType(a);
            var oldSt = this.touchActionToScrollType(oldValue);
            if (st && oldSt) {
                el._scrollType = st;
                allShadows(el).forEach(function(s) {
                    s._scrollType = st;
                }, this);
            } else if (oldSt) {
                this.elementRemoved(el);
            } else if (st) {
                this.elementAdded(el);
            }
        },
        scrollTypes: {
            EMITTER: 'none',
            XSCROLLER: 'pan-x',
            YSCROLLER: 'pan-y',
            SCROLLER: /^(?:pan-x pan-y)|(?:pan-y pan-x)|auto$/
        },
        touchActionToScrollType: function(touchAction) {
            var t = touchAction;
            var st = this.scrollTypes;
            if (t === 'none') {
                return 'none';
            } else if (t === st.XSCROLLER) {
                return 'X';
            } else if (t === st.YSCROLLER) {
                return 'Y';
            } else if (st.SCROLLER.exec(t)) {
                return 'XY';
            }
        },
        POINTER_TYPE: 'touch',
        firstTouch: null,
        isPrimaryTouch: function(inTouch) {
            return this.firstTouch === inTouch.identifier;
        },
        setPrimaryTouch: function(inTouch) {
            if (touch__pointermap.pointers() === 0 || (touch__pointermap.pointers() === 1 && touch__pointermap.has(1))) {
                this.firstTouch = inTouch.identifier;
                this.firstXY = {
                    X: inTouch.clientX,
                    Y: inTouch.clientY
                };
                this.scrolling = false;
                this.cancelResetClickCount();
            }
        },
        removePrimaryPointer: function(inPointer) {
            if (inPointer.isPrimary) {
                this.firstTouch = null;
                this.firstXY = null;
                this.resetClickCount();
            }
        },
        clickCount: 0,
        resetId: null,
        resetClickCount: function() {
            var fn = function() {
                this.clickCount = 0;
                this.resetId = null;
            }
            .bind(this);
            this.resetId = setTimeout(fn, CLICK_COUNT_TIMEOUT);
        },
        cancelResetClickCount: function() {
            if (this.resetId) {
                clearTimeout(this.resetId);
            }
        },
        typeToButtons: function(type) {
            var ret = 0;
            if (type === 'touchstart' || type === 'touchmove') {
                ret = 1;
            }
            return ret;
        },
        touchToPointer: function(inTouch) {
            var cte = this.currentTouchEvent;
            var e = _dispatcher.cloneEvent(inTouch);
            var id = e.pointerId = inTouch.identifier + 2;
            e.target = captureInfo[id] || findTarget(e);
            e.bubbles = true;
            e.cancelable = true;
            e.detail = this.clickCount;
            e.button = 0;
            e.buttons = this.typeToButtons(cte.type);
            e.width = inTouch.webkitRadiusX || inTouch.radiusX || 0;
            e.height = inTouch.webkitRadiusY || inTouch.radiusY || 0;
            e.pressure = inTouch.webkitForce || inTouch.force || 0.5;
            e.isPrimary = this.isPrimaryTouch(inTouch);
            e.pointerType = this.POINTER_TYPE;
            var self = this;
            e.preventDefault = function() {
                self.scrolling = false;
                self.firstXY = null;
                cte.preventDefault();
            }
            ;
            return e;
        },
        processTouches: function(inEvent, inFunction) {
            var tl = inEvent.changedTouches;
            this.currentTouchEvent = inEvent;
            for (var i = 0, t; i < tl.length; i++) {
                t = tl[i];
                inFunction.call(this, this.touchToPointer(t));
            }
        },
        shouldScroll: function(inEvent) {
            if (this.firstXY) {
                var ret;
                var scrollAxis = inEvent.currentTarget._scrollType;
                if (scrollAxis === 'none') {
                    ret = false;
                } else if (scrollAxis === 'XY') {
                    ret = true;
                } else {
                    var t = inEvent.changedTouches[0];
                    var a = scrollAxis;
                    var oa = scrollAxis === 'Y' ? 'X' : 'Y';
                    var da = Math.abs(t['client' + a] - this.firstXY[a]);
                    var doa = Math.abs(t['client' + oa] - this.firstXY[oa]);
                    ret = da >= doa;
                }
                this.firstXY = null;
                return ret;
            }
        },
        findTouch: function(inTL, inId) {
            for (var i = 0, l = inTL.length, t; i < l && (t = inTL[i]); i++) {
                if (t.identifier === inId) {
                    return true;
                }
            }
        },
        vacuumTouches: function(inEvent) {
            var tl = inEvent.touches;
            if (touch__pointermap.pointers() >= tl.length) {
                var d = [];
                touch__pointermap.forEach(function(value, key) {
                    if (key !== 1 && !this.findTouch(tl, key - 2)) {
                        var p = value.out;
                        d.push(p);
                    }
                }, this);
                d.forEach(this.cancelOut, this);
            }
        },
        touchstart: function(inEvent) {
            this.vacuumTouches(inEvent);
            this.setPrimaryTouch(inEvent.changedTouches[0]);
            this.dedupSynthMouse(inEvent);
            if (!this.scrolling) {
                this.clickCount++;
                this.processTouches(inEvent, this.overDown);
            }
        },
        overDown: function(inPointer) {
            var p = touch__pointermap.set(inPointer.pointerId, {
                target: inPointer.target,
                out: inPointer,
                outTarget: inPointer.target
            });
            _dispatcher.over(inPointer);
            _dispatcher.enter(inPointer);
            _dispatcher.down(inPointer);
        },
        touchmove: function(inEvent) {
            if (!this.scrolling) {
                if (this.shouldScroll(inEvent)) {
                    this.scrolling = true;
                    this.touchcancel(inEvent);
                } else {
                    inEvent.preventDefault();
                    this.processTouches(inEvent, this.moveOverOut);
                }
            }
        },
        moveOverOut: function(inPointer) {
            var event = inPointer;
            var pointer = touch__pointermap.get(event.pointerId);
            if (!pointer) {
                return;
            }
            var outEvent = pointer.out;
            var outTarget = pointer.outTarget;
            _dispatcher.move(event);
            if (outEvent && outTarget !== event.target) {
                outEvent.relatedTarget = event.target;
                event.relatedTarget = outTarget;
                outEvent.target = outTarget;
                if (event.target) {
                    _dispatcher.leaveOut(outEvent);
                    _dispatcher.enterOver(event);
                } else {
                    event.target = outTarget;
                    event.relatedTarget = null;
                    this.cancelOut(event);
                }
            }
            pointer.out = event;
            pointer.outTarget = event.target;
        },
        touchend: function(inEvent) {
            this.dedupSynthMouse(inEvent);
            this.processTouches(inEvent, this.upOut);
        },
        upOut: function(inPointer) {
            if (!this.scrolling) {
                _dispatcher.up(inPointer);
                _dispatcher.out(inPointer);
                _dispatcher.leave(inPointer);
            }
            this.cleanUpPointer(inPointer);
        },
        touchcancel: function(inEvent) {
            this.processTouches(inEvent, this.cancelOut);
        },
        cancelOut: function(inPointer) {
            _dispatcher.cancel(inPointer);
            _dispatcher.out(inPointer);
            _dispatcher.leave(inPointer);
            this.cleanUpPointer(inPointer);
        },
        cleanUpPointer: function(inPointer) {
            touch__pointermap['delete'](inPointer.pointerId);
            this.removePrimaryPointer(inPointer);
        },
        dedupSynthMouse: function(inEvent) {
            var lts = mouse.lastTouches;
            var t = inEvent.changedTouches[0];
            if (this.isPrimaryTouch(t)) {
                var lt = {
                    x: t.clientX,
                    y: t.clientY
                };
                lts.push(lt);
                var fn = (function(lts, lt) {
                    var i = lts.indexOf(lt);
                    if (i > -1) {
                        lts.splice(i, 1);
                    }
                }
                ).bind(null, lts, lt);
                setTimeout(fn, DEDUP_TIMEOUT);
            }
        }
    };
    if (!HAS_TOUCH_ACTION_DELAY) {
        INSTALLER = new installer(touchEvents.elementAdded,touchEvents.elementRemoved,touchEvents.elementChanged,touchEvents);
    }
    var touch = touchEvents;
    var ms__pointermap = _dispatcher.pointermap;
    var HAS_BITMAP_TYPE = window.MSPointerEvent && typeof window.MSPointerEvent.MSPOINTER_TYPE_MOUSE === 'number';
    var msEvents = {
        events: ['MSPointerDown', 'MSPointerMove', 'MSPointerUp', 'MSPointerOut', 'MSPointerOver', 'MSPointerCancel', 'MSGotPointerCapture', 'MSLostPointerCapture'],
        register: function(target) {
            _dispatcher.listen(target, this.events);
        },
        unregister: function(target) {
            _dispatcher.unlisten(target, this.events);
        },
        POINTER_TYPES: ['', 'unavailable', 'touch', 'pen', 'mouse'],
        prepareEvent: function(inEvent) {
            var e = inEvent;
            if (HAS_BITMAP_TYPE) {
                e = _dispatcher.cloneEvent(inEvent);
                e.pointerType = this.POINTER_TYPES[inEvent.pointerType];
            }
            return e;
        },
        cleanup: function(id) {
            ms__pointermap['delete'](id);
        },
        MSPointerDown: function(inEvent) {
            ms__pointermap.set(inEvent.pointerId, inEvent);
            var e = this.prepareEvent(inEvent);
            _dispatcher.down(e);
        },
        MSPointerMove: function(inEvent) {
            var e = this.prepareEvent(inEvent);
            _dispatcher.move(e);
        },
        MSPointerUp: function(inEvent) {
            var e = this.prepareEvent(inEvent);
            _dispatcher.up(e);
            this.cleanup(inEvent.pointerId);
        },
        MSPointerOut: function(inEvent) {
            var e = this.prepareEvent(inEvent);
            _dispatcher.leaveOut(e);
        },
        MSPointerOver: function(inEvent) {
            var e = this.prepareEvent(inEvent);
            _dispatcher.enterOver(e);
        },
        MSPointerCancel: function(inEvent) {
            var e = this.prepareEvent(inEvent);
            _dispatcher.cancel(e);
            this.cleanup(inEvent.pointerId);
        },
        MSLostPointerCapture: function(inEvent) {
            var e = _dispatcher.makeEvent('lostpointercapture', inEvent);
            _dispatcher.dispatchEvent(e);
        },
        MSGotPointerCapture: function(inEvent) {
            var e = _dispatcher.makeEvent('gotpointercapture', inEvent);
            _dispatcher.dispatchEvent(e);
        }
    };
    var ms = msEvents;
    function platform_events__applyPolyfill() {
        if (!window.PointerEvent) {
            window.PointerEvent = _PointerEvent;
            if (window.navigator.msPointerEnabled) {
                var tp = window.navigator.msMaxTouchPoints;
                Object.defineProperty(window.navigator, 'maxTouchPoints', {
                    value: tp,
                    enumerable: true
                });
                _dispatcher.registerSource('ms', ms);
            } else {
                _dispatcher.registerSource('mouse', mouse);
                if (window.ontouchstart !== undefined) {
                    _dispatcher.registerSource('touch', touch);
                }
            }
            _dispatcher.register(document);
        }
    }
    var n = window.navigator;
    var s, r;
    function assertDown(id) {
        if (!_dispatcher.pointermap.has(id)) {
            throw new Error('InvalidPointerId');
        }
    }
    if (n.msPointerEnabled) {
        s = function(pointerId) {
            assertDown(pointerId);
            this.msSetPointerCapture(pointerId);
        }
        ;
        r = function(pointerId) {
            assertDown(pointerId);
            this.msReleasePointerCapture(pointerId);
        }
        ;
    } else {
        s = function setPointerCapture(pointerId) {
            assertDown(pointerId);
            _dispatcher.setCapture(pointerId, this);
        }
        ;
        r = function releasePointerCapture(pointerId) {
            assertDown(pointerId);
            _dispatcher.releaseCapture(pointerId, this);
        }
        ;
    }
    function capture__applyPolyfill() {
        if (window.Element && !Element.prototype.setPointerCapture) {
            Object.defineProperties(Element.prototype, {
                'setPointerCapture': {
                    value: s
                },
                'releasePointerCapture': {
                    value: r
                }
            });
        }
    }
    applyAttributeStyles();
    platform_events__applyPolyfill();
    capture__applyPolyfill();
    var pointerevents = {
        dispatcher: _dispatcher,
        Installer: installer,
        PointerEvent: _PointerEvent,
        PointerMap: _pointermap,
        targetFinding: targeting
    };
    return pointerevents;
}));
