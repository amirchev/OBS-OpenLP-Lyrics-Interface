# OBS-OpenLP-Lyrics-Interface
This is a custom stage for OpenLP. It can be connected to OBS as a custom browser dock and browser source, allowing you to display lyrics that appear on your slides in OBS.

## Setup
### Adding the Custom Stage View
1. In OpenLP, make sure to enable the `Remote` plugin.
2. Go to the OpenLP data folder through via the menu in the program: `Tools -> Open Data Folder`. 
3. Create a folder called `stages`.
4. In this folder, create a new folder with the name of your new custom stage view. You can call it `stream`.
5. Extract the files from this repository into that folder.

### Setting up OBS
It would be beneificial to set up your presentation computer with a static IP to avoid having to constantly change the addresses in OBS, as the stage view URL will change if the computer's local IP changes. Assigning a static IP will not be covered in this guide.

1. In OpenLP, go to `Settings -> Configure OpenLP -> Remote`. Copy the 'Stage view URL'.
2. Add a custom Browser source in OBS to your desired scene, and paste the stage view URL there. Don't forget to add the name of the custom stage view. If you named your stage `stream`, then your URL will look something like this: `http://192.168.1.7:4316/stage/stream`. Note: your IP may be different than mine.
3. Add a custom browser dock by going to `View -> Docks -> Custom Browser Docks...` in OBS. Name the dock OpenLP Lyrics and paste the same URL that you had in the Browser source, but add `control.html` to it. E.g., `http://192.168.1.7:4316/stage/stream/control.html`.
4. Right click on your Browser source and go to `Transform -> Edit transform...`. I keep the size at 1920x200, and only display 2 lines of lyrics at a time. You can set it up however you see fit. Other transform properites include `Position: 960, 960`, `Positional Alignment: Center`, `Bouding Box Type: Scale to inner bounds`, `Alignment in Bounding Box: Center`.
5. Optionally, you can add a hotkey to hide/show the Browser source.

You're all done.

## Features
- Auto-show on slide change automatically displays the next slide, displaying the same number of lines as you have set on your **first** Display Next button. 
- Display all checkbox will automatically display all lines when auto-show is enabled.
- Undo display button if you would like to go to previous lyric. Only the last 5 lyrics are saved. Redo display to go forward in saved lyrics.

Please offer suggestions and feature requests here or the OBS forum. May God bless you through this software.

Amirchev
