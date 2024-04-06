// Include file script for Directory Opus, gpsoft.com.au/DScripts/redirect.asp?page=scripts
function OnInitIncludeFile(D) { // Called by Directory Opus to initialize the include file script
  D.name   	= "Cfg";
  D.desc   	= "Config helper";
  D.version	= "2.0";
  D.url    	= "https://resource.dopus.com/t/helper-confighelper-easier-config-item-handling/19129";
  D.shared 	= true; D.min_version = "13.0"; D.copyright = "tbone / es";
}

function ConfigHelper(data) { //v2.0@24-04-04
  var t=this; t.data=data; t.cfg=data.config; t.cd=DOpus.Create.Map(); t.cg=DOpus.Create.Map();
  t.add = function(name,val,des) { // add config item
    t.l = {orig : name, lower : name.toLowerCase()};
    return t.val(val).des(des);}
  t.des = function(des) { if (!des) {return t;} // set the description
    if (t.cd.empty) {t.data.config_desc = t.cd;}
    t.cd(t.l.orig) = des;
    return t;}
  t.g = function(g) { if (!g) {return t;} // set config group
    if (t.cg.empty) {t.data.config_groups = t.cg;}
    t.cg(t.l.orig) = g;
    return t;}
  t.val = function(val) { // set the default value, if it's a new empty vector, following calls to val() add items to it
    var l = t.l;
    if (l.v !== l.x && typeof(l.v) == "object")	{l.v.push_back(val);
    } else                                     	{l.v=t.cfg[l.orig]=val;}
    return t;}
  t.trn = function() {return t.des(t("script.config."+t.l.lower));} // fetches and sets a language specific description (need translator to use this one)
} //resource.dopus.com/t/helper-confighelper-easier-config-item-handling/19129
