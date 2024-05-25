function OnInit(D) {
  D.name          	= 'ztest.Cmd';
  D.desc          	= "Test command";
  D.version       	= '';
  D.url           	= '';
  D.default_enable	= true; D.min_version = '12.0';

  //————————————————————————————————————————————————————————————————————————————————
  function ConfigHelper(data){ //v1.2 / 2015.05.27
    var t=this; t.d=data; t.c=data.config; t.cd=DOpus.Create.Map();
    t.add=function(name, val, des){ t.l={n:name,ln:name.
      toLowerCase()}; return t.val(val).des(des);}
    t.des=function(des){ if (!des) return t; if (t.cd.empty)
      t.d.config_desc=t.cd; t.cd(t.l.n)=des; return t;}
    t.val=function(val){ var l=t.l; if (l.v!==l.x&&typeof l.v=="object")
      l.v.push_back(val);else l.v=t.c[l.n]=val;return t;}
    t.trn=function(){return t.des(t("script.config."+t.l.ln));}}
  var cfg = new ConfigHelper(D);
  //resource.dopus.com/t/helper-confighelper-easier-config-item-handling/19129

  cfg.add("DebugOutput").des('Enable debug output in the "Script log"').
    val(false);
}

function OnAddCommands(addCmdD) {
  var cmd     	= addCmdD.AddCommand();
  cmd.name    	= 'JumpItemTest';
  cmd.method  	= 'OnJumpItemTest';
  cmd.desc    	= 'Jump to the Nth next item in the source (n=10 by default)';
  cmd.label   	= 'JumpItemTest';
  cmd.template	= 'by/n,nodeselect/s,select/s';
  cmd.icon    	= 'script';
  cmd.hide    	= false;
}

function OnJumpItemTest(scriptCmdD) {
  DOpus.Output('going down');
  var sh = new ActiveXObject("WScript.Shell");
  var key_down = "{DOWN}";
  sh.SendKeys(key_down);
}
