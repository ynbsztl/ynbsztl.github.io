---
layout: single
title: "PDF reader"
permalink: /packages/pdf-reader/
author_profile: true
description: "PDF reader for macOS: features, keyboard shortcuts, installation, and download."
---

[← Packages]({{ '/packages/' | relative_url }})

A customized macOS PDF reader based on [Skim](https://skim-app.sourceforge.io/), with a recent-reading list, chapter bookmarks, a page overview, text and LaTeX annotations, and full-screen slide presentations.

**Platform:** Apple silicon (M1 or later), macOS 12 or later  
**Release:** October 22, 2026 (revision 6) · **Download size:** 10.7 MB

<p>
  <a class="btn btn--primary" href="{{ '/files/packages/PDF-reader-2026.10.22-r6-arm64.dmg' | relative_url }}" download="PDF-reader-2026.10.22-r6-arm64.dmg">Download PDF reader for Mac</a>
</p>

### Features

- Resume recently read PDFs from the home screen. Closing a PDF no longer returns to the home screen automatically.
- Browse embedded chapter bookmarks and all-page thumbnails.
- Return to your previous reading position with the floating button in the lower-left corner, restoring the page, scroll position, and zoom.
- Highlight selected text with **Control + Command + H**, or underline it with **Control + Command + U**.
- Add text with **Control + Command + T**, with font and size controls, a transparent background, and a thin caret. Each activation places one text box, then returns to ordinary text selection.
- Insert LaTeX equations with an automatic offline preview, then double-click to edit the source later. No LaTeX installation is required.
- Embed annotations in the PDF by default, or turn off **Embed annotations (嵌入批注)** to use separate notes. Pasted text also uses a transparent background.
- Preserve text and equation layout in other PDF readers with fixed vector appearances. Text and equations remain editable in PDF reader; other readers treat them as stamp annotations.
- Present slides from the current page with **Command + L** or the toolbar button. Use the arrow keys to change pages; press **Esc** or **Command + L** to return to reading.

### Latest update

This release fixes formulas becoming faint or showing raw LaTeX in PDF Expert, as well as Chinese text appearing as boxes in other renderers. It also includes single-use text placement and a thinner insertion caret.

To update annotations in an existing PDF, open it in this version, keep **Embed annotations (嵌入批注)** enabled, and save once with **Command + S**. Close and reopen the file in the other reader to see the updated appearance.

### Installation

Quit an older running copy with **Command + Q** before upgrading. Open the downloaded disk image and drag **PDF reader** to **Applications**. This build is for Apple silicon Macs; it does not include an Intel version.

This independently compiled build is not signed with an Apple Developer ID or notarized by Apple. If macOS blocks the first launch, follow [Apple's instructions for opening an app from an unidentified developer](https://support.apple.com/102445). Installation instructions are also included in the disk image.

### Credits

Customized by **Tianlei Zhang**, with **GPT-6.1 Sol** as an AI coding collaborator. Based on **Skim 1.7.17**, distributed under its BSD license. Original author credits, third-party acknowledgments, and license notices are retained in the app.
