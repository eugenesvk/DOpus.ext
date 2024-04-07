@include inc_std.js
@include inc_dbg.js
@include inc_cfg.js
// Column.SizeFormat, ↑ must be at the very top, before comments; save as 'UTF-8 with BOM'
  // EnEm¦Figure¦Punctuation¦Thin¦Hair (jkorpela.fi/chars/spaces.html)
  // ¦n¦m¦1¦.¦t¦h¦
  // ¦ ¦ ¦ ¦ ¦ ¦ ¦

var iterate = null;

function OnInit(D) {
  D.name          	= "Column.SizeFormat";
  D.desc          	= "Columns formatted with shorter size indicators";
  D.version       	= "1.0@18-10";
  D.url           	= "";
  D.default_enable	= true; D.min_version = "12.5"; D.copyright = "es";

  var sV=D.vars, sC=D.config, DC=DOpus.Create, Sys=DC.SysInfo, C=new ConfigHelper(D);
  C.add("BinaryMultiplier"  	).val(false	).g('Misc').des("??READ FROM CONFIG?? Display size as Binary (2¹⁰=1024), otherwise Decimal (10³=1000)");
  C.add("DebugOutput"       	).val(false	).g('Misc').des('Enable debug output in the script console ("Other" log)\nAdds "¦" alignment symbol and replaces decimal point spacePunctuation pad with "."');
  C.add("ColumnHeaderFolder"	).val('🗁'  	).g('Title').des('Column Header symbol for a Folder');
  C.add("ColumnHeaderFile"  	).val('📁'  	).g('Title').des('Column Header symbol for a File');
  C.add("ColumnHeaderLink"  	).val('🔗'  	).g('Title').des('Column Header symbol for a SoftLink');
  C.add("LinkMark"          	).val('🔗'  	).g('Misc').des('Place this mark to the left of size value if it includes softlinks, e.g. "🔗5 M" means that some of that "5 M" is occupied by softlinks');
  C.add("spacePadnLabel").g('Format').des('# of spaces to pad each SizeLabel with + SizeLabel: ×En×Em×Number×Punctuation×Thin×Hair+SizeLabel\ne.g. "000001+b" for 1×Hair space and "b" for bytes, label can be blank').
    val(DOpus.Create.Vector()).
    val("000000+").
    val("000012+k").
    val("000000+M").
    val("000100+G").
    val("000011+T").
    val("000101+P").
    val("000011+E").
    val("000101+Z").
    val("000101+Y"); //order should match vars.spaceList
  C.add("spaceCommon").g('Format').des('A common separator between a number and a SizeLabel, e.g. "10_M"\nChoose one of different space symbols').
    val(DOpus.Create.Vector()).
    val(5).
    val("spaceM").
    val("spaceN").
    val("spaceNumber").
    val("spacePunc").
    val("spaceThin").
    val("spaceHair").
    val("NoSpace"); //order should match vars.spaceList
  C.add("spacePadFont").g('Format').des('Pre-set space pad values for a specific font and labels (kMGTPEZY). "Custom" reads values from "spacePadnLabel" config variable (SizeLabels are read there for each font)').
    val(DOpus.Create.Vector()).
    val(2).
    val("Custom").
    val("Cambria").
    val("SegoeUI").
    val("Palatino"); //order should match vars.fontList

// var spaceList = DC.vector('spaceM', 'spaceN', 'spaceNumber', 'spacePunc', 'spaceThin', 'spaceHair', 'NoSpace');
// dbg(sC.spaceCommon(0));
}

function OnScriptConfigChange(configChangeData) { configUnits(); }

