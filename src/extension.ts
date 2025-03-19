// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitService } from './services/gitService';

export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage("TrackTonic is activated!");

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
