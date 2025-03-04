# backup.TabSetSave🕘.js
  - add global lock in case a command is invoked too fast, might corrupt saves?
# Column.SizeFormat.js
- ✗ can't be made performant due to JS overhead, v13's new evaluator scripts are too buggy currently, so can't replace either
- Simplify alignment by making the column left-aligned and lef-pad all numbers with " "/" "
- ?Add custom # of digits after decimals for various (dmThreshold)
- ?Add from avgscript counts and make custom sub-folder/file count columns (with/without/only softlinked) with shorter names using Unicode 🗀#📁📂🗁🗄
- ? Add a button that toggles 3 states: Size with links/without links/only links
- check that sizes are from Everything
- ? Add toggle between short version (1 MB) and long byte version (1000)
- Check format suggestions resource.dopus.com/t/folder-size-column-format-ideal-alignment/22403
- check isRecursive
- Features:
  - Make 'G+' bold
  - Color-code Unit Size Labels
  - Highlight difference between WithLinks and NoLinks with color instead of a symbol
  - Replace space-alignment of sizeLabels with a monospaced font
# backup.TabUndo.js
Issues / missing features due to DOpus or other limitations:
  - implement undo/redo selection:
    - (workaround via 1-sel-event granular undo even if it doesn't match user events that can include 2+) need to track track all events within a single user operation (e.g., select 5 items with one click+shift) [src](https://resource.dopus.com/t/listview-same-selection-index-despite-different-selection/50157/3)
    - (workaround via  timer) need to differentiate between real and artificial selection [src](https://resource.dopus.com/t/differentiate-between-script-and-real-selchange-events-in-custom-dialogs/50153)
    - prevent buffering so that releasing a held <kbd>u</kbd> key stops repeating undos immediately. Test for physical key down/up before executing?
    - focus is not reset on un/re-do as we don't get focus change events, so don't know what to restore to
  - make button shortcuts multilingual, use "physical keys" [src](resource.dopus.com/t/option-to-addhotkey-to-dialogs-as-physical-keys-for-international-layouts/50137)
  - clear history for all listers at once [src](https://resource.dopus.com/t/get-a-list-of-user-lister-layouts-to-delete-a-persisten-variable/50100)
  - add help tooltips to buttons/checkboxes [src](https://resource.dopus.com/t/script-dialog-control-tooltip/48353)
    - add help labels for single-key shortcuts `jkl;`
    - or small different colored overlapping labels for single key nav
  - way to just **DE**select (⎈␠ toggles, DOpus can't get an item with input focus (which could be used to deselect) [src](https://resource.dopus.com/t/get-listview-item-with-input-focus/50081))
  - formatting
    - disable window title and close buttons, window chrome resize border (could be done via AHK, but then will lead to "flashes of unstyled window")
    - manually sort user script vars [src](https://resource.dopus.com/t/easier-fields-for-script-configuration/49168/2)
    - make active listview's header bold [src](https://resource.dopus.com/t/dialog-listview-header-bold/50094)
    - remove ellipsis... on truncation of columns in listview
    - set width/height minimum, but still make resizable? [src](https://resource.dopus.com/t/make-dialog-editor-size-just-a-default-not-a-fix-minimum/50055)
    - with shared height can't resize listviews on creation [src](https://resource.dopus.com/t/shared-height-prevents-scripts-from-resizing-listviews/50072)
      - so bottom listview won't be resized with the dialog, will only move Y position as seen in the screenshot where resizing leads to the bottom listview moving on top of the top one instead of getting smaller

Nice to add:
  - copy paths from the listview as text
  - ? don't save dupes, but in a "smart" way:
    - if two tabs are opened and both are closed, store two
    - if one tab is opened closed and reopened, store it once at the last position
  - allow overriding more options via "cli args" so you could have a button to open just for the current lister's pane
  - add commands to toggle listviews top/bottom
  - optional vertical scrollbar for long lists
  - formatting
    - reformat dates instead of a single column so that times are vertically aligned even with different widths of `Today` and `Yesterday`
    - ?(no need since due to persistent vars this should be rare) update height of the two listviews so that if 1st is bigger, but 2nd is empty, the second is moved/resized
  - reopen tabs closer to their neighbors on multiple tabs with the same path (need saving extra data on neighbors)
  - allow user config of button accelerators
  - add checkboxes (user configurable)
  - ? search bar in case you get lost in your closed tabs
  - ? make neighbor search smarter: (when original neighbors are missing, so IDs don't match) currently opens near the first matching path even if originally there were 2. Save same path count and open at the same "count" at target?
  - ? show folder name as a separate column
  - ? add a blacklist of paths not to store (regex)
  - ? add a mark for user defined paths (some kind of favorites)
  - ? add a max limit of shown undo tabs in the list (or history limit is fine?)
