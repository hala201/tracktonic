import * as vscode from "vscode";
import simpleGit, { SimpleGit } from "simple-git";
import * as path from "path";

export class GitService {
    private git : SimpleGit[];
    private commitInterval: NodeJS.Timeout | undefined;

    constructor() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error("No workspace folder open.");
        }
        this.git = [];
        for (const folder of workspaceFolders) {
            this.git.push(simpleGit(folder.uri.fsPath));
        }
    }

    async checkGitStatus(git : SimpleGit): Promise<boolean> {
        try {
            const status = await git.status();
            return status.files.length > 0;
        } catch (error) {
            return false;
        }
    }
}
