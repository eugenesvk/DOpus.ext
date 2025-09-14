@include inc_std.js
@include inc_dbg.js
@include inc_cfg.js
// Column.AttrShort, ↑ must be at the very top, before comments; save as 'UTF-8 with BOM'
// learn.microsoft.com/en-us/windows/win32/fileio/file-attribute-constants
//    1  	flag_r_read_only               	// apps can read the file, but cannot write to it or delete it. Not honored on directories
//   32  	flag_a_archive                 	// apps typically use this attribute to mark files for backup or removal
//    2  	flag_h_hidden                  	// not included in an ordinary directory listing
//    4  	flag_s_system                  	// OS uses a part of, or uses exclusively
//  256  	temporary                      	F  ×Opus× signals to FS to avoid writing to disk
//  512  	sparse                         	F  ×≝Opus +custom× sparse file
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
  D.desc          	= "Column formatted with shorter attribute indicators (no '-'), reverse 'i' shown when content indexing is enabled, and smaller symbols ₐ vs a"
   +"\n"          	+ "(click ⚙ to configure)";
  D.version       	= "1.1@24-04";
  D.url           	= "";
  D.default_enable	= true; D.min_version = "12.5"; D.copyright = "es";

  var C = new ConfigHelper(D);
  C.add("a"          	).val("ₐ"  	).g('Replace'	).des('Replace Archive attribute with...');
  C.add("c"          	).val("c"  	).g('Replace'	).des('Replace Compressed attribute with...');
  C.add("e"          	).val("ₑ"  	).g('Replace'	).des('Replace Encrypted attribute with...');
  C.add("h"          	).val("ₕ"  	).g('Replace'	).des('Replace Hidden attribute with...');
  C.add("i"          	).val("ⁱ"  	).g('Replace'	).des('Replace Indexed attribute with...');
  C.add("o"          	).val("ₒ"  	).g('Replace'	).des('Replace Offline attribute with...');
  C.add("p"          	).val("ₚ"  	).g('Replace'	).des('Replace Pinned attribute with...');
  C.add("r"          	).val("r"  	).g('Replace'	).des('Replace Readonly attribute with...');
  C.add("s"          	).val("ₛ"  	).g('Replace'	).des('Replace System attribute with...');
  C.add("t"          	).val("t"  	).g('Replace'	).des('Replace Temporary attribute with...');
  C.add("sp"         	).val("S"  	).g('Replace'	).des('Replace Sparse attribute with...');
  C.add("DebugOutput"	).val(false	).g('  Debug'	).des('Enable debug output in the "Script log"');
}

function OnScriptConfigChange(configChangeData) { configUnits(); }

var colNmAttr = 'Attributes'
function OnAddColumns(addColD) {
  configUnits();
  var col = addColD.AddColumn();
  col.name     	= colNmAttr;
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
  if (!itemAttr)   	{return}
  var itemAttrShort	= itemAttr.ToString().replace(/\-/g, '');
  var myAttr       	= DOpus.FSUtil.NewFileAttr(itemAttrShort); //need own FileAttr to allow changes
  var subMap       	= sV.get('subMap');
  if (myAttr.i)    	{ myAttr.Clear('i');
  } else           	{ myAttr.Set  ('i');}
  var myAttrShort  	= myAttr.ToString().replace(/\-/g, '');
  for (var e=new Enumerator(subMap); !e.atEnd(); e.moveNext()) {src = e.item(); sub = subMap(src);
    if (myAttrShort.indexOf(src) > -1) {myAttrShort = myAttrShort.replace(src,sub);}  }
  if (scriptColD.columns.exists(colNmAttr)) {
    scriptColD  .columns       (colNmAttr).value = myAttrShort;}
    // dbg("" + itemAttr + " less '" + excludeAttr + "'='" + myAttrShort + "'@" + scriptColD.item);}
}

function configUnits() { // Read user config and save on config updates with a callback
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create;
  var subMap = DC.Map();
  subMap("a") = sC.a;
  subMap("c") = sC.c;
  subMap("e") = sC.e;
  subMap("h") = sC.h;
  subMap("i") = sC.i;
  subMap("o") = sC.o;
  subMap("p") = sC.p;
  subMap("r") = sC.r;
  subMap("s") = sC.s;
  subMap("t") = sC.t;
  subMap("sp") = sC.sp;
  sV.set("subMap", subMap);
  dbg("configUnits|End|: subMap="+map2str(subMap));
}
