var bind = require('bind');
var classes = require('classes');
var css = require('css');
var events = require('events');
var q = require('query');
var inherit = require('inherit');

module.exports = Antiscroll;

/**
 * Antiscroll pane constructor.
 *
 * @param {Element|jQuery} main pane
 * @parma {Object} options
 * @api public
 */

function Antiscroll (el, opts) {
  if (!(this instanceof Antiscroll)) return new Antiscroll(el, opts);
  this.el = el;
  this.options = opts || {};

  this.x = (false !== this.options.x) || this.options.forceHorizontal;
  this.y = (false !== this.options.y) || this.options.forceVertical;
  this.autoHide = false !== this.options.autoHide;
  this.padding = undefined === this.options.padding ? 2 : this.options.padding;

  this.inner = q('.antiscroll-inner', this.el);

  css(this.inner, {
    width:  this.inner.offsetWidth + (this.y ? scrollbarSize() : 0),
    height: this.inner.offsetHeight + (this.x ? scrollbarSize() : 0)
  });

  this.refresh();
}

/**
 * refresh scrollbars
 *
 * @api public
 */

Antiscroll.prototype.refresh = function() {
  var needHScroll = this.inner.scrollWidth > this.el.offsetWidth + (this.y ? scrollbarSize() : 0),
    needVScroll = this.inner.scrollHeight > this.el.offsetHeight + (this.x ? scrollbarSize() : 0);

  if (this.x) {
    if (!this.horizontal && needHScroll) {
      this.horizontal = new Scrollbar.Horizontal(this);
    } else if (this.horizontal && !needHScroll)  {
      this.horizontal.destroy();
      this.horizontal = null;
    } else if (this.horizontal) {
      this.horizontal.update();
    }
  }

  if (this.y) {
    if (!this.vertical && needVScroll) {
      this.vertical = new Scrollbar.Vertical(this);
    } else if (this.vertical && !needVScroll)  {
      this.vertical.destroy();
      this.vertical = null;
    } else if (this.vertical) {
      this.vertical.update();
    }
  }
};

/**
 * Cleans up.
 *
 * @return {Antiscroll} for chaining
 * @api public
 */

Antiscroll.prototype.destroy = function () {
  if (this.horizontal) {
    this.horizontal.destroy();
    this.horizontal = null;
  }
  if (this.vertical) {
    this.vertical.destroy();
    this.vertical = null;
  }
  return this;
};

/**
 * Rebuild Antiscroll.
 *
 * @return {Antiscroll} for chaining
 * @api public
 */

Antiscroll.prototype.rebuild = function () {
  this.destroy();
  this.inner.removeAttribute('style');
  Antiscroll.call(this, this.el, this.options);
  return this;
};

/**
 * Scrollbar constructor.
 *
 * @param {Element|jQuery} element
 * @api public
 */

function Scrollbar (pane) {
  this.pane = pane;
  this.pane.el.appendChild(this.el);

  this.dragging = false;
  this.enter = false;
  this.shown = false;

  // hovering
  this.paneEvents = events(this.pane.el, this);
  this.paneEvents.bind('mouseenter', 'mouseenter');
  this.paneEvents.bind('mouseleave', 'mouseleave');

  // dragging
  this.events = events(this.el, this);
  this.events.bind('mousedown', 'mousedown');

  // scrolling
  this.innerEvents = events(this.pane.inner, this);
  this.innerEvents.bind('scroll', 'scroll');
  this.innerEvents.bind('mousewheel', 'mousewheel');

  // show
  var initialDisplay = this.pane.options.initialDisplay;

  if (initialDisplay !== false) {
    this.show();
    if (this.pane.autoHide) {
      this.hiding = setTimeout(bind(this, 'hide'), parseInt(initialDisplay, 10) || 3000);
    }
  }
}

/**
 * Cleans up.
 *
 * @return {Scrollbar} for chaining
 * @api public
 */

Scrollbar.prototype.destroy = function () {
  this.innerEvents.unbind();
  this.events.unbind();
  this.paneEvents.unbind();
  this.el.parentNode.removeChild(this.el);
  return this;
};

