/**
 * A standalone JavaScript plugin for replacing physical scrollbars with custom ones.
 * Mobile devices retain their native scrollbars.
 *
 * @name scrollbar.js
 * @version 0.1.0
 * @author Aleksandras Nelkinas <alex@cinamonas.io>
 * @license [MIT]{@link http://opensource.org/licenses/mit-license.php}
 *
 * Copyright (c) 2014 Aleksandras Nelkinas
 */

'use strict';

var defaults = {
  elements: {
    area: '.scrollbar-area',
    wrapper: '.scrollbar-wrapper',
    track: '.scrollbar-track',
    handle: '.scrollbar-handle'
  },
  stateClasses: {
    dragging: 'scrollbar-dragging',
    hover: 'scrollbar-hover'
  }
};


// Constructor

function Scrollbar(element, opts) {

  // handle constructor call without `new` keyword
  if (!(this instanceof Scrollbar)) {
    return new Scrollbar(element, opts);
  }

  // is plugin already initialized?
  if (this.el) {
    return;
  }

  this.el = element;
  this.opts = extend({}, defaults, opts || {});

  this._setupElements();

  // check if browser has physical scrollbars (usually desktop)
  if (this.scrollbarWidth = getScrollbarWidth()) {
    this._enableTrack();

    this._observeHover(this.area);
    this._observeHover(this.track);
    this._enableScroll();
    this._enableDragging();

    this.refresh();
  } else {
    this._allowNativeScroll();
  }

  return this;
}


// API

