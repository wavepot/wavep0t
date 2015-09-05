
/**
 * Expose `tree`.
 */

module.exports = tree;

/**
 * Creates a treeview of elements in `arr`
 * inside `parent`.
 *
 * The elements array follows the format:
 *
 *     [
 *       ['leaf'],
 *       ['leaf'],
 *       ['branch', true]
 *     ]
 *
 * When a branch node is clicked, it invokes
 * `fn(node, fn)` and it must callback
 * a new array of elements `fn(err, arr)`.
 *
 * @param {Object} parent
 * @param {Array} arr
 * @param {Function} fn
 * @return {Array} nodes
 * @api public
 */

function tree(parent, arr, fn){
  var nodes = new Array(arr.length);

  var el = document.createElement('ul');

  el.className = 'treeview';

  for (var i = 0; i < arr.length; i++) {
    var item = arr[i];
    var node = nodes[i] = new Node(item, parent, fn);
    el.appendChild(node.el);
  }

  if (!(parent instanceof Node)) el.classList.add('top');

  parent.el.appendChild(el);

  return nodes;
}

/**
 * Creates a node `item` that
 * belongs to `parent` with fetch
 * handler `fn`.
 *
 * @param {Array} item
 * @param {Node} parent
 * @param {Function} fn
 * @api private
 */

function Node(item, parent, fn){
  this.el = document.createElement('li');
  this.label = document.createElement('div');
  this.label.className = 'label';
  this.label.onclick = this.click.bind(this);
  this.item = item[0];
  this.parent = parent;
  this.top = parent.top || parent;
  this.fn = fn;
  this.children = null;
  this.isBranch = item[1];
  this.isOpen = false;

  if (this.isBranch) this.el.classList.add('branch');

  this.label.textContent = this.item;
  this.el.appendChild(this.label);
}

/**
 * Emits an event to the topmost object.
 *
 * @api private
 */

Node.prototype.emit = function(event, param){
  if (!this.top.emit) return;
  this.top.emit(event, param, this);
};

/**
 * Returns a slash delimited string path
 * representation of the node.
 *
 * @return {String} path
 * @api public
 */

Node.prototype.path = function(){
  var path = [];
  var node = this;
  do {
    path.unshift(node.item);
  } while (node = node.parent);
  return path.join('/');
};

Node.prototype.select = function(){
  //if (this === this.top.selected) return;

  if (this.top.selected) {
    this.top.selected.el.classList.remove('selected');
  }
  this.el.classList.add('selected');

  this.top.selected = this;

  this.emit('select', this);
};

/**
 * Toggles a branch node.
 *
 * @api private
 */

Node.prototype.toggle = function(){
  if (this.isOpen) this.close();
  else this.open();
};

/**
 * Opens a branch node.
 *
 * @api private
 */

Node.prototype.open = function(){
  this.el.classList.add('open');
  this.isOpen = true;
};

/**
 * Closes a branch node.
 *
 * @api private
 */

Node.prototype.close = function(){
  this.el.classList.remove('open');
  this.isOpen = false;
};

Node.prototype.click = function(fn){
  var self = this;

  fn = 'function' == typeof fn ? fn : noop;

  if (this.isBranch) {
    this.toggle();

    if (this.children || !this.isOpen) return;

    this.fn(this, function(err, children){
      if (err) {
        self.close();
        self.emit('error', err);
        return fn(err);
      }

      self.children = tree(self, children, self.fn);

      fn(null, self.children);
    });
  } else {
    this.select();
  }
};

function noop(){/* noop */}
