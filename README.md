# MiMic - The YouTube Horror Co-Viewer

Our Chromium extension lets you watch digital horror, analog horror, etc., YouTube projects that your favorite horror commentators cover alongside their witty barbs. When viewing a video from one of the curated channels - or from a list of your own! - MiMic finds the appropriate YouTube source link in the description and offers to open it in a small, muted, and optionally minimized window.

---

## How It Works

1. **Activation**: The extension activates automatically when you navigate to a YouTube watch page on a Desktop device.
2. **Channel Check**: It checks if the video's creator is on your personal list of approved channels (configurable in the extension's options).
3. **Link Parsing**: If the channel is approved, MiMic parses the video description to find the first valid YouTube video, playlist, or channel link.
4. **Confirmation**: A dialog appears over the page, asking if you want to open the found link as a "MiMic video".
5. **Window Creation**: After clicking "Yes", the link opens in a new, small popup window (15% of your screen size). The video can be set to mute, allowing you to comfortably continue watching the main, commentator video alongside the source material. The pop up window can also be set to minimize after 10 seconds.

Note that we decided to rely on YouTube video metadata versus YouTube API endpoints to populate key identifiers, values, etc., harnessed by the extension. You might call such an approach brittle - we call it clever.

## Features

- **Customizable Channels**: Manage your own list of approved channels via the extension's options page.
- **User Control**: The confirmation dialog gives you control over whether the MiMic video is muted or minimized on a per-video basis.
- **Persistent Playback**: The MiMic video will not automatically pause when the window is minimized or loses focus.
- **Respects User Input**: Deliberately pausing, playing, or muting the MiMic video via the YouTube UI works as expected and is not overridden by the extension.
- **Handles All Link Types**: Correctly processes variations of `watch?v=`, `/playlist/`, `youtu.be/`, `/c/`, `/user/`, `@channel`, and vanity links found in YouTube video descriptions from select accounts.
- **Finetuned Source Material Detection Process**: Accurately singles out the subject matter from a YouTube video description. Commentators can also include a special indicator, `⧸`, before a link in the description to preselect the source material to open!

## Installation

Install via the Chrome Extension store, or:

1. Download the extension files to a folder on your computer.
2. Open your Chromium-based browser (Chrome, Edge, Brave, etc.) and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click the **Load unpacked** button.
5. Select the folder where you saved the extension files.

## Project Files

| File | Purpose |
| :--- | :--- |
| `manifest.json` | Configures the extension, its permissions, and scripts. |
| `background.js` | Service worker that creates and manages the MiMic popup window. |
| `content.js` | The core logic that runs on YouTube pages to find and process links. |
| `keep-playing.js` | Injected into the MiMic window to ensure continuous playback. |
| `options.html` | The user interface for the extension's options page. |
| `options.js` | Handles saving and validating the approved channels list. |
| `options.css` | Styles the options page. |

## Default Approved Channels

The following channels are approved by default. This list can be edited at any time from the extension's options page. Want to suggest a commentator or add your channel? Email us a dissemiotic [at] gmail!

| Handle | Channel |
| :--- | :--- |
| `/@halfbrewed` | [Halfbrewed](https://www.youtube.com/@halfbrewed) |
| `/@nexpo` | [Nexpo](https://www.youtube.com/@nexpo) |
| `/@soupysoupx` | [Soupysoupx](https://www.youtube.com/@soupysoupx) |
| `/@bazamalam` | [Bazamalam](https://www.youtube.com/@bazamalam) |
| `/@emortalmarcus` | [Emortalmarcus](https://www.youtube.com/@emortalmarcus) |
| `/@sodagirl` | [Sodagirl](https://www.youtube.com/@sodagirl) |
| `/@muldered` | [Muldered](https://www.youtube.com/@muldered) |
| `/@dissemiotic` | [Dissemiotic](https://www.youtube.com/@dissemiotic) |
| `/@wowmanzz` | [Wowmanzz](https://www.youtube.com/@wowmanzz) |
| `/@seedbutter` | [Seedbutter](https://www.youtube.com/@seedbutter) |
| `/@4plus419` | [4plus419](https://www.youtube.com/@4plus419) |
| `/@nightmind` | [Nightmind](https://www.youtube.com/@nightmind) |
| `/@wendigoon` | [Wendigoon](https://www.youtube.com/@wendigoon) |
| `/@antthonygallego` | [Antthonygallego](https://www.youtube.com/@antthonygallego) |
| `/@minaxa` | [Minaxa](https://www.youtube.com/@minaxa) |
| `/@catman_vhs` | [Catman_vhs](https://www.youtube.com/@catman_vhs) |
| `/@crowmudgeon` | [Crowmudgeon](https://www.youtube.com/@crowmudgeon) |
| `/@tmetal2854` | [Tmetal2854](https://www.youtube.com/@tmetal2854) |
| `/@mythonics` | [Mythonics](https://www.youtube.com/@mythonics) |
| `/@reapestrella` | [Reapestrella](https://www.youtube.com/@reapestrella) |
| `/@danielprofeta` | [Danielprofeta](https://www.youtube.com/@danielprofeta) |
| `/@sunflower41xd` | [Sunflower41xd](https://www.youtube.com/@sunflower41xd) |
| `/@bdstudios8700` | [Bdstudios8700](https://www.youtube.com/@bdstudios8700) |
| `/@johnxwoodcat` | [Johnxwoodcat](https://www.youtube.com/@johnxwoodcat) |
| `/@codexcurse` | [Codexcurse](https://www.youtube.com/@codexcurse) |
| `/@thenightarchives4148` | [Thenightarchives4148](https://www.youtube.com/@thenightarchives4148) |
| `/@thathorrordude101` | [Thathorrordude101](https://www.youtube.com/@thathorrordude101) |
| `/@thatguyzanyt` | [Thatguyzanyt](https://www.youtube.com/@thatguyzanyt) |
| `/@m3owyt` | [M3owyt](https://www.youtube.com/@m3owyt) |
| `/@tedorate` | [Tedorate](https://www.youtube.com/@tedorate) |
| `/@abashortfilms` | [Abashortfilms](https://www.youtube.com/@abashortfilms) |
| `/@gearisko` | [Gearisko](https://www.youtube.com/@gearisko) |
| `/@jaybird160` | [Jaybird160](https://www.youtube.com/@jaybird160) |
| `/@nightmaremasterclass` | [Nightmaremasterclass](https://www.youtube.com/@nightmaremasterclass) |
| `/@gr33nmansam` | [Gr33nmansam](https://www.youtube.com/@gr33nmansam) |
| `/@drippyghost` | [Drippyghost](https://www.youtube.com/@drippyghost) |