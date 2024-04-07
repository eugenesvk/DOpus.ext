@include inc_std.js
@include inc_dbg.js
@include inc_cfg.js
// cb.FilterToggleOnThemeΔ, ↑ must be at the very top, before comments; save as 'UTF-8 with BOM'

function OnInit(D) {
  var Sv=Script.vars, Sc=Script.config, DC=DOpus.Create, cmd=DC.Command();
  D.name          	= 'cb.FilterToggleOnThemeΔ';
  D.desc          	= 'Toggle Dark/Light variant of "Labels/Label Assignment" filter labels on Dark/Light Mode changes'
    +"\n"         	+ 'E.g., you have a filter label "Archives" that uses a color label "Archives Color"'
    +"\n"         	+ 'Add an extra pair: a filter label "Archives Dark" that uses a new color label "Archives Color Dark"'
    +"\n"         	+ 'Then configure "filters" with "Archives" and "posDark" with " Dark" (mind ␠)'
    +"\n"         	+ "(click ⚙ to configure)";
  D.version       	= '0.2@23-12';
  D.url           	= 'resource.dopus.com/t/automatic-toggle-of-filter-labels-on-dark-light-mode-switches/47615';
  D.default_enable	= true; D.min_version = '12.0'; var uid = "83fff09ad690443bb55247c8d767f021";

  var cfg = new ConfigHelper(D);
  cfg.add("DebugOutput"	).val(false                	).g("Debug"	).des('Enable debug output in the "Script log"');
  cfg.add("filters"    	).val(DC.vector("Archives")	).g("Misc" 	).des('Light mode filters (a list), e.g., "Archives"');
  cfg.add("posDark"    	).val(" Dark"              	).g("Misc" 	).des('Dark mode filter suffix, e.g., " Dark" to toggle "Archives Dark"\n(mind ␠ in the beginning if you use one!)');
}

function OnSystemSettingChange(SystemSettingChangeD) {
  if (!SystemSettingChangeD.type === "theme") {return;};
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create, cmd=DC.Command();
  var filters	= sC.filters; // Light mode filters
  var posDark	= sC.posDark; // Dark mode name variation (e.g., " Dark" to get "Archives Dark")

  var cmdPre = "Set ENABLELABELFILTER \"global:";
  var isDark = DC.SysInfo.DarkMode;
  if (isDark == true)	{var Dark = ",on\"" ; var Light = ",off\"";
  } else             	{var Dark = ",off\""; var Light = ",on\"" ;}
  cmd.Clear();
  for (var e = new Enumerator(filters); !e.atEnd(); e.moveNext()) {
    var filter = e.item();
    cmd.AddLine(cmdPre + filter           + Light);
    cmd.AddLine(cmdPre + filter + posDark + Dark );
    dbg        (cmdPre + filter           + Light);
    dbg        (cmdPre + filter + posDark + Dark );
  };
  cmd.Run();
}
