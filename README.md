

```
 _   _ _  __ _        ______           _ _ _         
| \ | (_)/ _| |       | ___ \         | (_) |        
|  \| |_| |_| |_ _   _| |_/ /___  __ _| |_| |_ _   _ 
| . ` | |  _| __| | | |    // _ \/ _` | | | __| | | |
| |\  | | | | |_| |_| | |\ \  __/ (_| | | | |_| |_| |
\_| \_/_|_|  \__|\__, \_| \_\___|\__,_|_|_|\__|\__, |
                  __/ |                         __/ |
                 |___/                         |___/ 

This is not a test app repo, it's a movement
```

### How to run
 - Install NodeJS (https://nodejs.org/en/) and Git (https://git-scm.com/download/win)
 - run the following (this will clone the repo, install node dependencies, compile/watch for file changes, start a localhost server)
     ```sh
    git clone https://github.com/TrevorDev/niftyRealityTestApps
    cd niftyRealityTestApps
    npm install
    npm start
    ```
 - Go to https://reality.niftykick.com/new?debugApp=http://localhost:5000/dist/helloWorld.js
 - If it worked you should see a fox spinning on a box
 - The main code is found in helloWorld.ts
 - Modify that code to change the fox/box position and refresh the webpage to test
 - If anything doesn't work join our discord and we'll be happy to help!

### How to provide feedback or ask questions
 - Join the NiftyKick discord (https://niftykick.com/)

### Supported devices
 - Currently only tested on Quest

### TODO (A bunch of features are missing, and api may change)
 - Input handling (Allow apps to know if a ray hit their app)
 - Control lighting of parent world
 - Guides for BabylonJS, ThreeJS and other renderers