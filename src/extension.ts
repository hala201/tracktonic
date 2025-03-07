// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitService } from './services/gitService';


export function activate(context: vscode.ExtensionContext) {
	const gitService = new GitService(context);
	
	const startCommand = vscode.commands.registerCommand("tracktonic.start", () => {
		const intervalMs = gitService.getCommitInterval();
		gitService.startAutoCommit(intervalMs);

		const stopCommand = vscode.commands.registerCommand("tracktonic.stop", () => {
			gitService.stopAutoCommit();
		});

		context.subscriptions.push(startCommand, stopCommand);
	});
	
}

export function deactivate() {
	gitService.stopAutoCommit();
}
