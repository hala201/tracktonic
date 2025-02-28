import * as vscode from "vscode";
import simpleGit, { SimpleGit } from "simple-git";
import * as path from "path";

export class GitService {
    private gits : SimpleGit[];
    private commitInterval: NodeJS.Timeout | undefined;
    private changesMade: boolean = false;

    constructor() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error("No workspace folder open.");
        }
        this.gits = workspaceFolders.map(folder => simpleGit(folder.uri.fsPath));
    }

    async checkGitStatus(): Promise<boolean> {
        this.changesMade = false;
        for (const git of this.gits) {
            try {
                const status = await git.status();
                this.changesMade = status.files.length > 0;
            } catch (error) {
                vscode.window.showErrorMessage("Error checking git status.");
            }
        }
        return this.changesMade;
    }

    async handleCommit() : Promise<void> {
        let reposCommitted = 0;
        for (const git of this.gits) {
            try {
                const status = await git.status();
                if (status.files.length > 0) {
                    await git.add(".");
                    await git.commit("Working on git commit message for later use");
                    await git.push();
                    reposCommitted++;
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Git commit failed`);
            }
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
        return config.get<number>("commitInterval", 300000); // Default: 5 minutes
    }
}
