# TrackTonic - Productivity Monitor for VSCode

## Overview
TrackTonic is a **VSCode extension** that automatically tracks and logs your coding activity by committing and pushing changes from all projects to a designated GitHub repository (`tracktonic`) every **30 minutes**.

This ensures you maintain a continuous activity log of your development sessions, helping with **productivity tracking** and **workflow analysis**.

## Features
- **Automatic Git commits** to a designated GitHub Repo every set interval, 30 minutes by default.
- **Secure authentication** with GitHub.
- **Multi-repository support** – works across all opened projects.
- **Intelligent commit messages** generated automatically.
- **Configurable commit intervals**.
- **Auto-creation of the `tracktonic` GitHub repository** if it doesn’t exist.
- **On-demand commit control** via VSCode commands.

## Installation
1. Open **VSCode**.
2. Go to **Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X` on macOS).
3. Search for `TrackTonic` and click **Install**.
4. Restart VSCode (if needed).

## Getting Started
Once installed, follow these steps:

1. **Initialize TrackTonic**:
   - Open any project in VSCode.
   - The extension will prompt you to choose a folder to store the `tracktonic` repository.
   - It will automatically create and initialize the repository.
   
2. **Authenticate with GitHub**:
   - When prompted, sign in with your GitHub account.
   - Your GitHub username will be securely stored.

3. **Start Auto-Commits**:
   - The extension will automatically commit and push changes every **30 minutes**.
   - You can configure the interval in VSCode settings (`tracktonic.commitInterval`).
   
4. **Check Activity Log**:
   - Visit your GitHub repository (`https://github.com/YOUR_USERNAME/tracktonic`) to view all commits.

## Commands
TrackTonic provides several commands that you can run in the **VSCode Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P` on macOS):

| Command | Description |
|---------|-------------|
| `TrackTonic: Start Auto-Commit` | Start tracking and committing changes automatically. |
| `TrackTonic: Stop Auto-Commit` | Pause automatic commits. |

## ⚙️ Configuration
You can modify TrackTonic settings in **VSCode Settings (`settings.json`)**:

```json
{
  "tracktonic.commitInterval": 1800000 // Default: 30 minutes (in milliseconds)
}
```

## Troubleshooting
**1. Authentication Issues**
   - Ensure you have the correct permissions (`repo` access).
   
**2. No Changes Being Tracked**
   - Ensure you have changes in your project.
   - Restart VSCode.
   
**3. GitHub Repository Not Found**
   - The extension will attempt to create the repo if it doesn’t exist.
   - You can manually create a `tracktonic` repository on GitHub.

## Contributing
Contributions are welcome! Open an issue or submit a pull request on GitHub.

## 📜 License
This project is licensed under the **MIT License**.

---
Enjoy coding with **TrackTonic** and stay productive! 