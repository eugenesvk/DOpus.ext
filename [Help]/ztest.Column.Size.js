function OnInit(initData) {
  initData.name           = "ztest.Column";
  initData.desc           = "Columns test";
  initData.copyright      = "(C)";
  initData.url            = "";
  initData.version        = "1.0";
  initData.default_enable = true;
  initData.min_version    = "12.5"

  initData.config.DebugOutput = true;
  initData.config_desc = DOpus.Create.Map("DebugOutput", "Enable debug output")
}

function OnAddColumns(addColData) {
  var col = addColData.AddColumn();
  col.name      = "SizeTest";
  col.method    = "OnColumnsTest";
  col.label     = "Size.Test";
  col.header    = "SizeTest";
  col.justify   = "right";
  col.autogroup = true;
  col.multicol  = true;
}


function readFolderSize(folder, IsRecursive, IsLinks) { //!!CHOKES on 4k folder list
  if ( !IsLinks && isJunctionOrLink) { return; } //exclude softlinks when IsLinks is false
  iterate++;
  var folderEnum = DOpus.FSUtil.ReadDir(folder, false);
  while (!folderEnum.complete) {
    var folderItem = folderEnum.next;
    if (!folderItem.is_dir) { //file
      if (IsLinks) { //add softlinks
        var isSoftLink = (folderItem.attr & 1024) != 0;
        folderSize.Add(folderItem.size);
        Debug("++readFolderSizeFile: folderItem !folder&&IsLinks  {folderItem.size / folderSize} = \n" + folderItem + "{" + folderItem.size +"}/{" + folderSize + "}");
      } else { //exclude softlinks
        var isSoftLink = (folderItem.attr & 1024) != 0;
        if (!isSoftLink) {
          folderSize.Add(folderItem.size);
          Debug("++readFolderSizeFile: folderItem !folder&&!IsLinks&&!Link  {folderItem.size / folderSize} = \n" + folderItem + "{" + folderItem.size +"}/{" + folderSize + "}");
        }
        Debug("readFolderSizeFl✗Links: folderItem !folder&&!IsLinks&&Link  {folderItem.size / folderSize} = \n" + folderItem + "{" + folderItem.size +"}/{" + folderSize + "}");
      }
    } else { //folder, pass through the same function unless it's a softlink
      if (IsLinks) { //add softlinks
        readFolderSize(folderItem, IsRecursive, IsLinks);
        Debug("readFolderSize.Fold|Rec: folderItem folder&&IsLinks  iterate{folderSize} = \n" + iterate + "|" +folderItem + "{" + folderSize + "}");
      } else { //exclude softlinks
        var isSoftLink = (folderItem.attr & 1024) != 0;
        if (!isSoftLink) {
          readFolderSize(folderItem, IsRecursive, IsLinks);
          Debug("readFolderSize.Fold|Rec: folderItem folder&&!IsLinks&&!Link  iterate{folderSize} = \n" + iterate + "|" + folderItem + "{" + folderSize + "}");
        }
        Debug("readFolderSize.Fold|✗Links: folderItem folder&&!IsLinks&&Link  {folderSize} = \n" + iterate + "|" + folderItem + "{" + folderSize + "}");
      }
    }
  }
  return folderSize;
}
function OnColumnsTest(scriptColData) { OnColumnsMain(scriptColData, true, true); }
function OnColumnsMain(scriptColData, IsRecursive, IsLinks) {
  var colName           = "SizeTest",
      item              = scriptColData.item;
      isJunctionOrLink  = (item.attr & 1024) != 0;
      totalFiles        = 0,
      fileSize          = DOpus.FSUtil.NewFileSize(0),
      folderSize        = DOpus.FSUtil.NewFileSize(0),
      Debug("——————————\nitem = scriptColData.item = " + item + "{" + item.size + "}");

  if (!item.is_dir) { //file
    if (IsLinks) { //resolve softlinks
      fileItem = DOpus.FSUtil.GetItem(DOpus.FSUtil.Resolve(item.RealPath,"j")); //Resolve symlink bug
      fileSize = fileItem.size
      // Debug("File: isJunctionOrLink=" + isJunctionOrLink);
    } else {
      fileItem = item;
      // fileSize = item.size; //return size as is, due to a bug(?) returns zero for softlinks
      if (isJunctionOrLink) { //replaced the line above to allow empty file size field for softlinks
        fileSize = "";
      } else {
        fileSize = item.size;
      }
    }
    if (scriptColData.columns.exists(colName)) {
      scriptColData.columns(colName).sort   = fileSize;
      scriptColData.columns(colName).value  = fileSize;
      Debug("File: fileItem {fileSize} = " + fileItem + " {" + fileSize +"}/IsRecursive{" + IsRecursive + "}/IsLinks{" + IsLinks + "}");
    }
  }
  if (item.is_dir) {
    iterate = 0;
    readFolderSize(item, IsRecursive, IsLinks);
    if (scriptColData.columns.exists(colName)) {
      scriptColData.columns(colName).sort   = folderSize;
      scriptColData.columns(colName).value  = folderSize;
      Debug("Folder: item {folderSize} = " + item + " {" + folderSize +"}/IsRecursive{" + IsRecursive + "}/IsLinks{" + IsLinks + "}");
    }
  }
}

function Debug(text) {
  try {
    if (Script);
    if (0 || Script.config.DebugOutput) DOpus.Output(text);
  } catch (e) {
    DOpus.Output(text);
  }
}
