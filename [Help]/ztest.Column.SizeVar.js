function OnInit(initData) {
  initData.name           = "ztest.Column.Var";
  initData.desc           = "Columns test variables";
  initData.copyright      = "(C)";
  initData.url            = "";
  initData.version        = "1.0";
  initData.default_enable = true;
  initData.min_version    = "12.5"

  initData.config.DebugOutput = true;
  initData.config_desc = DOpus.Create.Map("DebugOutput", "Enable debug output")
  initData.config.TestVar = "TestVarValue";
  initData.config.TestVar2 = ["TestVar2-v1", "TestVar2-v2", "TestVar2-v3"];
  initData.config.TestVar3 = true;
}
function configUnits() {
  Script.vars.set("cfgTestVar", Script.config.TestVar);
  Script.vars.set("cfgTestVar2", Script.config.TestVar2);
  Script.vars.set("cfgTestVar3", Script.config.TestVar3);
  Script.vars.set("cfgTestVarMod", [Script.vars.get("cfgTestVar"), "Mod"]);
  Script.vars.set("cfgTestVarArray", ["cfgTestVarArray1", "cfgTestVarArray2"]);
  Script.vars.set("cfgTestVarModVec", DOpus.Create.vector('Script.vars.get("cfgTestVar")', "Mod"));
  Script.vars.set("dmPad", DOpus.Create.vector( 0, 2,  2,  2,  2,  2,  2,  2,  2 ));

  var newVector = DOpus.Create.vector( 0, 2,  2,  2,  2,  2,  2,  2,  2 );
  var newVector2 = DOpus.Create.vector();
  var newVector3 = newVector;
  newVector2.assign(newVector);
  // Debug(newVector3(1));

  Script.vars.set("dmPadCC", Script.vars.get("dmPad"));
}

function OnColumnsTestVar(scriptColData) {
  var item  = scriptColData.item;
  Debug("——————————\nitem = scriptColData.item = " + item + "{" + item.size + "}");

  Debug("configUnits: Script.vars.get(cfgTestVar-String)=" + Script.vars.get("cfgTestVar"));
  Debug("configUnits: Script.vars.get(cfgTestVar2-Array)=" + Script.vars.get("cfgTestVar2"));
  Debug("configUnits: Script.vars.get(cfgTestVar3-Bool)=" + Script.vars.get("cfgTestVar3"));
  Debug("configUnits: Script.vars.get(cfgTestVarMod_Array)=" + Script.vars.get("cfgTestVarMod"));
  Debug("configUnits: Script.vars.get(cfgTestVarArray)=" + Script.vars.get("cfgTestVarArray"));
  Debug("configUnits: Script.vars.get(cfgTestVarModVec)(1)=" + Script.vars.get("cfgTestVarModVec")(1));
  Debug("configUnits: Script.vars(dmPad)(1)=" + Script.vars("dmPad")(1));
  Debug("configUnits: Script.vars(dmPadCC)(1)=" + Script.vars("dmPadCC")(1));
  var vector = Script.vars.get("dmPad");
  Debug('configUnits: vector=Script.vars("dmPad")' + vector(1));

  // var enumVec = new Enumerator(Script.vars.get("cfgTestVarModVec"));
  // var enumVec = new Enumerator(DOpus.Create.vector("1", "2", "3"));
  // var enumVec = new Enumerator(["1", "2", "3"]);
  // enumVec.moveFirst();
  // Debug("configUnits: enumVec=" + enumVec.item(3));

}

function OnAddColumns(addColData) {
  configUnits();
  var col = addColData.AddColumn();
  col.name      = "SizeTestVar";
  col.method    = "OnColumnsTestVar";
  col.label     = "Size.TestVar";
  col.header    = "SizeTestVar";
  col.justify   = "right";
  col.autogroup = true;
  col.multicol  = true;
}
function OnScriptConfigChange() {
  configUnits();
}

function Debug(text) {
  try {
    if (Script);
    if (0 || Script.config.DebugOutput) DOpus.Output(text);
  } catch (e) {
    DOpus.Output(text);
  }
}
