@include inc_std.js
@include inc_dbg.js
@include inc_cfg.js
// backup.TabGroupSave🕘, ↑ must be at the very top, before comments; save as 'UTF-8 with BOM'

function OnInit(D) {
  D.name          	= "backup.TabGroupSave🕘";
  D.desc          	= "Periodically save active set of tabs in a tab group to avoid data loss" + "\n"
    +""           	+ "(click ⚙ to configure)";
  D.version       	= "0.3@25-03";
  D.url           	= "";
  D.default_enable	= true; D.min_version = "12.5"; D.copyright = "es";

  setDefaults(D)
  var sV=D.vars, sC=D.config, DC=DOpus.Create, Sys=DC.SysInfo, C=new ConfigHelper(D);
  C.add('Period'      	).val(sV.get('Period≝'      	)).g(' Time').des("Save all tabs once per this many minutes. ≝"
    +                 	      sV.get('Period≝'      	));
  C.add('MaxHistory'  	).val(sV.get('MaxHistory≝'  	)).g(' History').des("Save up to this many versions, each newer one has its index +1 incremented until MaxHistory, then starts from the beginning. ≝"
    +                 	      sV.get('MaxHistory≝'  	));
  C.add('PrefixDir'   	).val(sV.get('PrefixDir≝'   	)).g('Name').des('🐞ignored due to an unknown🐞 Name of the folder to add a tab group to. ≝'
    +                 	      sV.get('PrefixDir≝'   	));
  C.add('PrefixFile'  	).val(sV.get('PrefixFile≝'  	)).g('Name').des("Saved tab group name (with a time-based #index appended up to MaxHistory).\n⚠ Deletes tab groups starting with 'PrefixFile #', so don't pick a name you use in other groups.\nIllegal file name symbols: *:\"\\|<>/?^ ≝"
    +                 	      sV.get('PrefixFile≝'  	));
  C.add('CloseOthers' 	).val(sV.get('CloseOthers≝' 	)).g(' Misc').des('Set "Close all other tabs" option. ≝'
    +                 	      sV.get('CloseOthers≝' 	));
  C.add('DebugOutput' 	).val(sV.get('DebugOutput≝' 	)).g('  Debug').des('Enable debug output in the "Script log". ≝'
    +                 	      sV.get('DebugOutput≝' 	));
  C.add('DebugVerbose'	).val(sV.get('DebugVerbose≝'	)).g('  Debug').des('More verbose debug in the "Script log". ≝'
    +                 	      sV.get('DebugVerbose≝'	));

  DOpus.KillTimer(345);
  DOpus.SetTimer (345, sV.get('Period') * 60 * 1000);
}

function setDefaults(D) {var sV=D.vars;
  sV.set('Period≝'      	,10        	 );sV.set('Period'      	,sV.get('Period≝'      	));
  sV.set('MaxHistory≝'  	,5         	 );sV.set('MaxHistory'  	,sV.get('MaxHistory≝'  	));
  sV.set('PrefixDir≝'   	,'Backup'  	 );sV.set('PrefixDir'   	,sV.get('PrefixDir≝'   	));
  sV.set('PrefixFile≝'  	,'TabGroup'	 );sV.set('PrefixFile'  	,sV.get('PrefixFile≝'  	));
  sV.set('CloseOthers≝' 	,true      	 );sV.set('CloseOthers' 	,sV.get('CloseOthers≝' 	));
  sV.set('DebugOutput≝' 	,false     	 );sV.set('DebugOutput' 	,sV.get('DebugOutput≝' 	));
  sV.set('DebugVerbose≝'	,false     	 );sV.set('DebugVerbose'	,sV.get('DebugVerbose≝'	));
  sV.set('idx'          	,0         	 );
}

function OnScriptConfigChange(configChangeData) { cfgUpdate(configChangeData.changed); }

function OnPeriodicTimer(D) { dbgv('OnPeriodicTimer #' + D.id); //PeriodicTimerData
  var dopusCmd = DOpus.NewCommand;
  dopusCmd.RunCommand('TabGroupSave');
}

function OnAddCommands(addCmdD) {
  var cmd        	= addCmdD.AddCommand();
  cmd.name       	= 'TabGroupSave';
  cmd.method     	= 'OnTabGroupSave';
  cmd.desc       	= "Save a tab set out of order (the timers won't be affected)";
  cmd.label      	= 'Save a tab set';
  // cmd.template	= 'fg/so,bg/so';
  // cmd.icon    	= '';
  cmd.hide       	= false;
}


