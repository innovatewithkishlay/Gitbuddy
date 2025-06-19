import * as vscode from "vscode";
import { PanelProvider } from "./PanelProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("GitBuddy is activating!");
  const provider = new PanelProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "gitbuddy.sidebarView",
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("gitbuddy.refresh", () => {
      provider.refresh();
    })
  );
}

export function deactivate() {}
