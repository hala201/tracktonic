import * as assert from 'assert';
import * as vscode from 'vscode';
import { GitService } from '../services/gitService';
import * as sinon from 'sinon';
import * as fs from "fs";

suite('GitService Tests', () => {
    let gitService: GitService;
    let context: vscode.ExtensionContext;
    let gitMock: any;

    setup(async () => {
        context = {} as vscode.ExtensionContext;
    
        sinon.stub(vscode.workspace, "workspaceFolders").value([
            { uri: vscode.Uri.file("/fake/workspace") } as vscode.WorkspaceFolder,
        ]);
    
    
        // Create repo directory
        const testRepoPath = "/fake/workspace/tracktonic";
        if (!fs.existsSync(testRepoPath)) {
            fs.mkdirSync(testRepoPath, { recursive: true });
        }
    
        gitMock = {
            status: sinon.stub().resolves({
                not_added: [],
                conflicted: [],
                created: ["test.txt"], 
                deleted: [],
                ignored: [],
                modified: [],
                renamed: [],
                staged: [],
                files: [{ path: "test.txt" }],
                ahead: 0,
                behind: 0
            }),
            add: sinon.stub().resolves(),
            commit: sinon.stub().resolves(),
            push: sinon.stub().resolves(),
            log: sinon.stub().resolves({ total: 1 }),
            diff: sinon.stub().resolves("Mocked diff output"),

        };
    
        gitService = new GitService(context);
        await (gitService as any).initialize();

        (gitService as any).git = gitMock; 
    });
    

    teardown(() => {
        sinon.restore();
    });

    test('GitService initializes correctly', async () => {
        sinon.stub(gitService as any, 'initialize').resolves();
        await gitService.checkGitStatus();
        assert.strictEqual(gitService instanceof GitService, true);
    });

    test('checkGitStatus detects changes', async () => {
        gitMock.status.resolves({ files: [{ path: 'test.txt' }] });
        const hasChanges = await gitService.checkGitStatus();
        assert.strictEqual(hasChanges, true);
    });

    test('checkGitStatus detects no changes', async () => {
        gitMock.status.resolves({ files: [] });
        const hasChanges = await gitService.checkGitStatus();
        assert.strictEqual(hasChanges, false);
    });

    test('handleCommit adds and commits changes', async () => {
        gitMock.status.resolves({ files: [{ path: 'test.txt' }] });
        gitMock.add.resolves();
        gitMock.commit.resolves();
        gitMock.push.resolves();

        await gitService.handleCommit();
        assert.strictEqual(gitMock.add.called, true);
        assert.strictEqual(gitMock.commit.called, true);
    });

    test('handleCommit does not commit if no changes', async () => {
        gitMock.status.resolves({ files: [] });
        await gitService.handleCommit();
        assert.strictEqual(gitMock.add.called, false);
        assert.strictEqual(gitMock.commit.called, false);
    });

    test('startAutoCommit sets an interval', () => {
        sinon.useFakeTimers();
        sinon.stub(gitService, 'checkGitStatus').resolves(true);
        sinon.stub(gitService, 'handleCommit').resolves();
        
        gitService.startAutoCommit(5000);
        assert.strictEqual(typeof (gitService as any).commitInterval, 'object');
    });

    test('stopAutoCommit clears the interval', () => {
        sinon.useFakeTimers();
        gitService.startAutoCommit(5000);
        gitService.stopAutoCommit();
        assert.strictEqual((gitService as any).commitInterval, undefined);
    });

    test('GitHub authentication failure shows error message', async () => {
        sinon.stub(vscode.window, 'showErrorMessage');
        sinon.stub(vscode.authentication, 'getSession').rejects(new Error('Auth failed'));
        const token = await (gitService as any).authenticateGithub();
        assert.strictEqual(token, undefined);
    });

    test('GitHub repository creation failure shows error', async () => {
        sinon.stub(vscode.window, 'showErrorMessage');
        sinon.stub(vscode.authentication, 'getSession').resolves({ accessToken: 'fake-token' , id: "id", account: {id: "", label :""}, scopes: []});
        sinon.stub(gitService as any, 'checkIfRepoExists').resolves(false);
        sinon.stub(gitService as any, 'createGithubRepo').resolves(false);
        await gitService.handleCommit();
        assert.strictEqual(gitMock.push.called, false);
    });
});