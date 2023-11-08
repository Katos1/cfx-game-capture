# FiveM Game Capture (Experimental)

This is an alternative resource to utk-render. UTK uses Three.js which is built on top of WebGL to create a rendering context, cfx-game-capture uses WebGL directly create a rendering context which is more lightweight.
It is a very basic version at the moment, you handle the start and stop by executing commands.
I am planning on continuing to work on this project and adding clean up of the game view, fixing the webm timeline bug and making it responsive.

**NOTE:** This is not a production ready resource.

## Settings

- Change the upload endpoint where all files get uploaded by setting the `uploadEndpoint` variable.
- You can change the framerate by adjusting the argument passed into `canvasElement.captureStream` function.

### Support
If you need any support you can reach out to me on discord.
