@include inc_std.js
@include inc_dbg.js
@include inc_cfg.js
// backup.LayoutOn⎋, ↑ must be at the very top, before comments; save as 'UTF-8 with BOM'
// based on Layout_UpdateOnClose_Handler v1.0.2 © 2016 steje
// Auto updates a user defined Lister layout when closing a lister that was launched from a layout (by default ignores the Default layout since Opus has it's own setting in Prefs for that)
// Script can be configured via the 'Script Management' DOpus window or 'layout_updateonclose' DOpus environment variable, e.g., toggle an environment variable of either global or lister scope:
  // @toggle:if $lst:layout_updateonclose
  // @ifset:    $lst:layout_updateonclose
  // @set        lst:layout_updateonclose
  // @ifset:else
  // @set        lst:layout_updateonclose=true

function OnInit(D) {
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create;
  D.name          	= "backup.LayoutOn⎋";
  D.desc          	= "Automatically save Lister layout when a Lister using this layout is  closed normally" + "\n"
    +""           	+ "" + "(on crashes we don't get an OnCloseLister notification so can do nothing)" + "\n"
    +""           	+ "(click ⚙ to configure)";
  D.version       	= '0.1@24-03';
  D.url           	= '';
  D.default_enable	= true;
  D.min_version   	= '13.0';
  D.copyright     	= "©2016 steje(vbs) ©es(js)";

  var uid = "1fdacb64921042caafd867acd726cdb9";
  var cfg = new ConfigHelper(D);
  cfg.add("DebugOutput" 	).g('Debug'	).val(false	).des('Enable debug output in the "Script log"')
  cfg.add("DebugClear"  	).g('Debug'	).val(false	).des("Clear log messages from the Opus Output Window between script runs")
  cfg.add("DebugVerbose"	).g('Debug'	).val(false	).des('More verbose debug (e.g., event callbacks) in the "Script log"')

  cfg.add("Always On"             	).g('Misc'  	).val(true         	).des("Enable script execution without the use of environment variables")
  cfg.add("Exclude Layouts"       	).g('Filter'	).val(DC.Vector("")	).des("Names of the saved layouts the script should NOT update")
  cfg.add("Exclude if prefixed"   	).g('Filter'	).val("✗"          	).des("Always ignore layouts with names starting with this prefix\n(helpful to avoid manually adding layout names to the settings)")
  cfg.add("Include if prefixed"   	).g('Filter'	).val(""           	).des("Only save layouts with names starting with this prefix\n(helpful to avoid manually adding layout names to the settings)")
  cfg.add("Include Default Layout"	).g('Filter'	).val(false        	).des("Override the settings in Prefs (if disabled) to automatically update the default lister on close")
  cfg.add("LayoutSaveOptions"     	).g('Misc'  	).val(""           	).des("Additional options support by the 'Prefs LAYOUTSAVE' command. if specifying actual LAYOUTSAVE option args, make them first followed by a comma")
  cfg.add("LayoutSaveSingle"      	).g('Misc'  	).val(true         	).des("Save only the single lister being closed in the updated lister layout")
  cfg.add("SetAsDefaultForce"     	).g('Misc'  	).val(false        	).des("Suppress the confirmation and success prompts when setting the Default Lister manually")
  cfg.add("SetAsDefaultQuiet"     	).g('Misc'  	).val(false        	).des("Suppress the success prompt when setting the Default Lister")
  var modi_allowed = "(1 key per line, case insensitive)\n  None or ∅\n  Shift or ⇧\n  Ctrl or ⎈\n  LWin or ‹❖\t  RWin or ❖›\n  Alt or ⎇";
  cfg.add("Modifiers Save"  	).g('Keys'	).val(DC.Vector("None")	).des("Save layout only if the following modifier(s) were held on exit:\n" + modi_allowed)
  cfg.add("Modifiers Ignore"	).g('Keys'	).val(DC.Vector()      	).des("Do NOT save layout if the following modifier(s) were held on exit:\n(higher priority vs ‘Modifiers Save’)\n" + modi_allowed)
  cfg.add("Save🕐"           	).g('Misc'	).val(0                	).des("Save layout after this many minutes has passed (0 to disable)\n(but only if any layout changing event happens)\ntimers checked per Lister")

  var keymap = DOpus.Create.Map(); // map DOpus qualifiers to allowed alternative input
  keymap("none") 	= "∅";
  keymap("shift")	= "⇧";
  keymap("ctrl") 	= "⎈";
  keymap("alt")  	= "⎇";
  keymap("lwin") 	= "‹❖";
  keymap("rwin") 	= "❖›";
  D.vars.set('keymap',keymap);
  D.vars.set('time',DC.Date);
}

