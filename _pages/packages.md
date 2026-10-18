---
layout: single
title: "Packages"
permalink: /packages/
author_profile: true
description: "Software and tools by Tianlei Zhang, including PDF reader for macOS."
---

Software and tools for research and everyday use.

## PDF reader

A customized macOS PDF reader based on [Skim](https://skim-app.sourceforge.io/), with a recent-reading list, chapter bookmarks, a page overview, and text annotations.

**Platform:** Apple silicon (M1 or later), macOS 12 or later  
**Release:** October 16, 2026 · **Download size:** 9.7 MB

<p>
  <a class="btn btn--primary" href="{{ '/files/packages/PDF-reader-2026.10.16-arm64.dmg' | relative_url }}" download="PDF-reader-2026.10.16-arm64.dmg">Download PDF reader for Mac</a>
</p>

[SHA-256 checksum]({{ '/files/packages/PDF-reader-2026.10.16-arm64.dmg.sha256' | relative_url }})

### Features

- Resume recently read PDFs from the home screen.
- Browse embedded chapter bookmarks and all-page thumbnails.
- Highlight selected text with **Control + Command + H**, or underline it with **Control + Command + U**.
- Add text with **Control + Command + T**, with font and size controls.

### Installation

Open the downloaded disk image and drag **PDF reader** to **Applications**. This build is for Apple silicon Macs; it does not include an Intel version.

This independently compiled build is not signed with an Apple Developer ID or notarized by Apple. If macOS blocks the first launch, follow [Apple's instructions for opening an app from an unidentified developer](https://support.apple.com/102445). Installation instructions are also included in the disk image.

### Credits

Customized by **Tianlei Zhang**, with **GPT-6.1 Sol** as an AI coding collaborator. Based on **Skim 1.7.17**, distributed under its BSD license. Original author credits, third-party acknowledgments, and license notices are retained in the app.
