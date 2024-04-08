@include inc_std.js
@include inc_dbg.js
@include inc_cfg.js
function OnInit(D) {
  D.name          	= "Column.FileAccess";
  D.desc          	= "A column with file access status (read-write, read-only, no access)";
  D.version       	= "1.0";
  D.default_enable	= true; D.min_version = "12.5";
  var C = new ConfigHelper(D);
  C.add("ReadWrite"  	).val("✏"  	).g('Label'  	).des('Label for fully accessible files');
  C.add("ReadOnly"   	).val("👓"  	).g('Label'  	).des('Label for read-only files');
  C.add("NoAccess"   	).val("✗"  	).g('Label'  	).des('Label for inaccessible files');
  C.add("DebugOutput"	).val(false	).g('  Debug'		).des('Enable debug output in the "Script log"');
}

function OnAddColumns(addColD) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create;
  configUnits();
  var col = addColD.AddColumn();
  col.name     	= "File.ReadWriteStatus";
  col.method   	= "OnFileRWStatus";
  col.label    	= "File.ReadWriteStatus";
  col.header   	= "✏";
  col.justify  	= "right";
  col.autogroup	= true;
  col.match.push_back(sV.ReadWrite); col.match.push_back('ReadWrite'); // keywords for advanced find
  col.match.push_back(sV.ReadOnly) ; col.match.push_back('ReadOnly');
  col.match.push_back(sV.NoAccess) ; col.match.push_back('NoAccess');
}

function OnScriptConfigChange(configChangeD) { configUnits(); }

function OnFileRWStatus(colD) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create;
  var f, errOpen;
  if (colD.item.is_dir){return;}
  f = colD.item.Open("we","ElevateNoAsk"); errOpen = f.error; f.Close();
  if (errOpen == 0) {colD.value = sV.get('lblMap')('ReadWrite'); return;}
  f = colD.item.Open(""  ,"ElevateNoAsk"); errOpen = f.error; f.Close();
  if (errOpen == 0) {colD.value = sV.get('lblMap')('ReadOnly') ; return;}
  colD.value = sV.get('lblMap')('NoAccess');
}

function configUnits() { // Read user config and save on config updates with a callback
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create;
  var lblMap = DC.Map();
  lblMap("ReadWrite")	= sC.ReadWrite;
  lblMap("ReadOnly") 	= sC.ReadOnly;
  lblMap("NoAccess") 	= sC.NoAccess;
  sV.set("lblMap", lblMap);
  dbg("configUnits|End|: lblMap="+map2str(lblMap));
}
