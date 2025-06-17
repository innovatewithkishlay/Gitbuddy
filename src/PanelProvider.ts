import * as vscode from "vscode";
import * as path from "path";
import { parseDiff } from "./diffParser";
import type { SourceControlResourceState } from "vscode";

export class PanelProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getWebviewContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "commit":
          await this.handleCommit(data.message);
          break;
        case "refresh":
          this.refresh();
          break;
      }
    });

    this.refresh();
  }

  public async refresh() {
    if (!this._view) return;

    const changedFiles = await this.getChangedFiles();
    const diffs = await this.getFileDiffs(changedFiles);

    this._view.webview.postMessage({
      type: "update",
      data: diffs,
    });
  }

  private async getChangedFiles() {
    const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
    if (!gitExtension) return [];

    const api = gitExtension.getAPI(1);
    const repo = api.repositories[0];

    return repo.state.workingTreeChanges.map((change) => ({
      path: change.uri.fsPath,
      status: change.status,
    }));
  }

  private async getFileDiffs(files: Array<{ path: string }>) {
    return Promise.all(
      files.map(async (file) => {
        const diff = await this.getGitDiff(file.path);
        return {
          path: file.path,
          diff: parseDiff(diff),
          rawDiff: diff,
        };
      })
    );
  }

  private async getGitDiff(filePath: string) {
    const { exec } = require("child_process");
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

    return new Promise<string>((resolve, reject) => {
      exec(
        `git diff ${filePath}`,
        { cwd: workspaceFolder },
        (err: any, stdout: string) => {
          err ? reject(err) : resolve(stdout);
        }
      );
    });
  }

  private async handleCommit(message: string) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    const { exec } = require("child_process");

    await new Promise<void>((resolve, reject) => {
      exec(
        `git add . && git commit -m "${message}"`,
        { cwd: workspaceFolder },
        (err: any) => (err ? reject(err) : resolve())
      );
    });

    vscode.window.showInformationMessage("Changes committed successfully");
    this.refresh();
  }

  private _getWebviewContent(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this._extensionUri.fsPath, "media", "main.js"))
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this._extensionUri.fsPath, "media", "main.css"))
    );

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${styleUri}" rel="stylesheet">
        </head>
        <body>
          <div class="header">
            <h1>Git Changes</h1>
            <button id="refresh-button">🔄 Refresh</button>
          </div>
          
          <div id="diff-list"></div>
          
          <div class="commit-section">
            <textarea id="commit-message" placeholder="Commit message..."></textarea>
            <button id="commit-button">💾 Commit All Changes</button>
          </div>
          
          <script src="${scriptUri}"></script>
        </body>
      </html>`;
  }
}
