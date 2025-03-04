import * as vscode from "vscode";
import simpleGit, { SimpleGit } from "simple-git";
import * as path from "path";
import * as fs from "fs";
import { get } from "http";

async function getTrackTonicRepoPath(): Promise<string | undefined> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage("No open directories");
        return undefined;
    } else if (folders.length === 1) {
        return path.join(folders[0].uri.fsPath, "tracktonic");
    } else {
        const pick : string | undefined = await vscode.window.showQuickPick(
            folders.map((folder) => folder.uri.fsPath),
            {placeHolder: "Select a folder tot store the TrackTonic repository"}
        );
        
        if (pick) {
            return path.join(pick, "tracktonic");
        }
        return undefined;
    }
    
}


export class GitService {
    private repoPath: string | undefined;
    private git : SimpleGit;
    private commitInterval: NodeJS.Timeout | undefined;
    private changesMade: boolean = false;

    constructor() {
        this.initialize();
    }
    
    private async initialize() {
        this.repoPath = await getTrackTonicRepoPath();
        if (!this.repoPath) {
            throw new Error("Track tonic repository path is undefined");
        }
        
        await this.ensureTrackTonicRepo();
        this.git = simpleGit(this.repoPath);
    }

    private async authenticateGithub(): Promise<string | undefined> {
        try {
            const session = vscode.authentication.getSession('github', ["repo"], { createIfNone: true});
            return (await session).accessToken;
        } catch (error) {
            vscode.window.showErrorMessage("Authentication failed");
            return undefined;
        }
    }

    private async ensureTrackTonicRepo() {
        if (!this.repoPath) {
            return;
        }
        if (!fs.existsSync(this.repoPath)) {
            fs.mkdirSync(this.repoPath);
            vscode.window.showInformationMessage(`Created tracktonic repository at ${this.repoPath}`);
        }

        if (!fs.existsSync(path.join(this.repoPath, ".git"))) {
            const git = simpleGit(this.repoPath);
            await git.init();
            vscode.window.showInformationMessage("Initialized tracktonic git repository");
        }
    }

    async checkGitStatus(): Promise<boolean> {
        this.changesMade = false;
        try {
            const status = await this.git.status();
            this.changesMade = status.files.length > 0;
        } catch (error) {
            vscode.window.showErrorMessage("Error checking git status.");
        }
        return this.changesMade;
    }

    async handleCommit() : Promise<void> {
        console.log("we are trying to commit now");
        let reposCommitted = 0;
        try {
            const status = await this.git.status();
            if (status.files.length > 0) {
                await this.git.add(".");
                await this.git.commit("Working on git commit message for later use");

                const token = await this.authenticateGithub().catch(() => {
                    vscode.window.showErrorMessage("Cannot push without authentication");
                    return;
                });
                console.log(token);
                const remoteURL = `https://${token}@github.com/hala201/tracktonic.git`;
                const remotes = await this.git.getRemotes();
                if (!remotes.some((remote) => {
                    return remote.name === "origin";
                })) {
                    console.log("tracktonic was node aded before");
                    await this.git.addRemote("origin", remoteURL);
                    vscode.window.showInformationMessage("Successfully authenticated into repository.")
                } else {
                    console.log("tracktonic was added before!");
                }

                await this.git.push("origin",  "main");
                vscode.window.showInformationMessage("Changes pushed to tracktonick");
                console.log("pushed changes to tracktonic");
                reposCommitted++;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Git commit failed`);
        }
        
        if (reposCommitted > 0) {
            vscode.window.showInformationMessage(`Auto-committed changes to ${reposCommitted} repos`);
        }
        this.changesMade = false; //reset
    }

    startAutoCommit(interval: number): void {
        if (this.commitInterval) {
            this.stopAutoCommit();
        }
        vscode.workspace.onDidChangeTextDocument(() => {
            this.changesMade = true;
        });

        this.commitInterval = setInterval(async () => {
            if (await this.checkGitStatus()) {
                await this.handleCommit();
            }
        }, interval);
        vscode.window.showInformationMessage(`Auto-commits started every ${interval / 1000}`);
    }

    stopAutoCommit(): void {
        if (this.commitInterval) {
            clearInterval(this.commitInterval);
            this.commitInterval = undefined;
        }
        this.changesMade = false;
        vscode.window.showInformationMessage("Auto-commits were disabled");
    }

    getCommitInterval(): number {
        const config = vscode.workspace.getConfiguration("tracktonic");
        return config.get<number>("commitInterval", 30000); // Default: 5 minutes
    }
}
