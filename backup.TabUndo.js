@include inc_std.js
@include inc_gui.js
@include inc_dbg.js
@include inc_cfg.js
// backup.TabUndo, ↑ must be at the very top, before comments; save as 'UTF-8 with BOM'
function OnInit(D) {
  D.name          	= "backup.TabUndo";
  D.desc          	= "Automatically save Lister closed tabs on a per-lister-layout basis" + "\n"
    +""           	+ "(click ⚙ to configure)";
  D.version       	= '0.4@24-07';
  D.url           	= '';
  D.default_enable	= true; D.min_version = '13.0'; D.copyright = "©es"; var uid = "7fb5996cdd6040b0abcb7e4c73b80261";

  var sV=D.vars, sC=D.config, DC=DOpus.Create, Sys=DC.SysInfo, C=new ConfigHelper(D);
  C.add('DebugOutput'       	).val(false               	).g('  Debug').des('Enable debug output in the "Script log"');
  C.add('DebugClear'        	).val(false               	).g('  Debug').des("Clear log messages from the Opus Output Window between script runs");
  C.add('DebugVerbose'      	).val(false               	).g('  Debug').des('More verbose debug (e.g., event callbacks) in the "Script log"');
  C.add('Max↔ Σ🖥️'          	).val(80                  	).g('Size').des("Total max width: 0–100 of monitor's width");
  C.add('Max↔ 1🕐'           	).val(120                 	).g('Size').des('Column max width: date/time');
  C.add('Max↔ 2🔖'           	).val(200                 	).g('Size').des('Column max width: tab label');
  C.add('MaxHistory'        	).val(1000                	).g('Misc').des('Store as many as this number of closed tabs per lister\n(on reaching limit earliest ~10% will be cut to not resize storage on every tab close)');
  C.add('MaxHistoryDD'      	).val(true                	).g('Misc').des('Also dedupe all but the latest 10% when reaching MaxHistory limit');
  C.add('Title 1🕐'          	).val("🕐"                 	).g('Title').des('Column title: date');
  C.add('Title 2🔖'          	).val("🔖"                 	).g('Title').des('Column title: tab label');
  C.add('Title 3 ‹Tab ║'    	).val("‹tab paths"        	).g('Title').des('Column title: tab paths for the Left pane of a Vertical dual-pane lister');
  C.add('Title 3 Tab› ║'    	).val("tab› paths"        	).g('Title').des('Column title: tab paths for the Right pane of a Vertical dual-pane lister');
  C.add('Title 3 ↑Tab ═'    	).val("↑tab paths"        	).g('Title').des('Column title: tab paths for the Upper pane of a Horizontal dual-pane lister');
  C.add('Title 3 ↓Tab ═'    	).val("↓tab paths"        	).g('Title').des('Column title: tab paths for the Lower pane of a Horizontal dual-pane lister');
  C.add('Title 3 Tab Single'	).val(DC.Vector(0,"═","║")	).g('Title').des('Column title: tab paths for the single-pane lister: ═Horizontal or ┃┃Vertical'); //━║┃┃
  C.add('Title 3 TabX'      	).val(" ≝"                	).g('Title').des('Column title: append to tab paths for the pane matching curently active one');
  C.add('Hide Dual'         	).val(true                	).g('Vis').des('In single-pane lister hide the list of closed tabs from the hidden pane');
  C.add('Hide Inactive'     	).val(true                	).g('Vis').des('In dual-pane lister hide the list of closed tabs from the inactive pane');
  C.add('🖰⋅2↩'              	).val(true                	).g('vMisc').des('Double-click in the list of tabs confirms selection');
  C.add('▼▲⋅X'              	).val(5                   	).g('vMisc').des('Jump up/down without deselection by this many rows with m , navigation keys');
  C.add('fg'                	).val(true                	).g('vMisc').des('Switch to the reopened tab (last tab if multiple)');
  // C.add('Clean'          	).val(true                	).g('vMisc').des("Remove reopened tabs from history");
  C.add('OkClearHistory'    	).val(10                  	).g('vMisc').des("Do not ask for confirmation to clear history that has below this number of items");
  C.add('PosRestore'        	).val(true                	).g('vMisc').des("Try to restore tab's position (searches for the same tab/path to the left/right to match those at the time of closing)");
  C.add('PosEnd'            	).val(false               	).g('vMisc').des("(if position isn't restored) Reopen the tab at the end of the tab bar (false: reopen next to the currently active tab)");
  C.add('▋glueTΔ'           	).val(12                  	).g('vMisc').des("Treat selection evens coming in within this time threshold (in ms) of each other as one selection for undo purposes\n(e.g., single ▼ is 1 deselection + 1 selection event, this tries to catch these as 1 undo)");
  C.add('Friendly::{FF}'    	).val(DC.Vector(1,"Path","🔖","No")).g('vMisc').des("For system folders with paths like '::{645FF...}' use friendly name 'Recycle Bin' in:\nPath\t replace path\n🔖\t add as a label\nNo\tno friendly names");

  C.add(" ⚠️").val("⇧ ⎈⌃ ⎇⌥ ◆❖⌘").g(' Keybind').des('Help: Can use ⎈ instead of Ctrl-. Only partially validated for correctness');
  C.add('✓'      	).val(DC.Vector('r','i','Alt+O'	)).g(' Keybind').des('Reopen selected tabs');
  C.add('⎋'      	).val(DC.Vector('q','c'        	)).g(' Keybind').des('Cancel');
  C.add('⎌▋'     	).val(DC.Vector('u'            	)).g(' Keybind').des('undo selection');
  C.add('↷▋'     	).val(DC.Vector('y','g'        	)).g(' Keybind').des('redo selection');
  C.add('‹Open'  	).val(DC.Vector('o'            	)).g(' Keybind').des('force open left');
  C.add('Open›'  	).val(DC.Vector('p'            	)).g(' Keybind').des('force open right');
  C.add('Nav◀⭾'  	).val(DC.Vector('1','d'        	)).g(' Keybind').des('switch to top    panel');
  C.add('Nav▶⭾'  	).val(DC.Vector('2','f'        	)).g(' Keybind').des('switch to bottom panel');
  C.add('Nav▼'   	).val(DC.Vector('j'            	)).g(' Keybind').des('move cursor ▼ without (de)selection');
  C.add('Nav▲'   	).val(DC.Vector('k'            	)).g(' Keybind').des('move cursor ▲ without (de)selection');
  C.add('Nav▼▋'  	).val(DC.Vector('⇧j'           	)).g(' Keybind').des('move cursor ▼ with extending ▋selection');
  C.add('Nav▲▋'  	).val(DC.Vector('⇧k'           	)).g(' Keybind').des('move cursor ▲ with extending ▋selection');
  C.add('Nav▼5'  	).val(DC.Vector('m'            	)).g(' Keybind').des('move cursor ▼ 5 times without (de)selection');
  C.add('Nav▲5'  	).val(DC.Vector(','            	)).g(' Keybind').des('move cursor ▲ 5 times without (de)selection');
  C.add('Nav▼5▋' 	).val(DC.Vector('⇧m'           	)).g(' Keybind').des('move cursor ▼ 5 times with extending ▋selection');
  C.add('Nav▲5▋' 	).val(DC.Vector('⇧,'           	)).g(' Keybind').des('move cursor ▲ 5 times with extending ▋selection');
  C.add('▋'      	).val(DC.Vector('l'            	)).g(' Keybind').des('select');
  C.add('▋∀'     	).val(DC.Vector('⇧l'           	)).g(' Keybind').des('select all');
  C.add('▋✗'     	).val(DC.Vector(';'            	)).g(' Keybind').des('(de)select toggle'); //TODO: ⎈␠ toggles, but how to deselect
  C.add('▋✗∀'    	).val(DC.Vector('⇧;'           	)).g(' Keybind').des('deselect all');
  C.add('▋🔄'     	).val(DC.Vector('h'            	)).g(' Keybind').des('⎈␠ toggle selection');
  C.add('‹Toggle'	).val(DC.Vector('⇧1','⇧d'      	)).g(' Keybind').des('switch to top    panel');
  C.add('Toggle›'	).val(DC.Vector('⇧2','⇧f'      	)).g(' Keybind').des('switch to bottom panel');
  var reset_sv = ['is_valid_hk','reMod','reKey','hk_sub_symbol','reShift','reCtrl','reAlt','reWin','getHotkey','getHotkey_hk']
  var i = reset_sv.length;while (i--) {sV.Delete(reset_sv[i]);}
}