function OnAddColumns(addColData) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create, Sys=DC.SysInfo;
  configUnits();

  var col = addColData.AddColumn();
  col.name     	= "SizeNoLink";
  col.method   	= "OnColShallowNoLinks";
  col.label    	= "Size.No SoftLinks";
  col.header   	= "🗛✗" + sC.ColumnHeaderLink;
  // col.type  	= "size"; //default to plain text
  col.defsort  	= -1; //sort 🗛
  col.justify  	= "right";
  col.autogroup	= true;
  col.multicol 	= true;

  var col = addColData.AddColumn();
  col.name     	= "SizeNoLinkRec";
  col.method   	= "OnColRecursiveNoLinks";
  col.label    	= "Size.No SoftLinks (Rec)";
  col.header   	= "🗛✗" + sC.ColumnHeaderLink + "Rec";
  // col.type  	= "size";
  col.defsort  	= -1;
  col.justify  	= "right";
  col.autogroup	= true;
  col.multicol 	= true;

  var col = addColData.AddColumn();
  col.name     	= "SizeWithLink";
  col.method   	= "OnColShallowWithLinks";
  col.label    	= "Size.With SoftLinks";
  col.header   	= "🗛";
  // col.type  	= "size";
  col.defsort  	= -1;
  col.justify  	= "right";
  col.autogroup	= true;
  col.multicol 	= true;

  var col = addColData.AddColumn();
  col.name     	= "SizeWithLinkRec";
  col.method   	= "OnColRecursiveWithLinks";
  col.label    	= "Size.With SoftLinks (Rec)";
  col.header   	= "🗛 Rec";
  // col.type  	= "size";
  col.defsort  	= -1;
  col.justify  	= "right";
  col.autogroup	= true;
  col.multicol 	= true;

  var col = addColData.AddColumn();
  col.name     	= "SizeOnlyLinkRec";
  col.method   	= "OnColRecursiveDelta";
  col.label    	= "Size.Only SoftLinks (Rec)";
  col.header   	= "🗛" + sC.ColumnHeaderLink + "Rec";
  // col.type  	= "size";
  col.defsort  	= -1;
  col.justify  	= "right";
  col.autogroup	= true;
  col.multicol 	= true;
}

function OnColShallowWithLinks  	(colD)	{ OnColMain(colD, false, true , false);}
function OnColShallowNoLinks    	(colD)	{ OnColMain(colD, false, false, false);}
function OnColRecursiveWithLinks	(colD)	{ OnColMain(colD, true , true , false);}
function OnColRecursiveNoLinks  	(colD)	{ OnColMain(colD, true , false, false);}
function OnColRecursiveDelta    	(colD)	{ OnColMain(colD, true , true , true );}
function OnColMain(colD, IsRecursive, IsLinks, IsOnlyLinks) {
  var isRec           	= (IsRecursive ? "Rec" : ""),
      isLnk           	= (IsLinks ? "WithLink" : "NoLink"),
      colName         	= "Size" + isLnk + isRec,
      colOnlyName     	= "SizeOnlyLink" + isRec,
      item            	= colD.item;
      isJunctionOrLink	= (item.attr & 1024) != 0;
      mark            	= "",
      totalFiles      	= 0,
      fileSize        	= DOpus.FSUtil.NewFileSize(0),
      folderSize      	= DOpus.FSUtil.NewFileSize(0),
      fileSizeLink    	= DOpus.FSUtil.NewFileSize(0),
      folderSizeLink  	= DOpus.FSUtil.NewFileSize(0),
      dbg("——————————\nitem = colD.item = " + item + "{" + item.size + "}");

  if (!item.is_dir) { //file
    if (IsLinks) { //resolve softlinks
      fileItem = DOpus.FSUtil.GetItem(DOpus.FSUtil.Resolve(item.RealPath,"j")); //Resolve symlink bug
      fileSize = fileItem.size
      if (isJunctionOrLink && IsOnlyLinks) { fileSizeLink = fileSize;}
      // if (isJunctionOrLink) { mark = sC.LinkMark;} //Mark only folders, files can be marked  within DOpus config
      // dbg("File: isJunctionOrLink=" + isJunctionOrLink);
    } else {
      fileItem = item;
      // fileSize = item.size; //return size as is, due to a bug(?) returns zero for softlinks
      if (isJunctionOrLink) { //replaced the line above to allow empty file size field for softlinks
        fileSize = "";
      } else {
        fileSize = item.size;
      }
    }
    if (colD.columns.exists(colName)) {
      colD.columns(colName).sort 	= fileSize;
      colD.columns(colName).value	= mark + formatBytes(fileSize);
      dbg("File: fileItem {fileSize} = " + fileItem + " {" + fileSize +"}/IsRecursive{" + IsRecursive + "}/IsLinks{" + IsLinks + "}");
    }
    if (colD.columns.exists(colOnlyName)) {
      colD.columns(colOnlyName).sort 	= fileSizeLink;
      colD.columns(colOnlyName).value	= mark + formatBytes(fileSizeLink);
      dbg("FileOnlyLinks: fileItem {fileSizeLink} = " + fileItem + " {" + fileSizeLink +"}/IsRecursive{" + IsRecursive + "}/IsLinks{" + IsLinks + "}/IsOnlyLinks" + IsOnlyLinks);
    }
  }
  if (item.is_dir) { // && ( IsLinks || (!IsLinks && !isJunctionOrLink) ) check for "folder unless Junction with IsLinks option disabled" moved to function
    iterate = 0;
    readFolderSize(item, IsRecursive, IsLinks, IsOnlyLinks);
    if (colD.columns.exists(colName)) {
      colD.columns(colName).sort 	= folderSize;
      colD.columns(colName).value	= mark + formatBytes(folderSize);
      dbg("Folder: item {folderSize} = " + item + " {" + folderSize +"}/IsRecursive{" + IsRecursive + "}/IsLinks{" + IsLinks + "}");
    }
    if (colD.columns.exists(colOnlyName)) {
      colD.columns(colOnlyName).sort 	= folderSizeLink;
      colD.columns(colOnlyName).value	= mark + formatBytes(folderSizeLink);
      dbg("FolderOnlyLinks: item {folderSizeLink} = " + item + " {" + folderSizeLink +"}/IsRecursive{" + IsRecursive + "}/IsLinks{" + IsLinks + "}/IsOnlyLinks" + IsOnlyLinks);
    }
  }
}

