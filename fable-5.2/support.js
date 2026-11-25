/*
 * Мінімальний рантайм для макетів KSU24.
 * Сторінки *.dc.html описані шаблоном усередині <x-dc> і класом Component
 * у <script type="text/x-dc">. Цей файл збирає з них звичайний DOM:
 * підставляє значення {{...}}, розгортає <sc-if> / <sc-for>, навішує події
 * та перемальовує сторінку після setState.
 */
(function () {
  'use strict';

  var hide = document.createElement('style');
  hide.textContent = 'x-dc{display:none!important}';
  document.head.appendChild(hide);

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.renderVals = function () { return {}; };
  DCLogic.prototype.setState = function (patch, done) {
    if (typeof patch === 'function') patch = patch(this.state, this.props);
    this.state = Object.assign({}, this.state, patch);
    if (this.__render) this.__render();
    if (typeof done === 'function') done();
  };
  DCLogic.prototype.forceUpdate = function () {
    if (this.__render) this.__render();
  };
  window.DCLogic = DCLogic;

  var HOLE = /\{\{\s*([^{}]+?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/;
  var TABLE_PREFIX = 'dc-t-';

  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (path === 'undefined') return undefined;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var quoted = /^(['"])(.*)\1$/.exec(path);
    if (quoted) return quoted[2];
    var value = scope;
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++) {
      if (value === null || value === undefined) return undefined;
      value = value[parts[i].trim()];
    }
    return value;
  }

  function fill(text, scope) {
    return text.replace(HOLE, function (_, path) {
      var value = lookup(path, scope);
      return value === null || value === undefined ? '' : String(value);
    });
  }

  function applyStyle(el, value) {
    if (typeof value === 'string') {
      el.setAttribute('style', value);
    } else if (value && typeof value === 'object') {
      Object.keys(value).forEach(function (key) {
        var v = value[key];
        el.style[key] = typeof v === 'number' && v !== 0 ? v + 'px' : v;
      });
    }
  }

  function setAttr(el, name, raw, scope) {
    if (name.indexOf('hint-') === 0) return;
    if (name === 'classname') name = 'class';
    if (name === 'htmlfor') name = 'for';
    var whole = WHOLE.exec(raw);
    if (!whole) {
      el.setAttribute(name, fill(raw, scope));
      return;
    }
    var value = lookup(whole[1], scope);
    if (/^on[a-z]+$/.test(name)) {
      if (typeof value === 'function') {
        var type = name.slice(2);
        var tag = el.localName;
        if (type === 'change' && (tag === 'input' || tag === 'textarea')) type = 'input';
        el.addEventListener(type, value);
      }
      return;
    }
    if (name === 'style') { applyStyle(el, value); return; }
    var isAria = name.indexOf('aria-') === 0;
    if (value === null || value === undefined) return;
    if (value === false) { if (isAria) el.setAttribute(name, 'false'); return; }
    if (value === true) { el.setAttribute(name, isAria ? 'true' : ''); return; }
    if (typeof value === 'function' || typeof value === 'object') return;
    el.setAttribute(name, String(value));
    if (name === 'value') el.value = String(value);
  }

  function build(node, scope, parent) {
    if (node.nodeType === 3) {
      parent.appendChild(document.createTextNode(fill(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var name = node.localName;
    var i;
    if (name === 'sc-if') {
      var cond = WHOLE.exec(node.getAttribute('value') || '');
      if (cond && lookup(cond[1], scope)) buildChildren(node, scope, parent);
      return;
    }
    if (name === 'sc-for') {
      var src = WHOLE.exec(node.getAttribute('list') || '');
      var list = src ? lookup(src[1], scope) : null;
      var as = node.getAttribute('as') || 'item';
      if (list && typeof list.length === 'number') {
        for (i = 0; i < list.length; i++) {
          var inner = Object.create(scope);
          inner[as] = list[i];
          inner.$index = i;
          buildChildren(node, inner, parent);
        }
      }
      return;
    }
    if (name === 'helmet' || name === 'dc-import' || name === 'x-import') return;
    if (name.indexOf(TABLE_PREFIX) === 0) name = name.slice(TABLE_PREFIX.length);
    var el = document.createElementNS(node.namespaceURI, name);
    var attrs = node.attributes;
    for (i = 0; i < attrs.length; i++) setAttr(el, attrs[i].name, attrs[i].value, scope);
    buildChildren(node, scope, el);
    parent.appendChild(el);
  }

  function buildChildren(node, scope, parent) {
    for (var child = node.firstChild; child; child = child.nextSibling) build(child, scope, parent);
  }

  function start() {
    var template = document.querySelector('x-dc');
    if (!template) return;

    var helmet = template.querySelector('helmet');
    if (helmet) {
      while (helmet.firstChild) document.head.appendChild(helmet.firstChild);
      helmet.remove();
    }

    var props = {};
    var Component = DCLogic;
    var script = document.querySelector('script[data-dc-script]');
    if (script) {
      try {
        var declared = JSON.parse(script.getAttribute('data-props') || '{}');
        Object.keys(declared).forEach(function (key) {
          if (key.charAt(0) !== '$' && declared[key] && 'default' in declared[key]) props[key] = declared[key].default;
        });
      } catch (e) { /* без оголошених властивостей */ }
      Component = new Function('DCLogic', script.textContent + '\n;return Component;')(DCLogic);
    }

    var root = document.createElement('div');
    root.setAttribute('data-dc-root', '');
    root.style.display = 'contents';
    template.parentNode.insertBefore(root, template);

    var instance = new Component(props);
    if (!instance.state) instance.state = {};

    instance.__render = function () {
      var active = document.activeElement && root.contains(document.activeElement) ? document.activeElement.id : '';
      var kept = {};
      Array.prototype.forEach.call(root.querySelectorAll('input[id],textarea[id],select[id]'), function (field) {
        kept[field.id] = field.value;
      });
      var scrollTop = {};
      Array.prototype.forEach.call(root.querySelectorAll('[id]'), function (el) {
        if (el.scrollTop || el.scrollLeft) scrollTop[el.id] = [el.scrollTop, el.scrollLeft];
      });
      var fragment = document.createDocumentFragment();
      buildChildren(template, Object.assign(Object.create(null), instance.renderVals() || {}), fragment);
      root.textContent = '';
      root.appendChild(fragment);
      Object.keys(kept).forEach(function (id) {
        var field = document.getElementById(id);
        if (field) field.value = kept[id];
      });
      Object.keys(scrollTop).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.scrollTop = scrollTop[id][0]; el.scrollLeft = scrollTop[id][1]; }
      });
      if (active) {
        var again = document.getElementById(active);
        if (again) again.focus();
      }
    };

    instance.__render();
    if (typeof instance.componentDidMount === 'function') instance.componentDidMount();

    if (location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
