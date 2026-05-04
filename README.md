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
[Halfbrewed](https://www.youtube.com/@halfbrewed) [https://www.youtube.com/@halfbrewed](https://www.youtube.com/@halfbrewed)
[Nexpo](https://www.youtube.com/@nexpo) [https://www.youtube.com/@nexpo](https://www.youtube.com/@nexpo)
[Soupysoup](https://www.youtube.com/@soupysoupx) [https://www.youtube.com/@soupysoupx](https://www.youtube.com/@soupysoupx)
[Baz](https://www.youtube.com/@bazamalam) [https://www.youtube.com/@bazamalam](https://www.youtube.com/@bazamalam)
[Emortalmarcus](https://www.youtube.com/@emortalmarcus) [https://www.youtube.com/@emortalmarcus](https://www.youtube.com/@emortalmarcus)
[Soda Girl](https://www.youtube.com/@sodagirl) [https://www.youtube.com/@sodagirl](https://www.youtube.com/@sodagirl)
[Muldered](https://www.youtube.com/@muldered) [https://www.youtube.com/@muldered](https://www.youtube.com/@muldered)
[Wowmanzz](https://www.youtube.com/@wowmanzz) [https://www.youtube.com/@wowmanzz](https://www.youtube.com/@wowmanzz)
[Seedbutter](https://www.youtube.com/@seedbutter) [https://www.youtube.com/@seedbutter](https://www.youtube.com/@seedbutter)
[4plus](https://www.youtube.com/@4plus419) [https://www.youtube.com/@4plus419](https://www.youtube.com/@4plus419)
[Night Mind](https://www.youtube.com/@nightmind) [https://www.youtube.com/@nightmind](https://www.youtube.com/@nightmind)
[Wendigoon](https://www.youtube.com/@wendigoon) [https://www.youtube.com/@wendigoon](https://www.youtube.com/@wendigoon)
[Antthony Gallego](https://www.youtube.com/@antthonygallego) [https://www.youtube.com/@antthonygallego](https://www.youtube.com/@antthonygallego)
[Minaxa](https://www.youtube.com/@minaxa) [https://www.youtube.com/@minaxa](https://www.youtube.com/@minaxa)
[Catman](https://www.youtube.com/@catman_vhs) [https://www.youtube.com/@catman_vhs](https://www.youtube.com/@catman_vhs)
[Crowmudgeon](https://www.youtube.com/@crowmudgeon) [https://www.youtube.com/@crowmudgeon](https://www.youtube.com/@crowmudgeon)
[TMetal](https://www.youtube.com/@tmetal2854) [https://www.youtube.com/@tmetal2854](https://www.youtube.com/@tmetal2854)
[Mythonics](https://www.youtube.com/@mythonics) [https://www.youtube.com/@mythonics](https://www.youtube.com/@mythonics)
[Reapestrella](https://www.youtube.com/@reapestrella) [https://www.youtube.com/@reapestrella](https://www.youtube.com/@reapestrella)
[Danielprofeta](https://www.youtube.com/@danielprofeta) [https://www.youtube.com/@danielprofeta](https://www.youtube.com/@danielprofeta)
[Sunflower](https://www.youtube.com/@sunflower41xd) [https://www.youtube.com/@sunflower41xd](https://www.youtube.com/@sunflower41xd)
[BD Studios](https://www.youtube.com/@bdstudios8700) [https://www.youtube.com/@bdstudios8700](https://www.youtube.com/@bdstudios8700)
[Johnxwoodcat](https://www.youtube.com/@johnxwoodcat) [https://www.youtube.com/@johnxwoodcat](https://www.youtube.com/@johnxwoodcat)
[Codexcurse](https://www.youtube.com/@codexcurse) [https://www.youtube.com/@codexcurse](https://www.youtube.com/@codexcurse)
[The Night Archives](https://www.youtube.com/@thenightarchives4148) [https://www.youtube.com/@thenightarchives4148](https://www.youtube.com/@thenightarchives4148)
[Thathorrordude101](https://www.youtube.com/@thathorrordude101) [https://www.youtube.com/@thathorrordude101](https://www.youtube.com/@thathorrordude101)
[Thatguyzan](https://www.youtube.com/@thatguyzanyt) [https://www.youtube.com/@thatguyzanyt](https://www.youtube.com/@thatguyzanyt)
[M3ow](https://www.youtube.com/@m3owyt) [https://www.youtube.com/@m3owyt](https://www.youtube.com/@m3owyt)
[Tedorate](https://www.youtube.com/@tedorate) [https://www.youtube.com/@tedorate](https://www.youtube.com/@tedorate)
[Abashortfilms](https://www.youtube.com/@abashortfilms) [https://www.youtube.com/@abashortfilms](https://www.youtube.com/@abashortfilms)
[Gearisko](https://www.youtube.com/@gearisko) [https://www.youtube.com/@gearisko](https://www.youtube.com/@gearisko)
[Jay Bird](https://www.youtube.com/@jaybird160) [https://www.youtube.com/@jaybird160](https://www.youtube.com/@jaybird160)
[Nightmare Masterclass](https://www.youtube.com/@nightmaremasterclass) [https://www.youtube.com/@nightmaremasterclass](https://www.youtube.com/@nightmaremasterclass)
[Gr33nManSam](https://www.youtube.com/@gr33nmansam) [https://www.youtube.com/@gr33nmansam](https://www.youtube.com/@gr33nmansam)
[Drippy Ghost](https://www.youtube.com/@drippyghost) [https://www.youtube.com/@drippyghost](https://www.youtube.com/@drippyghost)
[Gear ²](https://www.youtube.com/@gear2nd) [https://www.youtube.com/@gear2nd](https://www.youtube.com/@gear2nd)
[glitchwitch dot jpg](https://www.youtube.com/@gl1tchw1tch) [https://www.youtube.com/@gl1tchw1tch](https://www.youtube.com/@gl1tchw1tch)
