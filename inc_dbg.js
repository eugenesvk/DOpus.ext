// Include file script for Directory Opus, gpsoft.com.au/DScripts/redirect.asp?page=scripts
function OnInitIncludeFile(D) { // Called by Opus to initialize the include file script
  D.name   	= "Dbg";
  D.desc   	= "Debug functions";
  D.version	= "1.0";
  D.url    	= "resource.dopus.com/c/buttons-scripts/16";
  D.shared 	= true; D.min_version = "12.0"; D.copyright = "es";
}

function p(text) { // alias to print output
  try        	{ if (Script); DOpus.Output(text     );
  } catch (e)	{              DOpus.Output(text,true);}
}
function err(text) { // alias to print error output
  try        	{ if (Script); DOpus.Output(text,true);
  } catch (e)	{              DOpus.Output(text,true);}
}
function dbg(text) { // print debug output if script is configured with DebugOutput
  try {
    if (Script);
    if (0 || Script.config.DebugOutput) DOpus.Output(text      );
  } catch (e) {                         DOpus.Output(text, true);}
}
function dbgv(text) { // print verbose debug output if script is configured with DebugVerbose
  try {
    if (Script);
    if (0 || Script.config.DebugVerbose) DOpus.Output(text      );
  } catch (e) {                          DOpus.Output(text, true);}
}
