import * as vscode from "vscode";
import { PanelProvider } from "./PanelProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new PanelProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "gitChangeVisualizer.sidebarView",
      provider,
      {
        webviewOptions: { retainContextWhenHidden: true },
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("gitChangeVisualizer.refresh", () => {
      provider.refresh();
    })
  );
}

export function deactivate() {}