/**
 * Called upon mouseenter.
 *
 * @api private
 */

Scrollbar.prototype.mouseenter = function () {
  this.enter = true;
  this.show();
};

/**
 * Called upon mouseleave.
 *
 * @api private
 */

Scrollbar.prototype.mouseleave = function () {
  this.enter = false;

  if (!this.dragging) {
    if (this.pane.autoHide) {
      this.hide();
    }
  }
};

/**
 * Called upon wrap scroll.
 *
 * @api private
 */

Scrollbar.prototype.scroll = function () {
  if (!this.shown) {
    this.show();
    if (!this.enter && !this.dragging) {
      if (this.pane.autoHide) {
        this.hiding = setTimeout(bind(this, 'hide'), 1500);
      }
    }
  }

  this.update();
};

/**
 * Called upon scrollbar mousedown.
 *
 * @api private
 */

Scrollbar.prototype.mousedown = function (ev) {
  ev.preventDefault();

  this.dragging = true;

  var scroll = matrix2position(css(this.el, 'transform'));
  this.startPageX = ev.pageX - scroll[0];
  this.startPageY = ev.pageY - scroll[1];

  this.ownerEvents = events(this.el.ownerDocument, this);

  // prevent crazy selections on IE
  this.el.ownerDocument.onselectstart = function () { return false; };

  this.ownerEvents.bind('mousemove', 'mousemove');
  this.ownerEvents.bind('mouseup', 'cancelDragging');
};

/**
 * Called on mouseup to cancel dragging
 *
 * @api private
 */

Scrollbar.prototype.cancelDragging = function() {
  this.dragging = false;

  this.el.ownerDocument.onselectstart = null;

  this.ownerEvents.unbind();
  this.ownerEvents = null;

  if (!this.enter) {
    this.hide();
  }
};

/**
 * Show scrollbar.
 *
 * @api private
 */

Scrollbar.prototype.show = function () {
  if (!this.shown && this.update()) {
    classes(this.el).add('antiscroll-scrollbar-shown');
    if (this.hiding) {
      clearTimeout(this.hiding);
      this.hiding = null;
    }
    this.shown = true;
  }
};

/**
 * Hide scrollbar.
 *
 * @api private
 */

Scrollbar.prototype.hide = function () {
  if (this.pane.autoHide !== false && this.shown) {
    // check for dragging
    classes(this.el).remove('antiscroll-scrollbar-shown');
    this.shown = false;
  }
};

/**
 * Horizontal scrollbar constructor
 *
 * @api private
 */

Scrollbar.Horizontal = function (pane) {
  pane.el.insertAdjacentHTML('beforeend',
    '<div class="antiscroll-scrollbar antiscroll-scrollbar-horizontal"/>');
  this.el = q('.antiscroll-scrollbar-horizontal', pane.el);
  Scrollbar.call(this, pane);
};

/**
 * Inherits from Scrollbar.
 */

inherit(Scrollbar.Horizontal, Scrollbar);

/**
 * Updates size/position of scrollbar.
 *
 * @api private
 */

Scrollbar.Horizontal.prototype.update = function () {
  var paneWidth = this.pane.el.offsetWidth,
    trackWidth = paneWidth - this.pane.padding * 2,
    scrollWidth = this.pane.inner.scrollWidth;

  css(this.el, {
    width: Math.floor(trackWidth * paneWidth / scrollWidth),
    transform: 'translateX(' + Math.floor(trackWidth * this.pane.inner.scrollLeft / scrollWidth) + 'px)'
  });

  return paneWidth < scrollWidth;
};

/**
 * Called upon drag.
 *
 * @api private
 */

Scrollbar.Horizontal.prototype.mousemove = function (ev) {
  var trackWidth = this.pane.el.offsetWidth - this.pane.padding * 2,
    pos = ev.pageX - this.startPageX,
    barWidth = this.el.offsetWidth,
    innerEl = this.pane.inner;

  // minimum top is 0, maximum is the track height
  var y = Math.min(Math.max(pos, 0), trackWidth - barWidth);

  innerEl.scrollLeft = (innerEl.scrollWidth - this.pane.el.offsetWidth)
    * y / (trackWidth - barWidth);
};

