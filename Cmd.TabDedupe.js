@include inc_std.js
@include inc_dbg.js
@include inc_cfg.js
// Cmd.TabDedupe, ↑ must be at the very top, before comments; save as 'UTF-8 with BOM'

function OnInit(D) {
  D.name          	= "Cmd.TabDedupe";
  D.desc          	= "Add a command to close duplicate tabs protecting current tab" + "\n"
    +""           	+ "" + "(e.g., add to your open/close tab shortcut)" + "\n"
    +"↓Arg"       	+ "\t" + "↓Description" + "\n"
    +"right"      	+ "\t" + "close dupes from right to left (default)" + "\n"
    +"left"       	+ "\t" + "close dupes from left  to right" + "\n"
    +"noprotect"  	+ "\t" + "close current tab if it's a dupe" + "\n"
    +"dual"       	+ "\t" + "close dupes in left/up and right/down panes" + "\n"
    +""           	+ "(click ⚙ to set a list of protected paths)";
  D.version       	= '0.8@23-12';
  D.url           	= '';
  D.default_enable	= true;
  D.min_version   	= '12.0';

  var uid = "ee79c9bf29eb4bdfa34286cfe0851b68";
  var cfg = new ConfigHelper(D);
  cfg.add("ProtectPaths"	).val(DOpus.Create.Vector()	).g('Misc').des('Paths to ignore / NOT to close (list)\n(changing the list requires RESTARTing Opus or termporarily turning debug mode on)');
  cfg.add("DebugOutput" 	).val(false                	).g('  Debug').des('Enable debug output in the "Script log"');
}

function OnAddCommands(addCmdData) {
  var cmd     	= addCmdData.AddCommand();
  cmd.name    	= 'TabDedupe';
  cmd.method  	= 'OnTabDedupe';
  cmd.desc    	= 'Close duplicate tabs';
  cmd.label   	= 'TabDedupe';
  cmd.template	= 'right/s,left/s,noprotect/s,dual/s';
  cmd.icon    	= 'script';
  cmd.hide    	= false;
}

function vec2map(vec, cAsE) { // convert vector to a case(in/)sensitive map
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create
    , map = DC.Map();
  var i = vec.length;
  if (cAsE)	{while (i--) {map(vec[i]              ) = i;}
  } else   	{while (i--) {map(vec[i].toLowerCase()) = i;}}
  return map;
}

function closeDuplicateTabs(cmd, tabList, protectTab, protectPathMap, closeFromLeft) {
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create
    , mapPaths      	= DC.Map()
    , vecTabsToClose	= DC.Vector();

  var tabListReverse	= DOpus.Create.Vector();
  if (closeFromLeft) { // reverse tablist to iterate from right to left
    tabListReverse.append(tabList);
    tabListReverse.reverse();
    tabList = tabListReverse;
  };
  // dbg("protecting " + protectTab.path + " " + typeof(protectTab));
  var protectPath	= protectTab.path;
  var itab = 0;
  cmd.Clear();
  for (var e = new Enumerator(tabList); !e.atEnd(); e.moveNext()) {
    var tab    	= e.item();
    var tabPath	= String(tab.path).toLowerCase();
    if (mapPaths.exists(tabPath)) {
      if        (protectTab        === tab)	{dbg("Protecting tab "  + tabPath)
        // if (tab.visible) {cmd.RunCommand("Go TABSELECT=" + mapPaths(tabPath));}
      } else if (protectPathMap.exists(tabPath))	{dbg("Protecting path " + tabPath)
      } else                                    	{vecTabsToClose.push_back(tab);
        // if (tab.visible) {cmd.RunCommand("Go TABSELECT=" + mapPaths(tabPath));}
         };
    } else { mapPaths(tabPath) = itab;} // add tab's index to map
    itab = itab + 1;
  }
  if (vecTabsToClose.empty) {return;}
  cmd.Clear();
  for (var e = new Enumerator(vecTabsToClose); !e.atEnd(); e.moveNext()) {
    var tab = e.item();
    if (tab.visible) {
      var tabPath	= String(tab.path).toLowerCase();
      cmd.AddLine("Go TABSELECT=" + mapPaths(tabPath));
    }
    cmd.AddLine(  "Go TABCLOSE=" + tab);
  }
  cmd.Run();
  // var sh = new ActiveXObject("WScript");
  // sh.sleep(1000);
}

function OnTabDedupe(scriptCmdData) {
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create
    , func  	= scriptCmdData.func	// info about the default source/dest of the command, as well as details about how it was invoked
    , cmd   	= func.command      	// pre-filled Command object that can be used to run commands against the source and destination tabs. =DOpusFactory.Command and setting the source and destination tabs manually
    , tab   	= func.sourcetab    	//
    , args  	= func.args         	;
  var by_def	= 10

  if (sC.DebugOutput) {sV.Delete("isInit_TabDedupe");} // refresh vector→map conversion on each start, otherwise script vars persist and can't update if user changes the list
  // if        (!sV.Exists("isInit_TabDedupe"))	{dbg('no exist');
  // } else if ( sV.Exists("isInit_TabDedupe"))	{dbg('exist');
         // if (!sV.get(   "isInit_TabDedupe"))	{dbg('...not set');}}
  if (   !sV.Exists("isInit_TabDedupe")
      || (sV.Exists("isInit_TabDedupe")
      && (!sV.get(   "isInit_TabDedupe"))) ) { // doesn't exist or exists, but not init
    var protectPathMap = vec2map(sC.ProtectPaths, 0); // convert to a case insensitive map
    sV.set("isInit_TabDedupe",true);
    sV.set("_TabDedupe",protectPathMap);
    // dbg("Converted vector to map and saved to '_TabDedupe' script var");
    // for (var e = new Enumerator(sC.ProtectPaths); !e.atEnd(); e.moveNext()) {
      // var key=e.item();dbg(key)}
  }
  // dbg("is _TabDedupe? " + sV.exists("_TabDedupe"));

  var lister = DOpus.listers.lastactive;
  if (!lister) {return;};
  var tabs_left 		= lister.tabsleft;
  var tabs_right		= lister.tabsright;

  var protect_active  	= lister.activetab;
  var protect_inactive	= lister.desttab;
  if (protect_active.right) {
    var tabs_active  	= lister.tabsright;
    var tabs_inactive	= lister.tabsleft;
  } else {
    var tabs_active  	= lister.tabsleft;
    var tabs_inactive	= lister.tabsright;
  }
  var protectPathMap = sV.get("_TabDedupe");
  // for (var e = new Enumerator(protectPathMap); !e.atEnd(); e.moveNext()) {dbg(e.item())}
  if (args.noprotect) {protect_active = {}; protect_inactive = {}};

  var closeFromLeft = 0; //0=iterate from ←, so retain the ←←most and close the → ones
  if (args.left )	{closeFromLeft = 1};
  if (args.right)	{closeFromLeft = 0};
  // dbg("closeFromLeft " + closeFromLeft);
  if (args.dual) {
    closeDuplicateTabs(cmd, tabs_inactive, protect_inactive, protectPathMap, closeFromLeft);};
  closeDuplicateTabs(  cmd, tabs_active  , protect_active  , protectPathMap, closeFromLeft);
}
