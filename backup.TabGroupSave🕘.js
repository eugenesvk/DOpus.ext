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
  var k='Period'      ;var v=sV.get(k);C.add(k).val(v).g(' Time'   ).des('Save all tabs once per this many minutes. ≝'+v);
  var k='MaxHistory'  ;var v=sV.get(k);C.add(k).val(v).g(' History').des('Save up to this many versions, each newer one has its index +1 incremented until MaxHistory, then starts from the beginning. ≝'+v);
  var k='PrefixDir'   ;var v=sV.get(k);C.add(k).val(v).g('Name'    ).des('Name of the folder to add a tab group to\n⚠Invalid symbols *:\"\\|<>/?^\n≝'+v);
  var k='PrefixFile'  ;var v=sV.get(k);C.add(k).val(v).g('Name'    ).des("Saved tab group name (with a time-based #index appended up to MaxHistory).\n⚠Deletes tab groups starting with 'PrefixFile #', so don't pick a name you use in other groups.\n⚠Invalid symbols *:\"\\|<>/?^\n≝"+v);
  var k='CloseOthers' ;var v=sV.get(k);C.add(k).val(v).g(' Misc'   ).des('Set "Close all other tabs" option. ≝'+v);
  var k='DebugOutput' ;var v=sV.get(k);C.add(k).val(v).g('  Debug' ).des('Enable debug output in the "Script log". ≝'+v);
  var k='DebugVerbose';var v=sV.get(k);C.add(k).val(v).g('  Debug' ).des('More verbose debug in the "Script log". ≝'+v);

  DOpus.KillTimer(345);
  DOpus.SetTimer (345, sV.get('Period') * 60 * 1000);
}

function setDefaults(D) {var sV=D.vars;
  sV.set('Period'      	,10        	 );
  sV.set('MaxHistory'  	,5         	 );
  sV.set('PrefixDir'   	,'Backup'  	 );
  sV.set('PrefixFile'  	,'TabGroup'	 );
  sV.set('CloseOthers' 	,true      	 );
  sV.set('DebugOutput' 	,false     	 );
  sV.set('DebugVerbose'	,false     	 );
  sV.set('idx'         	,0         	 );
}

