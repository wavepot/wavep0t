
module.exports = function(){
  ace.require('ace/ext/language_tools');

  var el = document.createElement('div');
  el.id = 'editor';

  var editor = ace.edit(el);

  editor.setTheme('ace/theme/monokai');
  editor.setFadeFoldWidgets(true);
  editor.setShowPrintMargin(false);
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    fontFamily: 'Cousine',
    fontSize: '10pt'
  });

  editor.commands.addCommand({
    name: "removeline",
    bindKey: bindKey("Ctrl-D|Shift-Del", "Command-D"),
    exec: function(editor){ editor.removeLines(); },
    scrollIntoView: "cursor",
    multiSelectAction: "forEachLine"
  });

  editor.commands.addCommand({
    name: "copylinesup",
    bindKey: bindKey("Alt-Shift-Up", "Command-Option-Up"),
    exec: function(editor){ editor.copyLinesUp(); },
    scrollIntoView: "cursor"
  });

  editor.commands.addCommand({
    name: "movelinesup",
    bindKey: bindKey("Alt-Up|Ctrl-Shift-Up", "Option-Up"),
    exec: function(editor){ editor.moveLinesUp(); },
    scrollIntoView: "cursor"
  });

  editor.commands.addCommand({
    name: "copylinesdown",
    bindKey: bindKey("Alt-Shift-Down|Ctrl-Shift-D", "Command-Option-Down"),
    exec: function(editor){ editor.copyLinesDown(); },
    scrollIntoView: "cursor"
  });

  editor.commands.addCommand({
    name: "movelinesdown",
    bindKey: bindKey("Alt-Down|Ctrl-Shift-Down", "Option-Down"),
    exec: function(editor){ editor.moveLinesDown(); },
    scrollIntoView: "cursor"
  });

  return {
    el: el,
    editor: editor
  };
};

function bindKey(win, mac){
  return { win: win, mac: mac };
}