function OnTabGroupSave(scriptCmdData) {
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create
    , func	= scriptCmdData.func  // info about the default source/dest of the command, as well as details about how it was invoked
    , cmd 	= func.command        // pre-filled Command object that can be used to run commands against the source and destination tabs. =DOpusFactory.Command and setting the source and destination tabs manually
    , tab 	= func.sourcetab      //
    , args	= func.args           ;
  var idx = Math.floor(sV.get('idx') % sV.get('MaxHistory' )) + 1;
  sV.set('idx', idx);
  var tabGroups = DOpus.TabGroups;

  var listers = DOpus.listers; var i=0;
  for (var li = new Enumerator(listers); !li.atEnd(); li.moveNext()) {var L = li.item(); i+=1;
  var ts = new Date(); //Day+Mon (locale-aware) HH:MM
  var reg_repl_year = new RegExp('[\\/-]?'+ ts.getFullYear(),"gm");
  var hh = ts.getHours  (); if (hh.length == 1) {hh = " "+hh}
  var mm = ts.getMinutes(); if (mm.length == 1) {mm = " "+mm}
  var cur_date_time = ts.toLocaleDateString().replace(reg_repl_year,'') +' '+ hh +'꞉'+ mm; //: bugs since these are saved as files
  var task_name_prefix = 'L'+i+ sV.get('PrefixFile' ) +' '+ idx;
  var task_name_pre_re = new RegExp(task_name_prefix +'.*',"gm");
  var task_name = task_name_prefix +' '+ cur_date_time;
  var tg_res;
  // ↓ todo: delete old task with the same prefix
  // if (sV.get('PrefixDir')) {dbgv("saving with PrefixDir ¦" + sV.get('PrefixDir') +"→"+ task_name +"¦");
  //   var found = false;
  //   for     (var e = new Enumerator(tabGroups); !e.atEnd(); e.moveNext()) {var tg   = e.item();
  //     if ((tg.folder) && (tg.name === sV.get('PrefixDir'))) {found = true; dbgv("folder = " + tg.name);
  //       for (var e = new Enumerator(tg       ); !e.atEnd(); e.moveNext()) {var tgin = e.item();
  //         if (tgin.name === task_name) {tg.DeleteChild(tgin);dbgv("Deleted existing tab group")};}
  //       tg_res = tg.AddChildGroup(task_name);
  //       dbgv("Adding a new tab group" +task_name+"	"+tg.folder+" "+ tg_res);tabGroups.Save();
  //     };
  //   }
  //   if (!found) {dbgv("No dir PrefixDir found, creating a new one: " + sV.get('PrefixDir'));
  //     var tg_dir_res = tabGroups.AddChildFolder(sV.get('PrefixDir'));
  //     if (tg_dir_res)	{tg_res = tg_dir_res.AddChildGroup(task_name); dbgv("tg_res child =" + tg_res)
  //     } else         	{tg_res = tabGroups .AddChildGroup(task_name); dbgv("tg_res nopar =" + tg_res)
  //       err("Failed to create a tab group dir ¦" + sV.get('PrefixDir') + "¦, will be saving without one...");}
  //   }
  // } else {dbgv("saving without a prefix ¦" + task_name + "¦");
    for (var e = new Enumerator(tabGroups); !e.atEnd(); e.moveNext()) {var tg = e.item();
      if ( task_name         === tg.name
        || task_name_pre_re.test(tg.name)) {tabGroups.DeleteChild(tg);dbgv("deleted old " + tg.name);break;};
    }
    tg_res = tabGroups.AddChildGroup(task_name);
  // }

  if (tg_res) {dbgv("filling up a new group ¦" + task_name + "¦" + " with current Lister tabs ");
    tg_res.desc = "backup.TabGroupSave🕘 on " + cur_date_time;
    tg_res.closeexisting = sV.get('CloseOthers');
    if (L.dual) { tg_res.dual = true;
      var tabList = L.tabsleft;  var tg_tabs = tg_res.lefttabs;
      for (var e=new Enumerator(tabList);!e.atEnd();e.moveNext()) {var tab = e.item(); tg_tabs.AddTab(tab.path);}
      var tabList = L.tabsright; var tg_tabs = tg_res.righttabs;
      for (var e=new Enumerator(tabList);!e.atEnd();e.moveNext()) {var tab = e.item(); tg_tabs.AddTab(tab.path);}
    } else {
      var tabList = L.tabs; var tg_tabs = tg_res.tabs;
      if (tabList){for (var e=new Enumerator(tabList);!e.atEnd();e.moveNext()) {var tab = e.item(); tg_tabs.AddTab(tab.path);}}
    }
    tabGroups.Save();
  } else {err("Failed to create a new tab group to save tabs to " + task_name);}
  }
}

function cfgUpdate(D) { // Read user config to update script vars or set defaults if config is blank
  // ConfigChangeData from OnScriptConfigChange
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create;

  var dbg_out = "cfgUpdate|End|: №" + D.count;
  for (var e = new Enumerator(D); !e.atEnd(); e.moveNext()) {var cfgv = e.item();
    if (cfgv === 'Period' && sC[cfgv] != sV.get(cfgv)) { dbgv("Updating 🕘timer period")
      DOpus.KillTimer(345);
      DOpus.SetTimer (345, sV.get('Period') * 60 * 1000);
    }
    if ({}.hasOwnProperty.call(sC,cfgv)) { //Object.prototype.hasOwnProperty; 'y' in x checks inherited; sC.hasOwnProperty fails
      dbg_out += " " + cfgv + "=¦" + sC[cfgv] +"¦ ← ¦"+ sV.get(cfgv) +"¦ ≝¦"+ sV.get(cfgv+"≝") +"¦";
      sV.set(cfgv, sC[cfgv]);
    }
  }
  dbg(dbg_out);
}