// todo: is this needed or OnCloseLister will be called?
// function OnShutdown(shutdownData) {} // When Directory Opus shuts down
function OnCloseLister(D) { // After a lister has been closed
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create;
  if ((0 || sC.DebugOutput) && (sC.DebugClear)) {DOpus.ClearOutput;}
  if (executeScript(D)) {saveLister(D.lister);} // Check if this is the default lister layout and the override option is not set
}
function saveIfTime(src) { // check if enough time has passed and save layout (this gets called by events)
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create
    , tnow = DC.Date
    , twait = sC['Save🕐'];
  if (twait === 0) {return}
  L = DOpus.listers.lastactive;
  if (! L) {dbgv('listers.lastactive not ready yet'); return}
  if (L.vars.exists('time')) { // save timers per Lister
    l_old = L.vars.get('time');
    dbgv("existing🕐 in lister named ‘"+ L.title +'’ with layout ‘'+ L.layout +'’');
  } else {
    l_old = tnow;
    L.vars.set('time',l_old);
    dbgv('saved new🕐 to lister named ‘'+ L.title +'’ with layout ‘'+ L.layout +'’');
  }
  var tpassed_m = Math.round((tnow - l_old)/10/60)/100;
  if (tpassed_m >= twait) {
    dbg('🕐passed ' + tpassed_m + ' ≥ ' + twait + ' min user defined period, saving and resetting the timer, called by ‘'+ src +'’');
    L.vars.set('time',tnow);
    saveLister(L);
  } else {dbgv('🕐passed ' + tpassed_m + ' < ' + twait + ' min user defined period, not saving, called by ‘'+ src +'’');}
}
function saveLister(L) { // check if layout can be saved and save it
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create;
  if (  ! (L.layout        )
    && (! (sC['include default layout']))) {
    dbg       ("✗Lister⎋: layout ‘" + L.layout + "’ titled ‘" + L.title + "’ (configured to skip the Default)");
  } else {res_save = Layout_Update(L);
    dbg( (res_save?'✓':'✗') + "Lister⎋: layout ‘" + L.layout + "’ titled ‘" + L.title + "’");
  }
}


function Layout_Update(objSrcLister) { // Main worker function of the script for OnCloseLister events
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create;
  var is_cmd_arg	= false;
  var objLister 	= objSrcLister;
  var strLayout 	= objLister.layout;

  prefix    	= sC['exclude if prefixed'];
  prefix_yes	= sC['include if prefixed'];
  if (       (prefix    ) &&   (strLayout.substr(0,prefix    .length) === prefix)) {dbg("‘"      + strLayout + "’ starts with an ‘Exclude if prefixed’ value, ignoring");
    return false
  } else if ((prefix_yes) && ! (strLayout.substr(0,prefix_yes.length) === prefix_yes)) {dbg("‘"      + strLayout + "’ does NOT start with an ‘Include if prefixed’ value, ignoring");
    return false
  } else if (matchExcludeLayout(strLayout)) {dbg("Found ‘"+ strLayout + "’ in ‘Exclude Layouts’ list, exit...");
    return false
  } else	{dbg("Updating layout:  ‘" + strLayout + "’");
    var dopusCmd = DOpus.NewCommand;
    dopusCmd.SetSourceTab(objLister.activetab);
    var cmd_s  	= "";
    var cmd_arg	= "";
    if (!(strLayout)) { // no layout name → default lister so run setdefaultlister
      if (sC.SetAsDefaultForce) { // Get the setasdefault options from the script config options
        cmd_arg   	= "=force";
        is_cmd_arg	= true;}
      if (sC.SetAsDefaultQuiet) {
        if (is_cmd_arg)	{cmd_arg = cmd_arg + ",";
        } else         	{cmd_arg =           "=";}
        cmd_arg = cmd_arg + "quiet"; }
      cmd_s = "Prefs SETDEFAULTLISTER" + cmd_arg;
    } else {
      if (sC.LayoutSaveSingle) {cmd_arg = ",single";} //Get the layoutsave options from the script config options
      cmd_s = "Prefs LAYOUTSAVE=updatecurrent" + cmd_arg;
    }; dbgv("  Run:  " + cmd_s);
    dopusCmd.RunCommand(cmd_s);
    return true
  }
}