/**
 * Called upon container mousewheel.
 *
 * @api private
 */

Scrollbar.Horizontal.prototype.mousewheel = function (ev, delta, x) {
  if ((x < 0 && 0 === this.pane.inner.scrollLeft) ||
      (x > 0 && (this.pane.inner.scrollLeft + Math.ceil(this.pane.el.offsetWidth)
        == this.pane.inner.scrollWidth))) {
    ev.preventDefault();
    return false;
  }
};

/**
 * Vertical scrollbar constructor
 *
 * @api private
 */

Scrollbar.Vertical = function (pane) {
  pane.el.insertAdjacentHTML('beforeend',
    '<div class="antiscroll-scrollbar antiscroll-scrollbar-vertical"/>');
  this.el = q('.antiscroll-scrollbar-vertical', pane.el);
  Scrollbar.call(this, pane);
};

/**
 * Inherits from Scrollbar.
 */

inherit(Scrollbar.Vertical, Scrollbar);

/**
 * Updates size/position of scrollbar.
 *
 * @api private
 */

Scrollbar.Vertical.prototype.update = function () {
  var paneHeight = this.pane.el.offsetHeight,
    trackHeight = paneHeight - this.pane.padding * 2,
    scrollHeight = this.pane.inner.scrollHeight;

  var scrollbarHeight = trackHeight * paneHeight / scrollHeight;
  scrollbarHeight = scrollbarHeight < 20 ? 20 : scrollbarHeight;

  var topPos = trackHeight * this.pane.inner.scrollTop / scrollHeight;

  if((topPos + scrollbarHeight) > trackHeight) {
    var diff = (topPos + scrollbarHeight) - trackHeight;
    topPos = topPos - diff - 3;
  }

  scrollbarHeight = Math.floor(scrollbarHeight);
  topPos = Math.floor(topPos);

  css(this.el, {
    height: scrollbarHeight,
    transform: 'translateY(' + topPos + 'px)'
  });

  return paneHeight < scrollHeight;
};

/**
 * Called upon drag.
 *
 * @api private
 */

Scrollbar.Vertical.prototype.mousemove = function (ev) {
  var paneHeight = this.pane.el.offsetHeight,
    trackHeight = paneHeight - this.pane.padding * 2,
    pos = ev.pageY - this.startPageY,
    barHeight = this.el.offsetHeight,
    innerEl = this.pane.inner;

  // minimum top is 0, maximum is the track height
  var y = Math.min(Math.max(pos, 0), trackHeight - barHeight);

  innerEl.scrollTop = (innerEl.scrollHeight - paneHeight)
    * y / (trackHeight - barHeight);
};

/**
 * Called upon container mousewheel.
 *
 * @api private
 */

Scrollbar.Vertical.prototype.mousewheel = function (ev, delta, x, y) {
  if ((y > 0 && 0 === this.pane.inner.scrollTop) ||
      (y < 0 && (this.pane.inner.scrollTop + Math.ceil(this.pane.el.offsetHeight)
        == this.pane.inner.scrollHeight))) {
    ev.preventDefault();
    return false;
  }
};

/**
 * Scrollbar size detection.
 */

var size;

function scrollbarSize () {
  if (size === undefined) {
    document.body.insertAdjacentHTML('beforeend', require('./template.html'));

    var div = q('#antiscroll-size-detection');
    size = div.offsetWidth - div.clientWidth;

    document.body.removeChild(div);

    if (size === 0) {
      // HACK: assume it's a floating scrollbars browser like FF on MacOS Lion
      size = 14;
    }
  }

  return size;
}


/**
 * Calculate scrollbar position from transform matrix
 *
 * Transform matrix looks like this: matrix(1, 0, 0, 1, X, Y) - we are only interested in 2 last numbers
 */

function matrix2position(str) {
  var match = str.match(/^\w+\((.+)\)/);
  if (!match) {
    return [0, 0];
  }
  return match[1].split(/,\s+/).map(Number).slice(-2);
}