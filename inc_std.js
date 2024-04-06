// Include file script for Directory Opus, gpsoft.com.au/DScripts/redirect.asp?page=scripts
function OnInitIncludeFile(D) { // Called by Opus to initialize the include file script
  D.name   	= "std";
  D.desc   	= "Std helper functions";
  D.version	= "0.1@23-12";
  D.url    	= "";
  D.shared 	= true; D.min_version = "13.0"; D.copyright = "es";
}

Array.prototype.has = function(obj) { // Extend array to check if it has a value
  var i = this.count;
  while (i--) {
    if (this[i] === obj) {return true;}
  }
  return false;
}
function vecHas(vec, val) { // TODO pending extension like ↑ https://resource.dopus.com/t/extend-vector-with-a-check-if-it-has-a-value/47622
  var i = vec.count;
  while (i--) {
    if (vec[i] === val) {return true;}  }
  return false;
}
function rm_vec_by_idx(vec_data, list_idx, reverse) { // remove vector elements based on a vector of indexes
  var data_len = vec_data.count;
  var i = list_idx.count;
  list_idx.sort();
  if (reverse) {list_idx.reverse(); while (i--)	{ // remove from the end to not shift indices
    if (list_idx[i] > data_len) {continue;} else {vec_data.erase((data_len - 1) - list_idx[i]);}  }
  } else       {while (i--)	{
    if (list_idx[i] > data_len) {continue;} else {vec_data.erase(                 list_idx[i]);}  }
  }
}
function trim_vec_start_to_max(vec, max) { // remove first vector elements to not exceed the Max # of elements
  i = vec.count;
  if (i>max) {
    var vec_trimmed = DOpus.Create.Vector()
    vec.assign(vec,i-max,i);
  }
}

function set2str(sset) {
  s = '';
  for (var e = new Enumerator(sset); !e.atEnd(); e.moveNext()) {
    s += e.item() + ' ';}
  return s
}
function map2str(map) { // add a length to split newline at
  s = '';
  for (var e = new Enumerator(map); !e.atEnd(); e.moveNext()) {
    s += e.item() + "→" + map(e.item()) + '\t';}
  return s
}
function vec2str(vec) { //todo: add separator
  var s = '';
  for (var i=0; i < vec.count; i++) {s += vec[i] + ' ';}
  return s
}

function T(t) {return DOpus.TypeOf(t)}
function getDate() {return DOpus.Create.Date().Format();}

