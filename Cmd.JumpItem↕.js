@include inc_std.js
@include inc_dbg.js
@include inc_cfg.js
// Cmd.JumpItem↕, ↑ must be at the very top, before comments; save as 'UTF-8 with BOM'
// JumpItem↕ jumps to the a given number of items directly, JumpItemCursor↕ simulates the required number of ▼▲ keystrokes

function OnInit(D) {
  D.name          	= 'Cmd.JumpItem↕';
  D.desc          	= "Jump ↑/↓ by an arbitrary number of items with/out selection"
    +"\n"         	+ "JumpItem↕ jumps directly, JumpItemCursor↕ simulates ▼▲ keystrokes"
    +"\n"         	+ "⚠️Fails with v13 Expanded folders (items' indices we get don't account for visual order"
    +"\n"         	+ "⚠️JumpItem↕ isn't performant in folders with many items, use JumpItemCursor↕, but"
    +"\n"         	+ "⚠️key hold: JumpItemCursor↕ is fluid, but on key release continues to execute for a few iterations"
    +"\n"         	+ "⚠️key hold: JumpItem↕ skips some executions; stops faster vs↑, but also not immediately";
  D.version       	= '0.7@23-12';
  D.url           	= 'resource.dopus.com/t/jump-up-down-by-a-given-number-of-items/47520';
  D.default_enable	= true; D.min_version = '12.0'; D.copyright = "©es"; var uid = "e435cf1c64394e4ab3f7f838a37b7129";

  var cfg = new ConfigHelper(D);
  cfg.add("DebugOutput").val(false).g('Debug').des('Enable debug output in the "Script log"');
}

function OnAddCommands(addCmdD) {
  var cmd     	= addCmdD.AddCommand();
  cmd.name    	= 'JumpItem↕';
  cmd.method  	= 'OnJumpItem↕';
  cmd.desc    	= 'Jump to the next Nth / previous -Nth item in the source (n=10 by default)';
  cmd.label   	= 'JumpItem↕';
  cmd.template	= 'by/n,nodeselect/s,select/s';
  cmd.icon    	= 'script';
  cmd.hide    	= false;

  cmd         	= addCmdD.AddCommand();
  cmd.name    	= 'JumpItem↓';
  cmd.method  	= 'OnJumpItem↓';
  cmd.desc    	= 'Jump to the next Nth item in the source (n=10 by default)';
  cmd.label   	= 'JumpItem↓';
  cmd.template	= 'by/n,nodeselect/s,select/s';
  cmd.icon    	= 'script';
  cmd.hide    	= false;

  cmd         	= addCmdD.AddCommand();
  cmd.name    	= 'JumpItem↑';
  cmd.method  	= 'OnJumpItem↑';
  cmd.desc    	= 'Jump to the previous Nth item in the source (n=10 by default)';
  cmd.label   	= 'JumpItem↑';
  cmd.template	= 'by/n,nodeselect/s,select/s';
  cmd.icon    	= 'script';
  cmd.hide    	= false;

  cmd         	= addCmdD.AddCommand();
  cmd.name    	= 'JumpItemCursor↕';
  cmd.method  	= 'OnJumpItemCursor↕';
  cmd.desc    	= 'Send N ▲ / -N ▼ keystrokes to jump to next Nth / previous -Nth in the source (n=10 by default)';
  cmd.label   	= 'JumpItemCursor↕';
  cmd.template	= 'by/n,nodeselect/s,select/s';
  cmd.icon    	= 'script';
  cmd.hide    	= false;

  cmd         	= addCmdD.AddCommand();
  cmd.name    	= 'JumpItemCursor↓';
  cmd.method  	= 'OnJumpItemCursor↓';
  cmd.desc    	= 'Send N ▲ keystrokes to jump to the previous Nth in the source (n=10 by default)';
  cmd.label   	= 'JumpItemCursor↓';
  cmd.template	= 'by/n,nodeselect/s,select/s';
  cmd.icon    	= 'script';
  cmd.hide    	= false;

  cmd         	= addCmdD.AddCommand();
  cmd.name    	= 'JumpItemCursor↑';
  cmd.method  	= 'OnJumpItemCursor↑';
  cmd.desc    	= 'Send N ▲ keystrokes to jump to the next Nth in the source (n=10 by default)';
  cmd.label   	= 'JumpItemCursor↑';
  cmd.template	= 'by/n,nodeselect/s,select/s';
  cmd.icon    	= 'script';
  cmd.hide    	= false;
}

function OnJumpItemCursor↓(scriptCmdD) {
  OnJumpItemCursor↕(scriptCmdD)
}
function OnJumpItemCursor↑(scriptCmdD) {
  var func	= scriptCmdD.func	; // info about the default source/dest of the command, as well as details about how it was invoked
  var cmd 	= func.command      	;	// pre-filled Command object that can be used to run commands against the source and destination tabs. =DOpusFactory.Command and setting the source and destination tabs manually
  var args	= func.args         	;
  var by  	= -1 * args.by      	;
  cmd.RunCommand("JumpItemCursor↕ By=" + by); /// bug: for some reason toggles selection of the first item even though it's supposed to be a simple ▲ send, so use 'JumpItemCursor↕ By=-N' directly
}
function OnJumpItemCursor↕(scriptCmdD) {
  var func      	= scriptCmdD.func	; // info about the default source/dest of the command, as well as details about how it was invoked
  var cmd       	= func.command      	;	// pre-filled Command object that can be used to run commands against the source and destination tabs. =DOpusFactory.Command and setting the source and destination tabs manually
  var tab       	= func.sourcetab    	;
  var args      	= func.args         	;
  var by_def    	= 10;
  var nodeselect	= args.nodeselect ? '=NODESELECT' : '';

  var by = args.by;
  if (typeof by != 'number'
   ||        by == 0) by = by_def; // argument is missing, not a number, or zero? use default!

  var sh = new ActiveXObject("WScript.Shell");
  var key_down = "{DOWN}"; var key_up = "{UP}";
  if (args.select == true) {key_down = "+{DOWN}"; key_up = "+{UP}";}
  if (by > 0)	{for (var i = 0; i < by; i++) {sh.SendKeys(key_down);}
  } else     	{for (var i = 0; i > by; i--) {sh.SendKeys(key_up  );} }

  // if (args.select == true) {key_down = "+{DOWN}"; key_up = "+{UP}";}
  // if (by > 0)	{for (var i = 0; i < by; i++) {cmd.RunCommand("SELECT NEXT" + nodeselect);}
  // } else     	{for (var i = 0; i > by; i--) {cmd.RunCommand("SELECT PREV" + nodeselect);} }
}