function findTabI(tab,isRight) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create, L=DOpus.listers.lastactive;
  var tabs = isRight ? L.tabsright : L.tabsleft; //dbgv(T(tabs)); //object.col:Tab
  var tab_path	= tab.path+""; // convert to string
  var tab_id  	= tab+0; // convert to number
  var found_type = [DC.Vector(),DC.Vector()]; // found by ID, by Path
  dbgv("Trying to find tab id="+tab_id+" "+T(tab_path)+"="+tab_path);
  for (var i=0;i<tabs.count;i++) {
    dbgv("iterating i="+i+" path="+tabs[i].path+'=?'+((tabs[i].path+"") === tab_path));
    if ((tabs[i]     +0 ) === tab_id  )	{found_type[0].push_back(i); dbgv('Found by id pos='+i);}
    if ((tabs[i].path+"") === tab_path)	{found_type[1].push_back(i); dbgv('Found by path pos='+i);}
  }
  return found_type
}
function getTabNeighbors(tab) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create,
    L = tab.lister;
  var tabs = tab.right ? L.tabsright : L.tabsleft; //dbgv(T(tabs)); //object.col:Tab
  var tab_path = tab.path;
  var tab_left, tab_right;
  for (var i=0;i<tabs.count;i++) { // no length for a generic collection
    // dbgv('i='+i +' tab_id='+tabs[i]+' =?'+tab+' ('+(tabs[i] == tab)+')'+T(tab));
    if ((tabs[i]+0) === (tab+0)) { //works
      isLast = (i===tabs.count - 1);
      if (i>0)     	{tab_left =tabs[i-1]; dbgv("found tab_left ="+ tabs[i-1].path);}
      if (! isLast)	{tab_right=tabs[i+1]; dbgv("found tab_right="+ tabs[i+1].path);}
    }
  }
  // dbgv('getTabNeighbors: ‹'+tab_left + ' ›'+tab_right);
  return [tab_left,tab_right]
}

