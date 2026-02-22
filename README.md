<br/>
<div align="center">
    <a href="https://github.com/chteau/FlowLuau">
        <img src="/public/README/banner.png" alt="Logo">
    </a>
    <div align="center">
        <img src="https://img.shields.io/badge/Luau-3057FD?style=for-the-badge&logo=lua&logoColor=white" alt="Luau Badge" />
        <img src="https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=white" alt="React Badge" />
    </div>
    <br>
    <p align="center">
        A visual scripting app for Roblox's luau, built in React and Next.
    </p>
    <br/>
</div>


> This is still a work in progress and a lot of nodes are missing for now.

### What I aim to do with this project

My goal with **FlowLuau** is to allow everyone to get into Roblox development. I'd really like to empower creators to build entire games without writing a single line of code.

### How it works
1. **Visual logic**: Basically, users connect specialized nodes together to define game behavior.
2. **Compilation**: The node graph is then translated intoluau bytecode.
3. **Deployment**: The logic is then exported as a `.luau` file ready to be used in Roblox Studio.

### The roadmap
1. **Core Luau Integration**
    - I'd like first to integrate a full suport for basic luau syntax (loops, tables, variables) via nodes, independent of the Roblox runtime.
2. **Roblox Engine Nodes**
    - Progressively implement Roblox-specific APIs (Instance manipulation, Events, Properties, etc...) to enable full game creation within the editor.
3. **FlowLuau Roblox Plugin**
    - A dedicated Roblox Studio plugin that uses **websockets** to sync the editor and studio in real-time. I know this is a huge bet but I'll do my best to implement all that in the end. This would allow for live workspace inspection and direct script injection without having to download files manually.
4. **Security & Production Readiness**
    - Hardening the API and ensuring the compiler produces clean and performant code.

### The future I see in this project
- **Open Source & Free Forever**: I'd really like to keep the core engine and source code open source and free for anyone who would like to self-host it.
- **Hosted Cloud Version**: I also plan to launch a hosted "Freemium" version to let users jump in without any setup while helping cover hosting and maintenance costs.

### Some early screenshots (02/22/2026)

![Dashboard](/public/README/Screenshot_2.png)

![New Project](/public/README/Screenshot_3.png)

![Editor](/public/README/Screenshot_1.png)

### Contributing
If you would like to contribute and help me finish this project for the community please do! I'd be really happy as I'm also working on other things at the same time. Also quick disclaimer, I did use AI to generate some comments and infer types mainly as well. The current codebase (as of 02/22/2026) is pretty early and needs to be organized properly, which can be a bit of a pain in the *ss to navigate through. Be sure I'll clean all that soon. Cheers :)
