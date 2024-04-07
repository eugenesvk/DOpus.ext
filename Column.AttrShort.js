@include inc_std.js
@include inc_dbg.js
@include inc_cfg.js
// Column.AttrShort, ↑ must be at the very top, before comments; save as 'UTF-8 with BOM'
// learn.microsoft.com/en-us/windows/win32/fileio/file-attribute-constants
//    1  	flag_r_read_only               	// apps can read the file, but cannot write to it or delete it. Not honored on directories
//   32  	flag_a_archive                 	// apps typically use this attribute to mark files for backup or removal
//    2  	flag_h_hidden                  	// not included in an ordinary directory listing
//    4  	flag_s_system                  	// OS uses a part of, or uses exclusively
// 2048  	flag_c_compressed              	// file: all of the data is compressed. dir: compression is the default for newly created files and subdirs
//16384  	flag_e_encrypted (exclusive  ↑)	// file: all data streams are encrypted. dir: encryption is the default for newly created files and subdirs
//       	???                            	//
// 8192  	flag_i_not_content_indexed     	// not to be indexed by the content indexing service.
//       	__                             	// ↓ not used in Attr column?
// 4096  	flag_o_offline_storage         	// data of a file is not available immediately. This attribute indicates that the file data is physically moved to offline storage. This attribute is used by Remote Storage, which is the hierarchical storage management software. Applications should not arbitrarily change this attribute
// 524288	flag_p_pinned                  	// user intent that the file or directory should be kept fully present locally even when not being actively accessed. For hierarchical storage management software
// 1024  	flag_l_reparse_point           	// file/dir that has an associated reparse point, or a symbolic link file

function OnInit(D) {
  D.name          	= "Column.AttrShort";
  D.desc          	= "Column formatted with shorter attribute indicators (no '-') and reverse 'i' that is only shown when content indexing is enabled";
  D.version       	= "1.0@18-10";
  D.url           	= "";
  D.default_enable	= true; D.min_version = "12.5"; D.copyright = "es";

  var C = new ConfigHelper(D);
  C.add("DebugOutput"	).val(false	).des('Enable debug output in the "Script log"');
  C.add("excludeAttr"	).val(""   	).des('Hide any attributes from "acehioprs" (Archive, Compressed, Encrypted, Hidden, Indexed, Offline, Pinned, Readonly, System)');
}

function OnScriptConfigChange(configChangeData) { configUnits(); }

function OnAddColumns(addColD) {
  configUnits();
  var col = addColD.AddColumn();
  col.name     	= "Attributes";
  col.method   	= "OnColMain";
  col.label    	= "Attributes.Short";
  col.header   	= "At";
  // col.type  	= "size";
  col.justify  	= "right";
  col.autogroup	= true;
  col.multicol 	= true;
}

function OnColMain(scriptColD) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create;
  var itemAttr     	= scriptColD.item.fileattr;
  if (!itemAttr)   	{ return }
  var itemAttrShort	= itemAttr.ToString().replace(/\-/g, '');
  var myAttr       	= DOpus.FSUtil.NewFileAttr(itemAttrShort); //need own FileAttr to allow changes
  var excludeAttr  	= sV.get("excludeAttr");
  if (myAttr.i)    	{myAttr.Clear("i");
  } else           	{myAttr.Set  ("i");}
  var myAttrShort  	= myAttr.ToString().replace(/\-/g, '');
  for (var i=0; i<excludeAttr.length; i++) {
    var sub = excludeAttr.substring(i,i+1);
    if (myAttrShort.indexOf(sub) > -1) {myAttrShort	= myAttrShort.replace(sub, '');
      // p("Removed excludeAttr.substring(i,i+1):{" + excludeAttr.substring(i,i+1) + "}");
    }
  }
  if (scriptColD.columns.exists("Attributes")) {scriptColD.columns("Attributes").value	= myAttrShort;
    dbg("" + itemAttr + " less '" + excludeAttr + "'='" + myAttrShort + "'@" + scriptColD.item);}
}

function configUnits() { //Read user config to
  var sV = Script.vars, sC = Script.config;
  sV.set("excludeAttr", sC.excludeAttr);
  dbg("configUnits|End|: excludeAttr = {" + sC.excludeAttr + "}");
}
