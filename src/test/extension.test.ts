import * as assert from 'assert';
import * as vscode from 'vscode';
import { GitService } from '../services/gitService';
import * as sinon from 'sinon';
import simpleGit from 'simple-git';

suite('GitService Tests', () => {
    let gitService: GitService;
    let context: vscode.ExtensionContext;
    let gitMock: any;

    setup(() => {
        context = {} as vscode.ExtensionContext;
        gitService = new GitService(context);
        gitMock = sinon.stub(simpleGit());
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
