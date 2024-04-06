// Include file script for Directory Opus, gpsoft.com.au/DScripts/redirect.asp?page=scripts
function OnInitIncludeFile(D) { // Called by Opus to initialize the include file script
  D.name   	= "gui";
  D.desc   	= "GUI helper functions";
  D.version	= "0.1@24-04";
  D.url    	= "";
  D.shared 	= true; D.min_version = "13.0"; D.copyright = "es";
}

function guiConfirm(msg,title,icon) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create, Sys=DC.SysInfo;
  var Dlg = DOpus.Dlg; Dlg.template = "✓✗Confirm";
  Dlg.Create(); // create detached
  var c_msg   = Dlg.Control('msg');
  Dlg.title     = (typeof title	!== "undefined") ? title	: "Confirmation";
  c_msg.title   = (typeof msg  	!== "undefined") ? msg  	: "No message";
  Dlg.icon      = "question"; //todo bug, assign twice https://resource.dopus.com/t/dlg-icon-works-only-when-assigned-twice/50134
  Dlg.icon      = (typeof icon	!== "undefined") ? icon	: "question";
  var result = Dlg.RunDlg();
  if (!result) {return 0} else {return 1}
}

function vecItem2Idx(vec,reverse) { // convert a list of DialogListItems to a list of indices
  var ret = DOpus.Create.Vector();
  ret.reserve(vec.length);
  if (reverse)	{i = vec.length; while(        i--) {ret.push_back(vec[i].index);}
  } else      	{for (var i=0; i < vec.length; i++) {ret.push_back(vec[i].index);}}
  return ret;
}

==SCRIPT RESOURCES
<resources><resource name="✓✗Confirm" type="dialog">
<dialog fontsize="10" width="140" height="60" lang="english" resize="yes" title="Confirmation">
  <control close="0" default="yes"	name="btnN"	x=  "4"	width= "40"	y="44"	height="14"	resize="wsy"	title="✗&amp;Abort"  	type="button"/>
  <control close="1"              	name="btnY"	x= "96"	width= "40"	y="44"	height="14"	resize="wsy"	title="✓Con&amp;firm"	type="button"/>
  <control                        	name="msg" 	x=  "4"	width="134"	y= "2"	height="38"	            	title="Message"      		type="static" valign="center" halign="left"/>
</dialog></resource>
</resources>
