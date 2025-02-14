// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as cp from 'child_process';
import { clear } from 'console';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

let activityLog : {time: Date, activity: string}[] = [];
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "tracktonic" is now active!');
	vscode.window.showInformationMessage('TrackTonic is now active!');

	const change = vscode.commands.registerCommand('tracktonic.entry', () => {
		vscode.workspace.onDidChangeTextDocument((e) => {
			const entry = {time: new Date(), activity: e.document.uri.toString()};
			activityLog.push(entry);
			console.log('Activity log:', activityLog);
		});
	});
	
	context.subscriptions.push(change);
	scheduleAutoCommit(context);
}

function scheduleAutoCommit(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('tracktonic');
	const intervalConfig = config.get<number>('autoCommitInterval') || 5;
	const interval = intervalConfig * 1000 * 60;
	const commitSchedule = setInterval(() => {
		autoCommit();}, interval);
	context.subscriptions.push({dispose: () => clearInterval(commitSchedule)});
}

function autoCommit() {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		console.warn('No workspace folder found');
		return;
	}
	const workspaceFolder = workspaceFolders[0];
	const commitmessage = `Auto commit:  ${+ new Date().toLocaleString()}`;
	const gitCommand = `git add - A && commit -m "${commitmessage}"`;

	cp.exec(gitCommand, {cwd: workspaceFolder.uri.fsPath}, (err, stdout, stderr) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log(stdout);
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
