import * as vscode from "vscode";
import simpleGit, { SimpleGit } from "simple-git";
import * as path from "path";
import * as fs from "fs";
import { get } from "http";
import axios from "axios";

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
            console.log("checking git status");
        } catch (error) {
            vscode.window.showErrorMessage("Error checking git status.");
        }
        return this.changesMade;
    }

    async handleCommit(): Promise<void> {
        console.log("Trying to commit now...");
        let reposCommitted = 0;
    
        try {
            const status = await this.git.status();
    
            if (status.files.length > 0) {
                await this.git.add(".");
    
                // Ensure there's at least one commit
                const logSummary = await this.git.log().catch(() => null);
                if (!logSummary || logSummary.total === 0) {
                    console.log("Creating the first commit...");
                    await this.git.commit("Initial commit for TrackTonic");
                } else {
                    await this.git.commit("Automated commit from TrackTonic");
                }
    
                const token = await this.authenticateGithub();
                if (!token) {
                    vscode.window.showErrorMessage("Cannot push without authentication");
                    return;
                }
                const githubUsername = "hala201";  // Replace with dynamic username if needed
                const repoName = "myremote";
                const remoteURL = `https://${token}@github.com/${githubUsername}/${repoName}.git`;

                //  Check if the repository exists on GitHub
                const repoExists = await this.checkIfRepoExists(githubUsername, repoName, token);
                if (!repoExists) {
                    console.log("Repository does not exist. Creating it now...");
                    const created = await this.createGithubRepo(githubUsername, repoName, token);
                    if (!created) {
                        vscode.window.showErrorMessage("Failed to create GitHub repository.");
                        return;
                    }
                } else {
                    console.log("Repository exists. Proceeding...");
                }
                    
    
                // Check if the "origin" remote exists and set it correctly
                const remotes = await this.git.getRemotes(true);
                const originRemote = remotes.find(remote => remote.name === "origin");
    
                if (!originRemote) {
                    console.log("Adding remote: origin -> " + remoteURL);
                    await this.git.addRemote("origin", remoteURL);
                    vscode.window.showInformationMessage("Successfully authenticated into repository.");
                } else if (originRemote.refs.push !== remoteURL) {
                    console.log("Origin exists but URL is different. Updating...");
                    await this.git.removeRemote("origin");
                    await this.git.addRemote("origin", remoteURL);
                } else {
                    console.log("Origin was already correctly set.");
                }
    
                // Ensure "master" branch exists locally
                const branches = await this.git.branch();
                if (!branches.all.includes("master")) {
                    console.log("Creating and switching to master branch...");
                    await this.git.checkoutLocalBranch("master");
                } else {
                    console.log("Switching to master branch...");
                    await this.git.checkout("master");
                }
    
                // Fetch remote branches to check if "origin/master" exists
                await this.git.fetch();
                const remoteBranches = await this.git.branch(["-r"]);
                const remoteMasterExists = remoteBranches.all.includes("origin/master");
    
                // If remote "master" doesn't exist, push with "-u" to create and track it
                if (!remoteMasterExists) {
                    console.log("Remote 'master' branch does not exist. Pushing with -u...");
                    await this.git.push("origin", "master", ["-u"]);
                } else {
                    console.log("Remote 'master' branch exists. Pushing normally...");
                    await this.git.push("origin", "master");
                }
    
                vscode.window.showInformationMessage("Changes pushed to TrackTonic.");
                console.log("Pushed changes to TrackTonic.");
                reposCommitted++;
            }
        } catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Git commit failed: ${error.message}`);
            }
            console.error(error);
        }
    
        if (reposCommitted > 0) {
            vscode.window.showInformationMessage(`Auto-committed changes to ${reposCommitted} repos`);
        }
        this.changesMade = false; // Reset
    }
    
    private async checkIfRepoExists(username: string, repoName: string, token: string) {
        try {
            const repo = await axios.get(`https://api.github.com/repos/${username}/${repoName}`, 
                {headers : {Authorization : `token ${token}`}}
            );
            console.log(repo.status);
            return repo.status === 200;
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.log(404);
                return false;
            }
            vscode.window.showErrorMessage(`Error checking if repo exists ${error.message}.`);
            return false;
        }
    }

    private async createGithubRepo(username: string, repoName: string, token: string) {
        try {
            const newRepo = await axios.post(`https://api.github.com/user/repos`, {
                name: repoName,
                private: false
            }, {
                headers: {Authorization: `token ${token}`}
            });
            if (newRepo.status === 201) {
                vscode.window.showInformationMessage(`Repository ${repoName} was created successfully`);
                return true;
            } 
        } catch (error) {
            vscode.window.showErrorMessage(`An error occured while creating repository.`);
            return false;
        }
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
