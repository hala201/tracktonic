// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitService } from './services/gitService';
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

export async function setupShellLogging() {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const bashrcPath = path.join(homeDir!, ".bashrc");
    const zshrcPath = path.join(homeDir!, ".zshrc");
    const fishPath = path.join(homeDir!, ".config/fish/config.fish");

    const logCommand = `export PROMPT_COMMAND='echo "$(date +"%Y-%m-%d %H:%M:%S") $USER: $BASH_COMMAND" >> ~/.vscode_terminal_log'`;

    if (fs.existsSync(bashrcPath)) {
        fs.appendFileSync(bashrcPath, `\n${logCommand}\n`);
    }
    if (fs.existsSync(zshrcPath)) {
        fs.appendFileSync(zshrcPath, `\npreexec() { echo "$(date +"%Y-%m-%d %H:%M:%S") $USER: $1" >> ~/.vscode_terminal_log; }\n`);
    }
    if (fs.existsSync(fishPath)) {
        fs.appendFileSync(fishPath, `\nfunction log_command --on-event fish_preexec\n echo (date "+%Y-%m-%d %H:%M:%S") (whoami) (pwd) $argv >> ~/.vscode_terminal_log\nend\n`);
    }

    vscode.window.showInformationMessage("TrackTonic: Terminal logging enabled. Restart your terminal for changes to take effect.");
}


export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage("TrackTonic is activated!");

    setupShellLogging();
    const gitService = new GitService(context);
    const intervalMs = gitService.getCommitInterval();
    gitService.startAutoCommit(intervalMs);

    const stopCommand = vscode.commands.registerCommand("tracktonic.stop", () => {
        gitService.stopAutoCommit();
    });

    context.subscriptions.push(stopCommand);
}

export function deactivate() {
	vscode.commands.getCommands(true).then((commands) => {
        commands.forEach((command) => {
            if (command.startsWith("tracktonic.")) {
                vscode.commands.executeCommand(command).then(() => {
                    console.log(`Deactivated command: ${command}`);
                });
            }
        });
    });
}
