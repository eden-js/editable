
  /**
  * @class JQueryUIGridStackDragDropPlugin
  * jQuery UI implementation of drag'n'drop gridstack plugin.
  */
 function JQueryUIGridStackDragDropPlugin(grid) {
  GridStackUI.GridStackDragDropPlugin.call(this, grid);
}

GridStackUI.GridStackDragDropPlugin.registerPlugin(JQueryUIGridStackDragDropPlugin);

JQueryUIGridStackDragDropPlugin.prototype = Object.create(GridStackUI.GridStackDragDropPlugin.prototype);
JQueryUIGridStackDragDropPlugin.prototype.constructor = JQueryUIGridStackDragDropPlugin;

JQueryUIGridStackDragDropPlugin.prototype.resizable = function(el, opts) {
  el = $(el);
  if (opts === 'disable' || opts === 'enable') {
    el.resizable(opts);
  } else if (opts === 'option') {
    var key = arguments[2];
    var value = arguments[3];
    el.resizable(opts, key, value);
  } else {
    var handles = el.data('gs-resize-handles') ? el.data('gs-resize-handles') :
      this.grid.opts.resizable.handles;
    el.resizable($.extend({}, this.grid.opts.resizable, {
      handles: handles
    }, {
      start: opts.start || function() {},
      stop: opts.stop || function() {},
      resize: opts.resize || function() {}
    }));
  }
  return this;
};

JQueryUIGridStackDragDropPlugin.prototype.draggable = function(el, opts) {
  el = $(el);
  if (opts === 'disable' || opts === 'enable') {
    el.draggable(opts);
  } else {
    el.draggable($.extend({}, this.grid.opts.draggable, {
      containment: (this.grid.opts.isNested && !this.grid.opts.dragOut) ?
        this.grid.container.parent() :
        (this.grid.opts.draggable.containment || null),
      start: opts.start || function() {},
      stop: opts.stop || function() {},
      drag: opts.drag || function() {}
    }));
  }
  return this;
};

JQueryUIGridStackDragDropPlugin.prototype.droppable = function(el, opts) {
  el = $(el);
  el.droppable(opts);
  return this;
};

JQueryUIGridStackDragDropPlugin.prototype.isDroppable = function(el, opts) {
  el = $(el);
  return Boolean(el.data('droppable'));
};

JQueryUIGridStackDragDropPlugin.prototype.on = function(el, eventName, callback) {
  $(el).on(eventName, callback);
  return this;
};

window.JQueryUIGridStackDragDropPlugin = JQueryUIGridStackDragDropPlugin;