extend(Scrollbar.prototype, {

  /**
   * Destroys plugin instance.
   */
  destroy: function () {
    var stateClasses = this.opts.stateClasses;

    this._removeAllListeners();

    this.wrapper.style.overflowY = '';
    this.wrapper.style.marginRight = '';
    this.track.style.display = '';

    removeClass(document.body, stateClasses.dragging);
    removeClass(this.area, stateClasses.dragging);
    removeClass(this.area, stateClasses.hover);
    removeClass(this.track, stateClasses.hover);

    delete this.el;
  },

  /**
   * Refreshes scrollbar by adjusting its handle's height and position.
   */
  refresh: function () {
    var newRatio;

    if (!this.el || !this.scrollbarWidth) {
      return;
    }

    if (this.wrapper.scrollHeight > this.wrapper.offsetHeight) {
      this.track.style.display = 'block';

      newRatio = this.track.offsetHeight / this.wrapper.scrollHeight;

      if (newRatio !== this.ratio) {
        this.ratio = newRatio;

        this._resizeHandle();
        this._positionHandle();
      }
    } else {
      this.track.style.display = 'none';
    }
  },


  // Private

  /**
   * Sets up elements.
   *
   * @private
   */
  _setupElements: function () {
    var elements = this.opts.elements;

    this.area = this.el.querySelector(elements.area);
    this.wrapper = this.el.querySelector(elements.wrapper);
    this.handle = this.el.querySelector(elements.handle);
    this.track = this.el.querySelector(elements.track);
  },

  /**
   * Observes when element is hovered and toggles corresponding class.
   *
   * @param {HTMLElement} element
   * @private
   */
  _observeHover: function (element) {
    var cls = this.opts.stateClasses.hover;

    this._addListener(element, 'mouseenter', function () {
      addClass(element, cls);
    });
    this._addListener(element, 'mouseleave', function () {
      removeClass(element, cls);
    });
  },

  /**
   * Enables scroll by overflowing native scrollbar and starting to listen to `scroll` event.
   *
   * @private
   */
  _enableScroll: function () {
    this._addListener(this.wrapper, 'scroll', bind(this._positionHandle, this));
  },

  /**
   * Enables handle's dragging along the track.
   *
   * @private
   */
  _enableDragging: function () {
    var cls = this.opts.stateClasses.dragging,
        initialPosition = null,
        initialTop = null,
        startDragging,
        stopDragging;

    this._addListener(this.handle, 'mousedown', bind(function (e) {
      initialPosition = this.wrapper.scrollTop;
      initialTop = e.clientY;

      this._addListener(document, 'mousemove', startDragging);
      this._addListener(document, 'mouseup', stopDragging);
    }, this));

    startDragging = bind(function (e) {
      var newPosition,
          wrapperHeight,
          wrapperInnerHeight;

      if (initialTop !== null) {
        newPosition = Math.round(initialPosition + (e.clientY - initialTop) / this.ratio);

        wrapperHeight = this.wrapper.offsetHeight;
        wrapperInnerHeight = this.wrapper.scrollHeight;

        if (newPosition + wrapperHeight > wrapperInnerHeight) {
          newPosition = wrapperInnerHeight - wrapperHeight;
        }

        this.wrapper.scrollTop = newPosition;
        this._positionHandle();

        addClass(document.body, cls);
        addClass(this.area, cls);
      }
    }, this);

    stopDragging = bind(function () {
      initialTop = null;
      initialPosition = null;

      removeClass(document.body, cls);
      removeClass(this.area, cls);

      this._removeListener(document, 'mousemove', startDragging);
      this._removeListener(document, 'mouseup', stopDragging);
    }, this);
  },

  /**
   * Enables track.
   *
   * @private
   */
  _enableTrack: function () {
    this.wrapper.style.overflowY = 'scroll';
    this.wrapper.style.marginRight = -1 * this.scrollbarWidth + 'px';
  },

  /**
   * Allows native scrolling by making sure that div is scrollable.
   *
   * @private
   */
  _allowNativeScroll: function () {
    this.wrapper.style.overflowY = 'auto';
  },

  /**
   * Resizes handle by adjusting its `height`.
   *
   * @private
   */
  _resizeHandle: function () {
    this.handle.style.height = Math.ceil(this.ratio * this.track.offsetHeight) + 'px';
  },

  /**
   * Positions handle by adjusting its `top` position.
   *
   * @private
   */
  _positionHandle: function () {
    var wrapperTop = this.wrapper.scrollTop,
        top;

    if (wrapperTop + this.wrapper.offsetHeight < this.wrapper.scrollHeight) {
      top = Math.ceil(this.ratio * this.wrapper.scrollTop);
    } else {

      // if scroll position has reached the end, force scrollbar to track's end
      top = this.track.offsetHeight - this.handle.offsetHeight;
    }

    this.handle.style.top = top + 'px';
  },

  /**
   * Adds event listener and keeps track of it.
   *
   * @param {HTMLElement} element
   * @param {String}      eventName
   * @param {Function}    handler
   * @private
   */
  _addListener: function (element, eventName, handler) {
    var events = this._events;

    if (!events) {
      this._events = events = {};
    }
    if (!events[eventName]) {
      events[eventName] = [];
    }

    events[eventName].push({
      element: element,
      handler: handler
    });

    addEventListener.apply(null, arguments);
  },

  /**
   * Removes event listener.
   *
   * @param {HTMLElement} element
   * @param {String}      eventName
   * @param {Function}    handler
   * @private
   */
  _removeListener: function (element, eventName, handler) {
    var event = this._events[eventName],
        index,
        total;

    for (index = 0, total = event.length; index < total; index++) {
      if (event[index].handler === handler) {
        event.splice(index, 1);
        removeEventListener.apply(null, arguments);
        break;
      }
    }
  },

  /**
   * Removes all event listeners.
   *
   * @private
   */
  _removeAllListeners: function () {
    var events = this._events,
        eventName,
        event,
        iter,
        total;

    for (eventName in events) {
      event = events[eventName];

      for (iter = 0, total = event.length; iter < total; iter++) {
        removeEventListener(event[iter].element, eventName, event[iter].handler);
      }
    }

    delete this._events;
  }

});


// Utility functions

function bind(fn, context) {
  return function () {
    fn.apply(context, arguments);
  };
}

function extend() {
  var iter;

  for (iter = 1; iter < arguments.length; iter++) {
    var key;

    for (key in arguments[iter]) {
      if (arguments[iter].hasOwnProperty(key)) {
        arguments[0][key] = arguments[iter][key];
      }
    }
  }
  return arguments[0];
}

function addEventListener(el, eventName, handler) {
  if (el.addEventListener) {
    el.addEventListener(eventName, handler);
  } else {
    el.attachEvent('on' + eventName, handler);
  }
}

function removeEventListener(el, eventName, handler) {
  if (el.removeEventListener) {
    el.removeEventListener(eventName, handler);
  } else {
    el.detachEvent('on' + eventName, handler);
  }
}

function addClass(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ' ' + className;
  }
}

function removeClass(el, className) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
}

function getScrollbarWidth() {
  var wrapper = document.createElement('div'),
      content = document.createElement('div'),
      width;

  wrapper.style.position = 'absolute';
  wrapper.style.top = '-50px';
  wrapper.style.height = '50px';
  wrapper.style.overflow = 'scroll';

  wrapper.appendChild(content);
  document.body.appendChild(wrapper);

  width = wrapper.offsetWidth - content.offsetWidth;

  document.body.removeChild(wrapper);

  return width;
}


module.exports = Scrollbar;