function executeScript(CloseListerD) { // Check for various things that determine if the script should run or not
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create
    , modi_user = CloseListerD.qualifiers
    , keymap = sV.get('keymap')
    , modi_on  = DC.StringSetI()
    , modi_off = DC.StringSetI();
  modi_on .assign(sC['modifiers save']);
  modi_off.assign(sC['modifiers ignore']);
  var dopusCmd = DOpus.NewCommand  // Check for any of the script options or environment variables that enable the scripts execution
  if (sC['always on'])                                    	{//dbg("Script is set to 'always on'");
  } else if (dopusCmd.IsSet("$glob:layout_updateonclose"))	{//dbg("[layout_updateonclose] is set: [global]")
  } else if (dopusCmd.IsSet("$lst:layout_updateonclose")) 	{//dbg("[layout_updateonclose] is set: [lister]")
  } else                                                  	{dbg("Not enabled, exit...");
    return false
  }
  if (         keymap.exists(modi_user)) {
    var modi = keymap.get   (modi_user); //
    if (   modi_off.exists(modi_user)
      &&   modi_off.exists(modi     )){dbg(modi_user + "(" + modi + ") modifier key configured to NOT save layout");
      return false} // Check for DISABLING qualifier key settings
    if ( ! modi_on .exists(modi_user)
      && ! modi_on .exists(modi)    ){dbg(modi_user + "(" + modi + ") modifier not configured to save layout");
      return false} // Check for ENABLING qualifier key settings
  } else {DOpus.Output("Unknown modifier ‘" + modi_user + "’", true);}
  return true
}

function matchExcludeLayout(strLayout) { // Check if the current layout name is in the exclude list in the script config options
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create
    , lyt_exclude  = DC.StringSetI();
  lyt_exclude.assign(sC['exclude layouts']);
  //dbg("matchExcludeLayout()")
  if (lyt_exclude.exists(strLayout)) {return true
  } else if  (lyt_exclude.empty) {dbg("‘Exclude Layouts’ list is empty");}
}

function OnOpenTab          	(openTabD          	) {saveIfTime('OpenTab'          	);} // when a new tab is opened
function OnCloseTab         	(closeTabD         	) {saveIfTime('CloseTab'         	);} // when a tab is closed
function OnSourceDestChange 	(sourceDestChangeD 	) {saveIfTime('SourceDestChange' 	);} // when the source and destination are changed
function OnAfterFolderChange	(afterFolderChangeD	) {saveIfTime('AfterFolderChange'	);} // after a new folder is read in a tab
function OnStyleSelected    	(styleSelectedD    	) {saveIfTime('StyleSelected'    	);} // when a new Lister style is chosen
function OnDisplayModeChange	(displayModeChangeD	) {saveIfTime('DisplayModeChange'	);} // when the display mode is changed in a tab
function OnFlatViewChange   	(flatViewChangeD   	) {saveIfTime('FlatViewChange'   	);} // when the Flat View mode is changed in a tab
function OnListerUIChange   	(listerUIChangeD   	) {saveIfTime('ListerUIChange'   	);} // when a change to the Lister UI occurs
function OnListerResize     	(listerResizeD     	) {saveIfTime('ListerResize'     	);} // whenever a Lister is resized
