This is a partial conversion of the JS-scripting formatted and aligned size column to avoid the per-item JS scripting overhead (at the cost of convenient user configuration and others issues, see below). 

This addresses many of the space wasting and misalignment issues of the default size columns

![Column.Size.ε vs ≝](../img/Column.Size.Format.S.png)

(with comments)
![Column.Size.ε vs ≝ (long)](../img/Column.Size.Format.L.png)

Some of the benefits for compactness and alignment
  - ⸱ tiny dot for 0 instead of wasting '0 bytes' for nothing
      - ⸱
      - 0 bytes
  - Byte values are "visually smaller" since they are positioned to the right of the decimal point, so you don't need `b` and `kb` labels
      - `  120` bytes
      - `4.12`  kb
      - ↑ also `12` in KB is aligned to `120` in bytes
-  Rounding doesn't break alignment, so 1 is vertically aligned
      - `1   ` MB
      - `1.01` MB
      - `   1` MB (default size column)
    (and 1.21 kb is not bigger than 123 kb)
- Different label width in proportional fonts doesn't break alignment, so 1 is vertically aligned (actual misalignment depends on your font)
  - M 1
  - G 1
- Rich text labels: bold and uppercased > **G** label to signal bigger size
  - Could also red-color > **T** for even more prominence?

A few limitations:
  - no background **size graph** as that feature is not implemented for evaluator columns
  - single-column version (value + label):
    - must be ‹left-aligned (it sidesteps the issue of aligning variable-width labels by left-aligning only numbers)
  - two-column version (value, label):
    - with column padding the total width is bigger vs the default size column
    - less efficient, 2 evaluator calls instead of 1
    - alternative: could remove one extra space at the end of the value column to save a bit of extra width, but then would lose the more valuable alignment of `123` b and `2.12` kb 

**To install**
  - copy file's content to clipboard
    - [Column.Size.Full.xml](../Evaluator/Column.Size.Full.xml) single-column value+label
    - [Column.Size.Format.xml](../Evaluator/Column.Size.Format.xml) two-column value
    - [Column.Size.Label.xml](../Evaluator/Column.Size.Label.xml) two-column label
  - open `Preferences / File Display Columns / Evaluator Columns`
  - click `Pas̲te`
  - add `Size.Full.ε` or `Size.ε` and `Size.Label.ε` columns to your folder format
    - tip: for two-column version try to position the label column to the left of the size column as then it might be a slightly more visible indicator of size given the background graphs are missing