function configUnits() { //Read user config to
  // 1) set unit labels (e.g. b or B for bytes)
  // 2) set type and number of spaces to pad each unit with (e.g. two Hair spaces for 'k')
  var sV = Script.vars, sC = Script.config, DC = DOpus.Create,
    spaceM = ' ', spaceN = ' ',
    NoSpace = '', spaceHair = ' ', spaceThin = ' ', spacePunc = ' ', spaceNumber = ' ',
    spaceTH = spaceThin + spaceHair, spacePH = spacePunc + spaceHair;
  sV.set("k"          	, (sC.BinaryMultiplier == true) ? 1024 : 1000);
  sV.set("dmPad"      	, DC.vector( 0,  2,  2,  2,  2,  2,  2,  2,  2 )); //# of digits to pad to
  sV.set("dmLow"      	, DC.vector( 0,  1,  2,  2,  2,  2,  2,  2,  2 )); //# of decimals for low
  sV.set("dmHigh"     	, DC.vector( 0,  0,  1,  2,  2,  2,  2,  2,  2 )); //        high values
  sV.set("dmThreshold"	, DC.vector(10, 10, 10, 10, 10, 10, 10, 10, 10 ));
  sV.set("sizeLabel"  	, DC.vector('b','k','M','G','T','P','E','Z','Y'));
  sV.set("spacePad"   	, DC.vector('', spaceTH+spaceHair, '', spacePunc, spacePunc, spacePunc+spacePunc, spaceTH, spacePH, spacePH));
  sV.set("spaceList"  	, DC.vector(spaceM, spaceN, spaceNumber, spacePunc, spaceThin, spaceHair, NoSpace ));
  sV.set("spaceCommon"	, sV.get("spaceList")(sC.spaceCommon));
  sV.set("fontList"   	, DC.vector("Custom","Cambria","SegoeUI","Palatino"));
  sV.set("padSym"     	, spaceNumber);                             	//Pad for fractional digits
  sV.set("padSymDec"  	, (0 || sC.DebugOutput) ?  '.' : spacePunc);	//Pad for decimal point
  sV.set("padAlign"   	, (0 || sC.DebugOutput) ?  '¦' : '');       	//Post-symbol pre-# vertical bar

  //                                b       k        M         G       T         P       E         Z
  var fontCambria 	= DC.vector("000000","000012","000000","000100","000011","000101","000011","000101","000101"); // ascending from bytes to Y
  var fontSegoeUI 	= DC.vector("000000","000020","000000","000100","000003","000101","000020","000011","000101");
  var fontPalatino	= DC.vector("000000","000020","000000","000002","000101","000101","000004","000011","000011");
  var spacePadMap = DOpus.Create.Map();
      spacePadMap("Cambria")      	= fontCambria;
      spacePadMap("SegoeUI")      	= fontSegoeUI;
      spacePadMap("Palatino")     	= fontPalatino;
  var fontCfg                     	= sV.get("fontList")(sC.spacePadFont);
  if (spacePadMap.exists(fontCfg))	{var isFontPreset = true ;dbg('configUnits spacePadMap(sV.get("fontList")(sC.spacePadFont))(1) = ' + spacePadMap(fontCfg)(1) + "|" + fontCfg);
  } else                          	{var isFontPreset = false;p('Predefined font map spacePadMap(' + fontCfg + ') not found. Using Custom values from spacePadnLabel');
  }

  var dbgPadLabel = "";
  var spacePadCfg = sC.spacePadnLabel; //convert '000012+k' to spaces and 'k'
  for (var i = 0; i < spacePadCfg.count; i++) {
    var matches = spacePadCfg(i).match(/^\d+\+/i);
    if (matches === null || matches.toString().length  !== 7) {
      DOpus.Output("configUnits|ERROR|: spacePadnLabel must be 6 numbers and '+'! ERROR@line" + (i+1) + "={" + spacePadCfg(i) + "}");
      return ''
    }
    var p = spacePadCfg(i).indexOf('+');
    // dbg("spacePadConvert: i=" + i + ", spacePadCfg(i)={" + spacePadCfg(i) + "}");
    if (p == -1) {
      DOpus.Output("configUnits|ERROR|: Missing '+' in spacePadnLabel! ERROR@line" + (i+1) + "={" + spacePadCfg(i) + "}");
      return ''
    }
    var tempPad = "";
    for (var m = 0; m < p; m++) {
      if (isFontPreset)	{tempPad += StringUtil.repeat(sV.get("spaceList")(m), spacePadMap(fontCfg)(i)[m]);
      } else           	{tempPad += StringUtil.repeat(sV.get("spaceList")(m), spacePadCfg         (i)[m]);}
      // dbg("spacePadConvert: m=" + m + ", spacePadCfg(i)[m]={" + spacePadCfg(i)[m] + "}, sV.get(spaceList)(m){" + sV.get("spaceList")(m) + "}, spacePad so far ={" + tempPad + "}");
    }
    sV.get("spacePad" )(i) = tempPad;
    sV.get("sizeLabel")(i) = spacePadCfg(i).substring(p+1, spacePadCfg(i).count);
    // dbg("spacePadConvert: sV.get(sizeLabel)(i)={" + sV.get("sizeLabel")(i) + "}");
    if (0 || sC.DebugOutput) {
      if (isFontPreset)	{dbgPadLabel += spacePadMap(fontCfg)(i) + spacePadCfg(i).substring(p) + "→¦" + sV.get('spacePad')(i) + sV.get('sizeLabel')(i) + "¦ "
      } else           	{dbgPadLabel +=                           spacePadCfg(i)              + "→¦" + sV.get('spacePad')(i) + sV.get('sizeLabel')(i) + "¦ "
      }
    }
  }
  if (isFontPreset)	{dbg("configUnits|End|: spacePadMap(fontCfg)+spacePadCfg/label/→¦spacePad sizeLabel¦ = " + dbgPadLabel);
  } else           	{dbg("configUnits|End|: spacePadCfg→¦spacePad sizeLabel¦ = " + dbgPadLabel);}
  dbg("configUnits|End|: spaceCommon = ¦" + sV.get("spaceCommon") + "¦");
}