var k = {lbl:1,path:2,time:3}; //DO NOT change since it will not match with persistently stored data
function OnCloseTab(closeTabD) { // replace todo ↓
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create
   ,tab = closeTabD.tab;
  var L = tab.lister;
  dbgv("closed tab " + tab + ' path='+tab.path+ ' crumbpath'+tab.crumbpath+" displayed_label="+tab.displayed_label);
  var tab_i = DC.Map();
  if        (sC['Friendly::{FF}'] === 0) {; //Path
    if ((tab.path+"").substr(0,3)==='::{') { // replace ::{abcd} with Recycle Bin
      tab_i(k.path)	= tab.displayed_label;
      tab_i(k.lbl) 	= tab.label;
    } else {
      tab_i(k.path)	= tab.path;
      tab_i(k.lbl) 	= tab.label;
    }
  } else if (sC['Friendly::{FF}'] === 1) {; //Label
    if ((tab.path+"").substr(0,3)==='::{') { // replace ::{abcd} with Recycle Bin
      tab_i(k.path)	= tab.path;
      tab_i(k.lbl) 	= tab.displayed_label;
    } else {
      tab_i(k.path)	= tab.path;
      tab_i(k.lbl) 	= tab.label;
    }
  } else { // don't use friendly names
    tab_i(k.path)	= tab.path;
    tab_i(k.lbl) 	= tab.label;
  };
  tab_i(k.time)	= getDate();
  var tab_lr = getTabNeighbors(tab);
  if (tab_lr[0]) {tab_i(tabNmL) = tab_lr[0];dbgv("+ "+tabNmL+"("+tab_lr[0].path+") to tab="+tab+" path="+tab.path)}
  if (tab_lr[1]) {tab_i(tabNmR) = tab_lr[1];dbgv("+ "+tabNmR+"("+tab_lr[1].path+") to tab="+tab+" path="+tab.path)}
  var varNm = (tab.right?tabNmR:tabNmL);
  if (     L.vars.exists(varNm)) { // save tabs per Lister
    ltab = L.vars.get   (varNm);
    ltab.push_back(tab_i);
    if (ltab.length > sC['MaxHistory']) {
      trim_vec_start_to_max(ltab,Math.round(0.9*sC['MaxHistory'],0));
      if (sC['MaxHistoryDD']) { // dedupe all but the last 10%
        var vec_dedupe = DOpus.Create.Vector()
        i90 = Math.round(0.9*ltab.length,0)
        vec_dedupe.assign(ltab,0,i90);
        vec_dedupe.unique();
        vec_dedupe.append(ltab(Math.min(1+i90,i90),ltab.length)); // fix Subscript out of range
        ltab = vec_dedupe;}
       dbgv('Trimmed tab history')}
    L.vars.set(varNm,ltab);
    dbgv(varNm + " appended a new tab info map");
  } else {
    ltab = DC.Vector(); ltab.reserve(sC['MaxHistory']);
    ltab.push_back(tab_i);
    L.vars.set(varNm,ltab); L.vars(varNm).persist = true; // enable persistence across restarts
    dbgv(varNm + " added a new vector with the tab info map");
  }
}
// function OnOpenTab(closeTabD) { // todo remove helper info
//   var sV = Script.vars, sC = Script.config, DC = DOpus.Create
//    ,tab = closeTabD.tab;
//   L = tab.lister;
//   var varNm = '‹tab✗';
//   if (L.vars.exists(varNm)) { // get tabs per Lister
//     var pvec = L.vars.get(varNm);
//     dbgv(pvec.length + ' ' + pvec.back()(k.path));
//     dbgv(pvec.length + ' ' + pvec(pvec.length-1)(k.path));
//   }
//   var ttt = DOpus.Create.Vector();
//   dbgv(DOpus.TypeOf(ttt));
// }

function OnAddCommands(addCmdD) {
  var cmd     	= addCmdD.AddCommand();
  cmd.name    	= 'Undo✗TabVis';
  cmd.method  	= 'OnUndoTabCloseUI';
  cmd.desc    	= 'Reopen recently ✗closed tabs by selecting them in a table';
  cmd.label   	= 'Undo ✗ Tab Visually';
  cmd.template	= 'fg/so,bg/so';
  cmd.icon    	= 'undoclosetab';
  cmd.hide    	= false;

  var cmd     	= addCmdD.AddCommand();
  cmd.name    	= 'Undo✗TabClearHistory';
  cmd.method  	= 'OnClearHistory';
  cmd.desc    	= "Clear history of closed tabs for the currently active lister's pane";
  cmd.label   	= 'Undo ✗ Tab: Clear History';
  cmd.template	= 'noconfirm/s';
  cmd.icon    	= 'delete2';
  cmd.hide    	= false;

  var cmd     	= addCmdD.AddCommand();
  cmd.name    	= 'Undo✗Tab';
  cmd.method  	= 'OnUndoTab';
  cmd.desc    	= 'Undo the latest closed tab (fg=switch to it, bg=open in the background)';
  cmd.label   	= 'Undo ✗ Tab';
  cmd.template	= 'fg/so,bg/so';
  cmd.icon    	= 'undoclosetab';
  cmd.hide    	= false;
}
var tabNmL = '‹tab✗';
var tabNmR = 'tab✗›';
var arg_inL = ' OpenInLeft';
var arg_inR = ' OpenInRight';

function reopenTab(tab_map,fg,pos,side) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create, L=DOpus.listers.lastactive;
  var Cmd=DC.Command();
  var var_names = [tabNmL,tabNmR];

  var activeR = L.activetab.right; // tab on the right or bottom side of a dual-display Lister
  var activeL = ! activeR;

  var arg_path = 'Go Path="'+tab_map(k.path)+'"';
  var arg_pos = ' TabPos='; var arg_pos_def = sC['PosEnd']?' TabPos=last':' TabPos=+1';
  var arg_newTab = ' NewTab' + (fg?'':'=nofocus');
  var arg_side = side?side:(activeL?arg_inL:arg_inR); // OpenInLeft/R
  var arg_name = tab_map(k.lbl)?(' TabName="'+tab_map(k.lbl).replace(/"/gm,'""')+'"'):'';
  if (pos) {
    var target_i;
    for (var i=0;i<var_names.length;i++) {
      var tabNmSide = var_names[i];
      if (tab_map.exists  (tabNmSide)) {
        var tabS = tab_map(tabNmSide);
        var tabS_idx = findTabI(tabS,activeR);
        var tabS_i;
        if        (tabS_idx[0].length>0) {tabS_i = tabS_idx[0](0);
        } else if (tabS_idx[1].length>0) {tabS_i = tabS_idx[1](0);}
        if (! (typeof tabS_i === 'undefined')) {var target_i = (i===0)?(tabS_i+1):tabS_i; arg_pos += target_i; dbgv(tabNmSide+" FOUND pos="+arg_pos); break; // open to the right of Left neighbor, ad at Right neighbor's spot (if both, open first found and ignore the other)
        } else {dbgv("couldn't find a "+tabNmSide+" neighbor matching position");}
      } else {dbgv("tab_map has no "+tabNmSide+" key (created on tab close)");}
    }
    if (typeof target_i == 'undefined') {arg_pos=arg_pos_def;dbgv("No neighbor matching position or no neighbors were saved");}
  } else {arg_pos=arg_pos_def;dbgv("restore pos disabled");}
  var cmdTxt = arg_path+arg_pos+arg_newTab + arg_side + arg_name;
  dbgv("Restoring tab 🔖‘"+ tab_map(k.lbl) + "’ ✗🕐‘" + tab_map(k.time) +"’ path=‘"+ tab_map(k.path) +"’ via cmd=‘"+cmdTxt+"’");
  cmdRes = Cmd.RunCommand(cmdTxt);
}

function OnUndoTab(cmdD) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create, Sys=DC.SysInfo
   ,F=cmdD.func, Cmd=F.command, tab=F.sourcetab, L=tab.lister;
  var activeR = L.activetab.right; // tab on the right or bottom side of a dual-display Lister
  var activeL = !activeR;
  var i_side = activeL?0:1;
  var var_names = [tabNmL,tabNmR];

  var nmSide = var_names[i_side];
  if (L.vars.exists(nmSide)) { // get a list of closed tabs per Lister
    var tab_vec = L.vars.get(nmSide);
    if (tab_vec.length > 0) {
      var map = tab_vec.back(); // get the last tab
      tab_vec.pop_back(); // remove the last tab
      var fg = F.args.fg || (! F.args.bg);
      reopenTab(map, fg, sC['PosRestore']);
    } else {dbgv("↩ tab ✗ history is empty @OnUndoTab");}
  } else   {dbgv("↩ tab ✗ history doesn't exist @OnUndoTab");}
}

