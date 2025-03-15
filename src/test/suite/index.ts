import * as assert from "assert";
import * as vscode from "vscode";
import { GitService } from "../../services/gitService";
import { suite, test } from "mocha";

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    test("Extension should be present", async () => {
        const extension = vscode.extensions.getExtension("your-extension-id");
        assert.ok(extension, "Extension is not installed or not found.");
    });

    test("GitService should initialize properly", async () => {
        const context = {} as vscode.ExtensionContext; 
        const gitService = new GitService(context);
        assert.ok(gitService, "GitService was not initialized correctly.");
    });

    test("Start and Stop Auto Commit Commands", async () => {
        await vscode.commands.executeCommand("tracktonic.start");
        await vscode.commands.executeCommand("tracktonic.stop");
        assert.ok(true, "Commands executed successfully.");
    });
});