function decimalPad(dec,len,chr,chrDec) {
  chr = chr || '0'; chrDec = chrDec || '.';
  dec = dec.toString();

  if (!len) return dec;

  var p = dec.indexOf('.');
  p = (p!==-1 ? (dec.length-p-1) : -1);

  for (var m = p; m < len; m++) {dec += (m==-1) ? chrDec : chr;}  //If no decimal point fount add a special space of the same width
  return dec;
}

function formatBytes(bytes,decimals) {
  var sV=Script.vars, sC=Script.config, DC=DOpus.Create, Sys=DC.SysInfo;
  if(typeof(bytes) === "string") return bytes;
  // dbg("formatBytes: typeof(bytes) =" + typeof(bytes));
  if(bytes == 0) return '0';
  var dm       	= decimals <= 0 ? 0 : decimals || 2,
    k          	= sV.get("k"),
    i          	= Math.floor(Math.log(bytes) / Math.log(k)),
    n          	= parseFloat((bytes / Math.pow(k, i)).toFixed(dm)),
    dmPad      	= sV.get("dmPad"),
    padSym     	= sV.get("padSym"),
    padSymDec  	= sV.get("padSymDec"),
    padAlign   	= sV.get("padAlign"),
    spaceCommon	= sV.get("spaceCommon"),
    spacePad   	= sV.get("spacePad"),
    sizeLabel  	= sV.get("sizeLabel"),
    nPad       	= decimalPad(n, dmPad(i), padSym, padSymDec);
  // dbg("n = " + n + "|sizeLabel(i) ={" + sizeLabel(i) + "}");
  return nPad + padAlign + spacePad(i) + spaceCommon + sizeLabel(i);
}