function OnJumpItem↓(scriptCmdD) {
  OnJumpItem↕(scriptCmdD)
}
function OnJumpItem↑(scriptCmdD) {
  var func	= scriptCmdD.func	; // info about the default source/dest of the command, as well as details about how it was invoked
  var cmd 	= func.command   	;	// pre-filled Command object that can be used to run commands against the source and destination tabs. =DOpusFactory.Command and setting the source and destination tabs manually
  var args	= func.args      	;
  var by  	= -1 * args.by   	;
  cmd.RunCommand("JumpItem↕ By=" + by);
}
function OnJumpItem↕(scriptCmdD) {
  var func  	= scriptCmdD.func	; // info about the default source/dest of the command, as well as details about how it was invoked
  var cmd   	= func.command   	;	// pre-filled Command object that can be used to run commands against the source and destination tabs. =DOpusFactory.Command and setting the source and destination tabs manually
  var tab   	= func.sourcetab 	;
  var args  	= func.args      	;
  var by_def	= 10;

  var items       	= tab.all;
  var haystack    	= items;
  var items_cn    	= items.count;
  var items_sel_cn	= tab.selected.count;
  var i_sel_last  	= items_sel_cn - 1;
  if (items_cn == 0) return;

  var by = args.by;
  if (typeof by != 'number'
   ||        by == 0) by = by_def; // argument is missing, not a number, or zero? use default!

  var needle = tab.GetFocusItem(); // file or folder which has focus in the tab
  var i = 0;
  if (needle == null) { // no focus or 'This PC' is focused, which can't be represented by an item
    if (items_sel_cn > 0) { // ... try to use selected items
      needle = tab.selected(i_sel_last); // last item selected
    } else { // can't get focused item, no selection, just use arrow keys
      var sh = new ActiveXObject("WScript.Shell");
      var key_down = "{DOWN}"; var key_up = "{UP}";
      if (args.nodeselect == false) {cmd.RunCommand('Select NONE');}
      if (args.select == true) {key_down = "+{DOWN}"; key_up = "+{UP}";}
      if (by > 0)	{for (var i = 0; i < by; i++) {sh.SendKeys(key_down);}
      } else     	{for (var i = 0; i > by; i--) {sh.SendKeys(key_up  );} }
      return; // https://learn.microsoft.com/en-us/dotnet/api/system.windows.forms.sendkeys.send
    }
  }

  var i_needle	= -1;
  var i_target	= -1;
  var i_last  	= items_cn - 1;
  // Find our focused/selected item in the list and then continue BY steps to find the one to refocus (or get to the first/last in the list)
  i = 0;
  dbg("——————————— Looking for: " + needle.name);
  while (i <= i_last) {
    dbg('  i=' + i + ', i_needle=' + i_needle + ', i_last=' + i_last);
    if (items(i).id == needle.id) { // found our needle, save its position and the target
      i_needle = i;
      i_target = Math.max(0, Math.min(i + by, i_last));
      dbg('  Found focused/selected item @ ' + i_needle + ', will target @ ' + i_target);
      break;
    };
    i++;
  }
  if (i_target == i_needle) {dbg("select" + i_needle + '=' + i_target); return;} // avoid flashes if we're not selecting anything new
  if (args.nodeselect == false) {cmd.RunCommand('Select NONE');}
  cmd.ClearFiles(); // clear the collection of items this command is to act upon
  if (i_target >= 0) {
    if (args.select == true) { // extend selection from from current to target
             if (i_target    < i_needle) { dbg("select" + i_needle + '>' + i_target); // ↑
        //b/ cmd.RunCommand('Select RANGE ' + (i_target+1) +'-'+ (i_needle+1)); // no DESELECT argument, so fails with extending selection, otherwise seems like a better option without manual iterations
        for (i = i_needle; i >= i_target; i--) {cmd.AddFile(items(i       ));}
      } else if (i_target    > i_needle) { dbg("select" + i_needle + '<' + i_target); // ↓
        //b/ cmd.RunCommand('Select RANGE ' + (i_needle+1) +'-'+ (i_target+1));
        for (i = i_needle; i <  i_target; i++) {cmd.AddFile(items(i       ));}
        cmd.RunCommand('Select FROMSCRIPT SETFOCUS'); // select all but the last item
        cmd.ClearFiles(); // clear the collection of items this command is to act upon
        cmd.AddFile(items(i_target)); // for some reason without manually adding the last item at the bottom, the focus stays on the first item (going ↑ the focus shifts ↑)
      }
    } else {                                    cmd.AddFile(items(i_target)); }
    //b/ cmd.AddFile(items(i_target)); // set focus
    cmd.RunCommand('Select FROMSCRIPT SETFOCUS');
    cmd.RunCommand('Select SHOWFOCUS');
  } else {
    DOpus.Output("Something's wrong, couldn't find focused/selected item", true);
  }
}
