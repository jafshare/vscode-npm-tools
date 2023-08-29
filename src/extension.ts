// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { DependencyHoverProvider } from "./hover";
import { DependencyDefinitionProvider } from "./definition";
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('npm-tools is active!');
  const command = vscode.commands.registerCommand(
    "npmTools.jumpToPackage",
    (packagePath: vscode.Uri) => {
      if (packagePath) {
        vscode.commands.executeCommand("vscode.openFolder", packagePath);
      }
    }
  );
  context.subscriptions.push(command);
  // Register a hover provider for package.json dependencies
  const hoverProvider = vscode.languages.registerHoverProvider(
    { scheme: "file", language: "json", pattern: "**/package.json" },
    new DependencyHoverProvider()
  );
  context.subscriptions.push(hoverProvider);
  const definitionProvider = vscode.languages.registerDefinitionProvider(
    { scheme: "file", language: "json", pattern: "**/package.json" },
    new DependencyDefinitionProvider()
  );
  context.subscriptions.push(definitionProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
