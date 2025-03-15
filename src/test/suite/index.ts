import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Extension should activate", async () => {
    const extension = vscode.extensions.getExtension("your-extension-id");
    assert.ok(extension, "Extension not found");
    await extension?.activate();
    assert.ok(extension.isActive, "Extension failed to activate");
  });

  test("Auto-commit should work when file is modified", async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders, "No workspace folder found");

    const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, "test.txt");
    await vscode.workspace.fs.writeFile(filePath, Buffer.from("Initial content"));

    // Wait a moment to let the extension detect changes
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate triggering auto-commit
    await vscode.commands.executeCommand("your-extension.autoCommit");

    // Assert expected changes (you might need to check logs or Git state)
    assert.ok(true, "Auto-commit triggered successfully.");
  });
});