function readFolderSize(folder, IsRecursive, IsLinks, IsOnlyLinks) { //!!CHOKES on 4k folder list
  var sV=D.vars, sC=D.config, DC=DOpus.Create, Sys=DC.SysInfo;
  if ( !IsLinks && isJunctionOrLink) { return; } //exclude softlinks when IsLinks is false
  if (0 || sC.DebugOutput) iterate++;
  var isParentSoftLink = null;
  if (IsLinks) {isParentSoftLink = (folder.attr & 1024) != 0;
    if (isParentSoftLink) { mark = sC.LinkMark; }  }
  var folderEnum = DOpus.FSUtil.ReadDir(folder, false);
  while (!folderEnum.complete) {
    var folderItem = folderEnum.next;
    if (!folderItem.is_dir) { //file
      if (IsLinks) { //add softlinks
        var isSoftLink = (folderItem.attr & 1024) != 0;
        if        (isSoftLink      )	{mark = sC.LinkMark; folderSizeLink.Add(folderItem.size)
        } else if (isParentSoftLink)	{mark = sC.LinkMark; folderSizeLink.Add(folderItem.size)}
        folderSize.Add(folderItem.size);
        dbg("++readFolderSizeFile: folderItem !folder&&IsLinks  {folderItem.size / folderSize} = \n" + folderItem + "{" + folderItem.size +"}/{" + folderSize + "}");
        // totalFiles++;
      } else { //exclude softlinks
        var  isSoftLink = (folderItem.attr & 1024) != 0;
        if (!isSoftLink)  {folderSize.Add(folderItem.size);dbg("++readFolderSizeFile: folderItem !folder&&!IsLinks&&!Link  {folderItem.size / folderSize} = \n" + folderItem + "{" + folderItem.size +"}/{" + folderSize + "}");}
        dbg("readFolderSizeFl✗Links: folderItem !folder&&!IsLinks&&Link  {folderItem.size / folderSize} = \n" + folderItem + "{" + folderItem.size +"}/{" + folderSize + "}");
        // totalFiles++;
      }
    } else { //folder, pass through the same function unless it's a softlink
      if   ( IsLinks   ) {readFolderSize(folderItem, IsRecursive, IsLinks, IsOnlyLinks); //add softlinks
        dbg("readFolderSize.Fold|Rec: folderItem folder&&IsLinks  iterate{folderSize} = \n" + iterate + "|" +folderItem + "{" + folderSize + "}");
        // totalFiles++;
      } else { //exclude softlinks
        var isSoftLink = (folderItem.attr & 1024) != 0;
        if (!isSoftLink) {readFolderSize(folderItem, IsRecursive, IsLinks, IsOnlyLinks); dbg("readFolderSize.Fold|Rec: folderItem folder&&!IsLinks&&!Link  iterate{folderSize} = \n" + iterate + "|" + folderItem + "{" + folderSize + "}");}
        dbg("readFolderSize.Fold|✗Links: folderItem folder&&!IsLinks&&Link  {folderSize} = \n" + iterate + "|" + folderItem + "{" + folderSize + "}");
      }
    }
  }
  return folderSize
}

var StringUtil = {
  repeat: function(str, times) {return (new Array(parseInt(times) + 1)).join(str);}  //StringUtil.repeat("&nbsp;", 3);
  //other related string functions...
}
//Help
  // item.attr & 1024 is FILE_ATTRIBUTE_REPARSE_POINT from https://docs.microsoft.com/en-gb/windows/desktop/FileIO/file-attribute-constants: A file or directory that has an associated reparse point, or a file that is a symbolic link