function OnStartup (D) { //StartupData no props docs.dopus.com/doku.php?id=reference:scripting_reference:scripting_objects:startupdata
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create;
  var min_found = 1; // find at least this many "Empty Tab"s before triggering a restore
  if (findTabEmpty(min_found)) {
    if (min_found>1) {var mult = "s"} else {var mult = ""};
    dbg("⚠ Found ≥" +min_found+ " 'Empty Tab'" +mult+ ", restoring tabs from backup!")

    // backup current tabs before restoring just in case
    var tabGroups = DOpus.TabGroups;
    var listers = DOpus.listers; var i=0;
    var ts = new Date(); //Day+Mon (locale-aware) HH:MM
    var reg_repl_year = new RegExp('[\\/-]?'+ ts.getFullYear(),"gm");
    var hh = ts.getHours  (); if (hh < 10) {hh = " "+hh}
    var mm = ts.getMinutes(); if (mm < 10) {mm = " "+mm}
    var cur_date_time = ts.toLocaleDateString().replace(reg_repl_year,'') +' '+ hh +'꞉'+ mm; //: bugs since these are saved as files
    for (var li = new Enumerator(listers); !li.atEnd(); li.moveNext()) {var L = li.item(); i+=1;
      var task_name_prefix = 'L'+i+ sC.PrefixFile +' 0Startup';
      var task_name_pre_re = new RegExp(task_name_prefix +'.*',"gm");
      var task_name = task_name_prefix +' '+ cur_date_time;
      var tabGroups = DOpus.TabGroups;
      var tg_res;
      for (var e = new Enumerator(tabGroups); !e.atEnd(); e.moveNext()) {var tg = e.item();
        if ( task_name         === tg.name
          || task_name_pre_re.test(tg.name)) {tabGroups.DeleteChild(tg);dbgv("deleted old " + tg.name);break;};
      }
      tg_res = tabGroups.AddChildGroup(task_name);
      if (tg_res) {dbgv("filling up a new group ¦" + task_name + "¦" + " with current Lister tabs ");
        tg_res.desc = "backup.TabGroupSave🕘 on " + cur_date_time;
        tg_res.closeexisting = sC.CloseOthers;
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
    // find the latest group to restore from (only 1 lister is supported now)
    var i = 1; // use the first lister. TODO: restore all listers?
    var task_name_prefix = 'L'+i+ sC.PrefixFile +' 0Startup';
    var task_name_pre_re = new RegExp(task_name_prefix +'.*',"gm");
    for (var e = new Enumerator(tabGroups); !e.atEnd(); e.moveNext()) {var tg = e.item();
      if (task_name_pre_re.test(tg.name)) {
        var cmd = DOpus.Create.Command();
        cmd.AddLine('GO TABGROUPLOAD "' + tg.name + '" TABCLOSEALL=yes');
        var r = cmd.Run(); dbgv("Restoring tab group ‘" + tg.name + "’ status = " + r);
        cmd.Clear(); break;
      };
    }
  }
}

function findTabEmpty(min_found) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create;
  var listers = DOpus.listers; var i=0;
  var found = 0
  for   (var li = new Enumerator(listers); !li.atEnd(); li.moveNext()) {var L = li.item(); i+=1;
    for (var lr=0;lr<2;lr++) { var tabs = (lr==0) ? L.tabsright : L.tabsleft;
      for (var i=0;i<tabs.count;i++) { // no length for a generic collection
        dbg("tabs[i].path = " + tabs[i].path);
        if ((tabs[i].path+"") == "Empty Tab"); {
          found += 1; if (found >= min_found) {return true}
        }
      }
    }
  }
  if (found >=min_found) {return true}else{return false}
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
  var idx = Math.floor(sV.get('idx') % sC.MaxHistory) + 1;
  var pre_idx = ''; if (sC.MaxHistory > 9 && idx < 10) {pre_idx='0'}; //' ' fails, '10' is still sorted before ' 1'
  sV.set('idx', idx);
  var tabGroups = DOpus.TabGroups;

  var listers = DOpus.listers; var i=0;
  for (var li = new Enumerator(listers); !li.atEnd(); li.moveNext()) {var L = li.item(); i+=1;
  var ts = new Date(); //Day+Mon (locale-aware) HH:MM
  var reg_repl_year = new RegExp('[\\/-]?'+ ts.getFullYear(),"gm");
  var hh = ts.getHours  (); if (hh < 10) {hh = " "+hh}
  var mm = ts.getMinutes(); if (mm < 10) {mm = " "+mm}
  var cur_date_time = ts.toLocaleDateString().replace(reg_repl_year,'') +' '+ hh +'꞉'+ mm; //: bugs since these are saved as files
  var task_name_prefix = 'L'+i+ sC.PrefixFile +' '+ pre_idx + idx;
  var task_name_pre_no = 'L'+i+ sC.PrefixFile +' '+           idx; // delete old tasks when user had <10 max
  var task_name_pre_0  = 'L'+i+ sC.PrefixFile +' 00Latest';
  var task_name_pre_re = new RegExp(task_name_prefix +'.*',"gm");
  var task_name_pno_re = new RegExp(task_name_pre_no +'.*',"gm");
  var task_name_p0_re  = new RegExp(task_name_pre_0  +'.*',"gm");
  var task_name = task_name_prefix +' '+ cur_date_time;
  var task_name_0 = task_name_pre_0 +' '+ cur_date_time;
  var tg_res; var tg0;
  // ↓ todo: delete old task with the same prefix
  // if (sC.PrefixDir) {dbgv("saving with PrefixDir ¦" + sC.PrefixDir +"→"+ task_name +"¦");
  //   var found = false;
  //   for     (var e = new Enumerator(tabGroups); !e.atEnd(); e.moveNext()) {var tg   = e.item();
  //     if ((tg.folder) && (tg.name === sC.PrefixDir)) {found = true; dbgv("folder = " + tg.name);
  //       for (var e = new Enumerator(tg       ); !e.atEnd(); e.moveNext()) {var tgin = e.item();
  //         if (tgin.name === task_name) {tg.DeleteChild(tgin);dbgv("Deleted existing tab group")};}
  //       tg_res = tg.AddChildGroup(task_name);
  //       dbgv("Adding a new tab group" +task_name+"	"+tg.folder+" "+ tg_res);tabGroups.Save();
  //     };
  //   }
  //   if (!found) {dbgv("No dir PrefixDir found, creating a new one: " + sC.PrefixDir);
  //     var tg_dir_res = tabGroups.AddChildFolder(sC.PrefixDir);
  //     if (tg_dir_res)	{tg_res = tg_dir_res.AddChildGroup(task_name); dbgv("tg_res child =" + tg_res)
  //     } else         	{tg_res = tabGroups .AddChildGroup(task_name); dbgv("tg_res nopar =" + tg_res)
  //       err("Failed to create a tab group dir ¦" + sC.PrefixDir + "¦, will be saving without one...");}
  //   }
  // } else {dbgv("saving without a prefix ¦" + task_name + "¦");
    var c_del = 0; var del_max = 2; // delete at most 2 groups: latest and old under the same idx
    for (var e = new Enumerator(tabGroups); !e.atEnd(); e.moveNext()) {var tg = e.item();
      if ( task_name         === tg.name
        || task_name_pre_re.test(tg.name)
        || task_name_pno_re.test(tg.name)
        || task_name_p0_re .test(tg.name)
        ) {tabGroups.DeleteChild(tg);dbgv("deleted old " + tg.name);
          c_del+=1; if (c_del >= del_max) {break;}};
    }
    tg_res = tabGroups.AddChildGroup(task_name  );
    tg0    = tabGroups.AddChildGroup(task_name_0);
  // }

  if (tg_res && tg0) {dbgv("filling up new groups ¦" + task_name + "¦" + " and ¦"+ task_name_0 +"¦ with current Lister tabs ");
    tg_res.desc = "backup.TabGroupSave🕘 on " + cur_date_time;
    tg0   .desc = "backup.TabGroupSave🕘 on " + cur_date_time;
    tg_res.closeexisting = sC.CloseOthers;
    tg0   .closeexisting = sC.CloseOthers;
    if (L.dual) { tg_res.dual = true; tg0.dual = true;
      var tabList = L.tabsleft ; var tg_tabs = tg_res.lefttabs ; var tg0_tabs = tg_res.lefttabs ;
      for (var e=new Enumerator(tabList);!e.atEnd();e.moveNext()) {var tab = e.item(); tg_tabs.AddTab(tab.path); tg0_tabs.AddTab(tab.path);}
      var tabList = L.tabsright; var tg_tabs = tg_res.righttabs; var tg0_tabs = tg_res.righttabs;
      for (var e=new Enumerator(tabList);!e.atEnd();e.moveNext()) {var tab = e.item(); tg_tabs.AddTab(tab.path); tg0_tabs.AddTab(tab.path);}
    } else {
      var tabList = L.tabs; var tg_tabs = tg_res.tabs; var tg0_tabs = tg_res.tabs;
      if (tabList){for (var e=new Enumerator(tabList);!e.atEnd();e.moveNext()) {var tab = e.item(); tg_tabs.AddTab(tab.path); tg0_tabs.AddTab(tab.path);}}
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
      DOpus.SetTimer (345, sC.Period * 60 * 1000);
    }
    if ({}.hasOwnProperty.call(sC,cfgv)) { //Object.prototype.hasOwnProperty; 'y' in x checks inherited; sC.hasOwnProperty fails
      dbg_out += " " + cfgv + "=¦" + sC[cfgv] +"¦ ← ¦"+ sV.get(cfgv) +"¦ ≝¦"+ sV.get(cfgv) +"¦";
      sV.set(cfgv, sC[cfgv]);
    }
  }
  dbg(dbg_out);
}