function OnClearHistory(cmdD) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create, Sys=DC.SysInfo
   ,F=cmdD.func, Cmd=F.command, tab=F.sourcetab, L=tab.lister
  var activeR = L.activetab.right; // tab on the right or bottom side of a dual-display Lister
  var activeL  = !activeR;
  var var_names = [tabNmL,tabNmR];
  var nmSide = var_names[activeL?0:1];
  if (! L.vars.exists(nmSide)) { dbgv('No history to clean')
  } else {
    var tab_vec = L.vars.get(nmSide);
    var hist_count = tab_vec.length;
    if ( (sC['OkClearHistory'] >= hist_count)
      || F.args.noconfirm) {
      tab_vec.clear(); dbgv('Cleared '+hist_count+' closed tabs from history without confirmation due to a small count (≤'+sC['OkClearHistory']+') or an explicit flag ('+F.args.noconfirm+')')
    } else {
      var res_confirm = guiConfirm("Clear history of " + hist_count +" closed tabs?");
      dbgv('res_confirm=' + res_confirm);
      if (res_confirm) {tab_vec.clear(); dbgv('Cleared '+hist_count+' closed tabs from history with confirmation')
      } else {dbgv('Aborted clearing history of '+hist_count+' closed tabs');}
    }
  }
}

function OnUndoTabCloseUI(cmdD) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create, Sys=DC.SysInfo
   ,F=cmdD.func, Cmd=F.command, tab=F.sourcetab, L=tab.lister
   ,dualH=2, dualV=1;
  if ((0 || sC.DebugOutput) && (0 || sC.DebugClear)) {DOpus.ClearOutput;}
  var monRect = Sys.WorkAreas(Sys.MouseMonitor());
  var monWidth = monRect.right - monRect.left;
  var w_max_mon_pc = Math.min(Math.max(sC['Max↔ Σ🖥️'],0),100) / 100;
  var w_max = Math.round(w_max_mon_pc*monWidth,0);

  var Dlg = F.Dlg; Dlg.window = tab; Dlg.template = "✗Tabs";
  Dlg.Create(); // create detached
  var var_names = [tabNmL,tabNmR];
  var activeR = L.activetab.right; // tab on the right or bottom side of a dual-display Lister
  var activeL  = !activeR;
  var pane_active = [activeL,activeR];
  var width_max = [sC['Max↔ 1🕐'],sC['Max↔ 2🕐']];
  var t3A	= sC["Title 3 TabX"]                         	; //append active tab marker
  var t3L	= (activeR?'':t3A);
  var t3R	= (activeR?t3A:'');
  var t12	= [sC["Title 1🕐"],sC["Title 2🔖"]]                    	; //
  var t3V	= [sC["Title 3 ‹Tab ║"]+t3L,sC["Title 3 Tab› ║"]+t3R]	; //"‹tab paths" "tab› paths" + active mark
  var t3H	= [sC["Title 3 ↑Tab ═"]+t3L,sC["Title 3 ↓Tab ═"]+t3R]	; //"↑tab paths" "↓tab paths" + active mark
  var t3s	=(sC["Title 3 Tab Single"]?t3V:t3H)                  	; //DC.Vector(0,"═","║"))
  dbgv('Title ' + sC["Title 3 Tab Single"] +' '+ t3s);
  var cachedVec = DC.Map() ; // store Lister data so that we can be certain what item our dialog selected since the underlying Lister var can change while the dialog is active
  var len_nm = var_names.length;
  var fg = (F.args.fg?1:sC['fg']); var bg = F.args.bg;
  dbgv("fg args="+F.args.fg+" sC="+sC['fg']+" bg args="+bg);

  function fillList(n,nmSideLV,nmSideD) {
    // nmSideLV - which listview is used, the templated top or bottom
    // nmSideD  - which data to use to fill the listview, from the original top or bottom
    if (L.vars.exists(nmSide)) { // get a list of closed tabs per Lister
      var w_new_sum = 0;
      dbgv('✓ data ' + nmSideD);
      var lv   = Dlg.Control(nmSideLV);
      var cols    = lv.columns;
      var tab_vec = L.vars.get(nmSideD);
      cachedVec(nmSideD) = DC.Vector();
      cachedVec(nmSideD).assign(tab_vec);
      var j = tab_vec.length; while (j--) { //reverse sort, most recent on top
        var map = tab_vec[j];
        var i = lv.AddItem(map(k.time));
        lv.GetItemAt(i).subitems(0) = map(k.lbl);
        lv.GetItemAt(i).subitems(1) = map(k.path);
      }
      for (var i=0;i<2;i++) { // autosize first two columns to fit content, but up to a max width
        ci = cols.GetColumnAt(i);
        ci.name = t12[i];
        var w_old = ci.width; ci.width = -1; var w_new = ci.width;
        w_new_sum += w_new;
        if (w_new > width_max[i]) {
          ci.width = width_max[i]; dbgv((i+1) + " column clamped width at " + width_max[i] +" from resized "+ w_new + "   from old " + w_old);
        } else { dbgv((i+1) + " column resized " + w_old +" → "+ w_new);}
      }
      cpth = cols.GetColumnAt(2); var w_old = cpth.width; cpth.width = -1; var w_new = cpth.width;
      dbgv(2 + " column resized " + w_old +" → "+ w_new);
      if        (L.dual === dualH)  {dbgv('dualH');cpth.name=t3H[n]; // make title reflect pane pos (left|up)
      } else if (L.dual === dualV)  {dbgv('dualV');cpth.name=t3V[n];
      } else                        {dbgv('single');cpth.name=t3s[n];}
      w_new_sum += w_old;
      if ((w_new_sum > lv.cx)
        &&(w_new_sum < w_max)){dbgv("Resizing overall LV ↔" + lv.cx +"→"+ w_new_sum +' ↕='+lv.cy);
        lv.SetSize(w_new_sum+10,lv.cy);
      } // cols.AutoSize();
      // lv.cx = w_max;
      //// dbg('         ✗✗✗ lv.' +nmSideLV+'.AutoSize=' + lv.AutoSize() +' x¦y='+lv.x +'¦'+lv.y +' ↔¦↕='+lv.cx +'¦'+lv.cy);
      // if (n == 0) {lv.cy=600;lv.y=100;lv.visible = false;var lv1 = Dlg.Control(var_names[1]); lv1.y=0;}
      // if (n == 1) {lv.cy=400;lv.y=500;}
      // dbg('         ✗✗✗ lv.' +nmSideLV+'.AutoSize=' + lv.AutoSize() +' x¦y='+lv.x +'¦'+lv.y +' ↔¦↕='+lv.cx +'¦'+lv.cy);
    };
  }
  for (var n=0; n < len_nm; n++) {
    var n_opp = len_nm - n - 1;
    var nmSide = var_names[n];
    var nmSideLV = nmSide;
    var nmSideD = nmSide;
    var n_fill = n
    var lv = Dlg.Control(nmSide);
    dbg(nmSide + " ↕ pre ="+lv.cy);
    // lv.cy = lv.cy * 2; // set height to default size... see ↑
    if (! L.dual && sC['Hide Dual'    ] &&   n === 1) {dbgv("👓Hiding dual in single pane " +nmSide+ ' n=' + n + ' ' +(activeR?'›':'‹') +' ↕='+lv.cy);
      lv.visible = false; var lvX = Dlg.Control(var_names[n_opp]); lvX.y=0; lvX.cy=lvX.cy*2;
      continue;}
    if (  L.dual && sC['Hide Inactive']) {
      if        (activeL && n===0) {dbgv("👁Using ‹LV for ‹pane " +nmSide+ ' n=' + n + ' ' +(activeR?'›':'‹') +' ↕='+lv.cy);
        lv.cy=lv.cy * 2;                // take height from LV› (hidden)
      } else if (activeL && n===1) {dbgv("👓Hiding inactive LV› " +nmSide+ ' n=' + n + ' ' +(activeR?'›':'‹') +' ↕='+lv.cy);
        lv.visible = false; continue;
      } else if (activeR && n===0) {dbgv("👁Not hiding inactive ‹LV as it'll be reused " +nmSide+ ' n=' + n + ' ' +(activeR?'›':'‹') +' ↕='+lv.cy);
        lv.cy=lv.cy * 2;      continue; // take height from LV› (hidden)
      } else if (activeR && n===1) {dbgv("👓Reusing ‹LV pane› (its LV› is hidden) " +nmSide+ ' n=' + n + ' ' +(activeR?'›':'‹') +' ↕='+lv.cy);
        lv.visible = false; nmSideLV = var_names[n_opp]; }
    } else if (L.dual) {
      if (activeR && n===1) {lv.focus = true}; // focus active right panel
    }
    fillList(n,nmSideLV,nmSideD);
    dbg(nmSide + " ↕ pos ="+lv.cy);
    // dbg('   ✗✗✗ fillList ' + nmSide);
  }
  var l0 = Dlg.Control(var_names[0]);
  var l1 = Dlg.Control(var_names[1]);
  var preH = l0.cy; // store top's control ↕ since it's the only one that will be resized, but need to move some of this height increase to the bottom one (adjusting its Y pos)
  var lvH = 56; var lvCnt = 2; var lvScaleToTempl = 2; // 2 panels, each grows since template is 50% smaller
  Dlg.cy = Dlg.cy + DOpus.dpi.Scale(lvH*lvCnt*lvScaleToTempl); // set height to default size (template is reduced to allow for decrease/increase in size of dialog and listviews)
  Dlg.y  = Dlg.y  - DOpus.dpi.Scale(lvH*lvCnt*lvScaleToTempl/2); // adjust top position (dialog grows up/down, do move up by 1/2)
  var width_inc = w_max - Dlg.cx;
  if (width_inc) { // increase total dialog's width and reposition
    Dlg.cx = w_max;
    Dlg.x = Math.max(Dlg.x - width_inc/2,0);
  };
  var posH = l0.cy;
  if ((! L.dual && ! sC['Hide Dual'  ])
    ||  (L.dual && ! sC['Hide Inactive'])) {
    l0.cy -= (posH-preH)/2;
    l1.cy += (posH-preH)/2;
    l1.y  -= (posH-preH)/2;
  }
  var hk = getHotkey(0);
  for (  var e = new Enumerator(hk)          ; !e.atEnd(); e.moveNext()) {
    for (var n = new Enumerator(hk(e.item())); !n.atEnd(); n.moveNext()) {
      Dlg.AddHotkey(n.item(),n.item());}}
  var retVal = Dlg.Show(); // run as detached, need event loop to catch hotkeys and box checking
  var retHK=0, retBtn=0, retClick=0;
  var isOpenL=false, isOpenR=false;
  var sel_undo=DC.Map(); //, sel_redo=DC.Map();
  sel_undo(var_names[0]) = DC.Vector(); sel_undo(var_names[1]) = DC.Vector();
  // sel_redo(var_names[0]) = DC.Vector(); sel_redo(var_names[1]) = DC.Vector();
  var by = sC['▼▲⋅X'];
  var sh = new ActiveXObject("WScript.Shell");
  var sel_script = false; // don't save selection events emitted by this script
  var undo_count=0;// uninterrupted sequence of un/re-dos should go further back; reset on re/un-do|real selchange
  t_step_ms(); // measures ms passed since this point and the next invocation to measure selchange event timings
  var glue_ms = sC['▋glueTΔ'];
  function sel_undo_f(isBtn) {
    // if (typeof isBtn == 'undefined') {isBtn = false;}
    for (var i=0;i<var_names.length;i++) {
      var tabNmSide = var_names[i];
      var lv=Dlg.Control(tabNmSide);
      var lv=Dlg.Control(tabNmSide);
      if ((lv.focus) || isBtn) { // buttons steal focus from the listview
        var sel_vec = sel_undo(tabNmSide);
        if (sel_vec.length > 1) {
          undo_count += 1;
          var undo_i = sel_vec.length - undo_count - 1; //~2=sel/desel event for 1 selection change (but only for simple ones), might bug on 1st or no sel, todo: fix if bugs
          if ((undo_i >= 0) && (undo_i < sel_vec.length)){
            var sel_items_prev = sel_vec(undo_i);
            var sel_ids = vecItem2Idx(sel_items_prev); //vec(DialogListItem) → vec(Indices)
            // sel_redo(tabNmSide).push_back(sel_ids); // save for redo
            sel_script = true; // prevent this event from being recorded
            // dbgv("undid selection, set sel_script to true");dbgv(T(sel_ids)+" #"+sel_ids.length+" = "+vec2str(sel_ids));
            lv.value=sel_ids;
            Dlg.SetTimer(1,'sel_script_reset'); // reset status on a timer (direct reset fails)
          } else {undo_count=sel_vec.length-1; dbgv("Reached the first of selection history #"+undo_i+" of #"+sel_vec.length+" undo_count #"+undo_count)}
        } else {lv.value=DC.Vector();dbgv("No saved selection history changes to undo, reset all #"+sel_vec.length)}
      }
    }
  }
  function sel_redo_f(isBtn) {
    // if (typeof isBtn == 'undefined') {isBtn = false;}
    for (var i=0;i<var_names.length;i++) {
      var tabNmSide = var_names[i];
      var lv=Dlg.Control(tabNmSide);
      if ((lv.focus) || isBtn) { // buttons steal focus from the listview
        var sel_vec = sel_undo(tabNmSide);
        if (sel_vec.length > 1) {
          undo_count -= 1;
          var redo_i = sel_vec.length - undo_count - 1; //~2=sel/desel event for 1 selection change (but only for simple ones), might bug on 1st or no sel, todo: fix if bugs
          if ((redo_i >= 0) && (redo_i < sel_vec.length)) {
            var sel_items_next = sel_vec(redo_i);
            var sel_ids = vecItem2Idx(sel_items_next); //vec(DialogListItem) → vec(Indices)
            sel_script = true; // prevent this event from being recorded
            // dbgv("redid selection, set sel_script to true");dbgv(T(sel_ids)+" #"+sel_ids.length+" = "+vec2str(sel_ids));
            lv.value=sel_ids;
            Dlg.SetTimer(1,'sel_script_reset'); // reset status on a timer (direct reset fails)
          } else {undo_count=0; dbgv("Reached the last of selection history #"+redo_i+" of #"+sel_vec.length+" undo_count #"+undo_count)}
        } else {dbgv("No saved selection history changes to redo #"+sel_vec.length)}
      }
    }
  }

  while (true) {
    var Msg = Dlg.GetMsg();
    if (!Msg.result) break;
    dbgv("Msg Event = " + Msg.event +" Control="+T(Msg.control)+"="+Msg.control);
    if (  Msg.event === "hotkey") {
      if (hk('✓').exists    	(Msg.control)) {dbgv('hkY');retHK=1; break;}
      if (hk('⎋').exists    	(Msg.control)) {dbgv('hkN');retHK=0; break;}
      if (hk('⎌▋').exists   	(Msg.control)) {dbgv('hkU ⎌▋'); sel_undo_f();}
      if (hk('↷▋').exists   	(Msg.control)) {dbgv('hkR ↷▋'); sel_redo_f();}
      if (hk('‹Open').exists	(Msg.control)) { // check force side box and uncheck the other one
        var c=Dlg.Control('isOpen‹'); c.value=!c.value; dbgv('hkOpenL ' + c.value); isOpenL=c.value;
        if (c.value) {var d=Dlg.Control('isOpen›'); d.value=false; dbgv('hkOpenR ' + d.value);}}
      if (hk('Open›').exists	(Msg.control)) {
        var c=Dlg.Control('isOpen›'); c.value=!c.value; dbgv('hkOpenR ' + c.value); isOpenR=c.value;
        if (c.value) {var d=Dlg.Control('isOpen‹'); d.value=false; dbgv('hkOpenL ' + d.value);}}
      if (hk('Nav◀⭾').exists 	(Msg.control)) {Dlg.Control(var_names[0]).focus=true;}
      if (hk('Nav▶⭾').exists 	(Msg.control)) {Dlg.Control(var_names[1]).focus=true;}
      if (hk('Nav▼').exists  	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{sh.SendKeys("^{DOWN}")}  }   }
      if (hk('Nav▲').exists  	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{sh.SendKeys("^{UP}")}  }   }
      if (hk('Nav▼▋').exists 	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{sh.SendKeys("{DOWN}")}  }   }
      if (hk('Nav▲▋').exists 	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{sh.SendKeys("{UP}")}  }   }
      if (hk('Nav▼5').exists 	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{for (var i = 0; i < by; i++) {sh.SendKeys("^{DOWN}")}}  }   }
      if (hk('Nav▲5').exists 	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{for (var i = 0; i < by; i++) {sh.SendKeys("^{UP}"  )}}  }   }
      if (hk('Nav▼5▋').exists	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{for (var i = 0; i < by; i++) {sh.SendKeys("{DOWN}" )}}  }   }
      if (hk('Nav▲5▋').exists	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{for (var i = 0; i < by; i++) {sh.SendKeys("{UP}"   )}}  }   }
      if (hk('▋').exists     	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{sh.SendKeys(" ")}  }   }
      if (hk('▋∀').exists    	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{lv.SelectItem(-1)}  }   }
      if (hk('▋✗').exists    	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{sh.SendKeys("^{ }")}  }   }
      if (hk('▋✗∀').exists   	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{lv.DeselectItem(-1)}  }   }
      if (hk('▋🔄').exists    	(Msg.control)) {for (var n=0; n < len_nm; n++) {var nmSide = var_names[n]; var lv=Dlg.Control(nmSide);
        if (lv.focus)        	{sh.SendKeys("^{ }")}  }   }
    }
    if (  Msg.event === "dblclk" && sC['🖰⋅2↩']) { // confirm selection
      if (Msg.control === var_names[0]) {dbgv('🖰⋅2'); retClick=1; break;}
      if (Msg.control === var_names[1]) {dbgv('🖰⋅2'); retClick=1; break;}
    }
    if (Msg.event === "timer") {
      if (Msg.Control ==='sel_script_reset') {Dlg.KillTimer('sel_script_reset'); sel_script = false; dbgv("reset sel_script to false");}
    }
    if (  Msg.event === "selchange") {dbgv("control="+Msg.control+" data="+Msg.data+" index="+Msg.index+" value="+Msg.value);
      var tabNmSide = Msg.control;
      var lv=Dlg.Control(tabNmSide);
      if (sel_script) {dbgv("script-driven selection, do not save undos");
      } else {elapsed_ms = t_step_ms(); // save undo and reset undo count
        if (  elapsed_ms > glue_ms) { // save undo only for "spread out" events, trying to treat closed-timed selections as 1 user selection
          sel_undo(tabNmSide).push_back(lv.value); undo_count=0;
          dbgv("saved to sel_undo "+tabNmSide+" #"+lv.value.count+" sel_script="+sel_script+" 🕐Δ="+elapsed_ms); }
      }
    }
    if (  Msg.event === "click") {
      if (Msg.control === "btnY"   ) {dbgv('btnY'); retBtn=1; break;}
      if (Msg.control === "btnN"   ) {dbgv('btnN'); retBtn=0; break;}
      if (Msg.control === "btnU"   ) {dbgv('btnU ⎌▋');sel_undo_f(1);}
      if (Msg.control === "btnR"   ) {dbgv('btnR ↷▋');sel_redo_f(1);}
      if (Msg.control === "isOpen‹") {dbgv('isOpen‹' + Msg.data); isOpenL=Msg.data;}
      if (Msg.control === "isOpen›") {dbgv('isOpen›' + Msg.data); isOpenR=Msg.data;}
    }
  }
  retVal = Dlg.result;

  if (retBtn || retHK || retVal || retClick) {
    Cmd = F.command;
    Cmd.deselect = false;
    for (var i=0;i<var_names.length;i++) {
      var nmSide	= var_names[i];
      var lv    	= Dlg.Control(nmSide);
      var sel_items = lv.value; var sel_ids = vecItem2Idx(sel_items); //vec(DialogListItem) → vec(Indices)
      // dbgv('✓Undo '+nmSide + ' sel_ids=' + vec2str(sel_ids) +" len="+ sel_ids.length);
      var cleanSafe = true; // cached and actual lists of closed tabs match, safe to used cached indices to remove tabs from lister vars
      if (! L.vars.exists(nmSide)) {cleanSafe = false;} // actual list doesn't exist for some reason
      if (cachedVec.exists(nmSide)) {
        var tab_vec = cachedVec.get(nmSide);
        if (cleanSafe) {
          var tab_vec_act = L.vars.get(nmSide);
          if (! (tab_vec.length === tab_vec_act.length)) {err("Lister's history of closed tabs ≠(size) the one used for selection, tabs will be reopened, but not removed from history"); cleanSafe = false;}  }
        var isLast = false;
        var j = sel_ids.length; while (j--) {isLast = (j===0);
          var sel_i = sel_ids[j]
          var src_i = tab_vec.length - sel_i - 1; // original vec was reverse sorted
          var map = tab_vec[src_i]; // dbgv(sel_i+'→'+src_i + " Σtab_vec=" + tab_vec.length + 'T(path)=' + T(map(k.path)));
          if (isLast)	{var fg_i = fg || (! bg); dbgv('last fg_i='+fg_i);
          } else     	{var fg_i = false;} // only focus the last tab
          var side = (isOpenL ? arg_inL
            :        (isOpenR ? arg_inR
            :        (i       ? arg_inR
            :                   arg_inL)))
          reopenTab(map, fg_i, sC['PosRestore'], side);
          if (cleanSafe) {var tab_i_act  = tab_vec_act[src_i];
            if (! (tab_i_act(k.path) === map(k.path)) ) {err("Lister's history of closed tabs ≠(path/position) the one used for selection, tabs will be reopened, but not removed from history"); cleanSafe = false;}}
        }
        // dbg('  ✗✗ tab_vec_act T='+T(tab_vec_act)+' #'+tab_vec_act.length) ; //
        // dbg('  ✗✗ sel_ids T='+T(sel_ids)+' = '+vec2str(sel_ids)) ; //
        if (cleanSafe) {rm_vec_by_idx(tab_vec_act,sel_ids,1); //original was reverse sorted
        // dbgv('Cleaned reopened tabs from history');
        }
      }
    }
  } else {dbgv('✗Cancel, do nothing retVal=' + retVal + ' retBtn=' + retBtn + ' retHK=' + retHK);}
}
function is_valid_hk(hk_s) {
  var t=is_valid_hk, sV=Script.vars,sC=Script.config,DC=DOpus.Create;
  if (typeof t.Init == 'undefined') {t.Init = true;
    // var reHK = new RegExp('((?<mod>ctrl|shift|alt)(?<glue>[+-]))*+(?<key>\w)',"gmi");
    var modi_s = 'ctrl|shift|alt'; var modi_sym = '⎈|⌃|⎇|⌥|◆|❖|⌘';
    t.reMod = new RegExp('((('+modi_s+')([+-]))|('+modi_sym+'))*',"gmi");
    t.reKey = new RegExp('[\x21-~\u0430-\u044f]',"gmi"); //todo: doesn't reject JJ since longer key names exist. Whitelist them
  }
  if (hk_s.replace(t.reMod,'').match(t.reKey)) {return true} else {return false}
}
function hk_sub_symbol(hk_s) { // replaces ⇧ ⎈⌃ ⎇⌥ ◆❖⌘ symbols with their textual counterparts
  var t=hk_sub_symbol, sV=Script.vars,sC=Script.config,DC=DOpus.Create;
  if (typeof t.Init == 'undefined') {t.Init = true;
    t.reShift	= new RegExp('⇧'    	,"gmi");
    t.reCtrl 	= new RegExp('⎈|⌃'  	,"gmi");
    t.reAlt  	= new RegExp('⎇|⌥'  	,"gmi");
    t.reWin  	= new RegExp('◆|❖|⌘'	,"gmi");}
  return hk_s
    .replace(t.reShift	,'Shift+')
    .replace(t.reCtrl 	,'Ctrl+')
    .replace(t.reAlt  	,'Alt+')
    .replace(t.reWin  	,'Win+');
}
function validHK(hk_v) {
  var sV=Script.vars,sC=Script.config,DC=DOpus.Create;
  hk	= DC.StringSet();
  for (var i=0;i<hk_v.length;i++) { var key_combo = hk_sub_symbol(hk_v(i));
    if (is_valid_hk(key_combo)) {hk.insert(key_combo); //dbgv(' valid key combo=‘'+key_combo+'’');
  } else {err('❗ invalid key combo = ‘'+key_combo+'’');}}
  return hk
}
function getHotkey(force) {
  var t=getHotkey, sV=Script.vars,sC=Script.config,DC=DOpus.Create;
  if ((typeof t.Init == 'undefined') || (force)) {t.Init = true; var hk = DC.Map(); //dbgv('setup HK @ getHotkey');
    hk('✓')     	= validHK(sC['✓'     	]); // Confirm
    hk('⎋')     	= validHK(sC['⎋'     	]); // Cancel
    hk('⎌▋')    	= validHK(sC['⎌▋'    	]); // undo selection
    hk('↷▋')    	= validHK(sC['↷▋'    	]); // redo selection
    hk('‹Open') 	= validHK(sC['‹Open' 	]); // force open left
    hk('Open›') 	= validHK(sC['Open›' 	]); // force open right
    hk('Nav◀⭾') 	= validHK(sC['Nav◀⭾' 	]); // switch to top    panel
    hk('Nav▶⭾') 	= validHK(sC['Nav▶⭾' 	]); // switch to bottom panel
    hk('Nav▼')  	= validHK(sC['Nav▼'  	]); // ▼nav without (de)selection
    hk('Nav▲')  	= validHK(sC['Nav▲'  	]); // ▲nav without (de)selection
    hk('Nav▼▋') 	= validHK(sC['Nav▼▋' 	]); // ▼nav with extending selection
    hk('Nav▲▋') 	= validHK(sC['Nav▲▋' 	]); // ▲nav with extending selection
    hk('Nav▼5') 	= validHK(sC['Nav▼5' 	]); // ▼⋅5 nav without (de)selection
    hk('Nav▲5') 	= validHK(sC['Nav▲5' 	]); // ▲⋅5 nav without (de)selection
    hk('Nav▼5▋')	= validHK(sC['Nav▼5▋'	]); // ▼⋅5 nav with extending selection
    hk('Nav▲5▋')	= validHK(sC['Nav▲5▋'	]); // ▲⋅5 nav with extending selection
    hk('▋')     	= validHK(sC['▋'     	]); // ␠select
    hk('▋∀')    	= validHK(sC['▋∀'    	]); // select all
    hk('▋✗')    	= validHK(sC['▋✗'    	]); // ␠deselect TODO: ⎈␠ toggles, but how to deselect
    hk('▋✗∀')   	= validHK(sC['▋✗∀'   	]); // deselect all
    hk('▋🔄')    	= validHK(sC['▋🔄'    	]); // ⎈␠ toggle selection
    t.getHotkey_hk = hk;}
  return t.getHotkey_hk
}

==SCRIPT RESOURCES
<resources><resource name="✗Tabs" type="dialog">
<dialog fontsize="10" width="234" height="128" lang="english" resize="yes" title="Reopen ✗closed Tabs">
  <control name="‹tab✗" type="listview" viewmode="details" fullrow="yes"  width="234" x="0" y= "0" height="56" multisel="yes" resize="whs">
    <columns><item text="🕐"/><item text="🔖"/><item text="‹tab paths"/></columns></control>
  <control name="tab✗›" type="listview" viewmode="details" fullrow="yes"  width="234" x="0" y="56" height="56" multisel="yes" resize="yw">
    <columns><item text="🕐"/><item text="🔖"/><item text="tab› paths"/></columns></control>
  <control                        	name="isOpen‹"	x= "50"	width="30"	y="115"	height="10"	resize="wsy"	title="‹&amp;Open"      	                     		type="check" />
  <control                        	name="btnU"   	x= "84"	width="32"	y="113"	height="14"	resize="wsy"	title="⎌▋ &amp;Undo Sel"	                     	type="button"/>
  <control                        	name="btnR"   	x="118"	width="32"	y="113"	height="14"	resize="wsy"	title="↷▋ &amp;Redo Sel"	                     	                	type="button"/>
  <control                        	name="isOpen›"	x="154"	width="30"	y="115"	height="10"	resize="wsy"	title="O&amp;pen›"      	                     	                	type="check" />
  <control close="1" default="yes"	name="btnY"   	x="188"	width="40"	y="113"	height="14"	resize="wsy"	title="&amp;Reopen"     	image="#undoclosetab"	imagelabel="yes"	type="button"/>
  <control close="0"              	name="btnN"   	x=  "4"	width="40"	y="113"	height="14"	resize="wsy"	title="✗&amp;Cancel"    	                     	imagelabel="yes"	type="button"/>
</dialog></resource>
</resources>
