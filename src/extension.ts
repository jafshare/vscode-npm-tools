// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { existsSync, readJSONSync } from "fs-extra";
import * as vscode from "vscode";
import path = require("path");
// 匹配 "@abc"  的格式
const packageRE = /"[^"]+"/;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "npm-tools" is now active!');
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

class DependencyHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, packageRE);
    if (!wordRange) {
      return;
    }
    const workspace = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspace) {
      vscode.window.showErrorMessage(
        "No workspace folder found for the current document."
      );
      return;
    }
    const line = document.lineAt(position);
    if (!isValidLine(document, line.lineNumber)) {
      return;
    }
    const word = document.getText(wordRange);
    // 去掉双引号
    const packageName = word.slice(1, word.length - 1);
    const packagePath = vscode.Uri.joinPath(
      workspace.uri,
      "node_modules",
      // 处理 @a/b 的包名场景
      ...packageName.split("/")
    );
    // 获取本地安装的版本号
    const currentVersion = getCurrentPackageVersion(packagePath);
    // 显示实际版本号
    const hoverContent = new vscode.MarkdownString(
      `${packageName}: ${currentVersion}(Current)`
    );
    return new vscode.Hover(hoverContent, wordRange);
  }
}
/**
 * 当前行是否有效
 * @param document
 * @param line
 * @returns
 */
function isValidLine(document: vscode.TextDocument, line: number): boolean {
  const documentText = document.getText();
  const matchFields = ['"dependencies"', '"devDependencies"'];
  // 指定的区间 dependencies 和 devDependencies
  return matchFields.some((fileName: string) => {
    const startPosition = document.positionAt(documentText.indexOf(fileName));
    const endPosition = document.positionAt(
      documentText.indexOf("}", document.offsetAt(startPosition))
    );
    // 去掉 dependencies 那一行
    const startLine = startPosition.line + 1;
    // 去掉 } 那一行
    const endLine = endPosition.line - 1;
    return line >= startLine && line <= endLine;
  });
}
function getCurrentPackageVersion(packagePath: vscode.Uri): string {
  const packageFilePath = path.join(packagePath.fsPath, "package.json");
  if (existsSync(packageFilePath)) {
    const packageObj = readJSONSync(packageFilePath);
    return packageObj.version;
  }
  return "unknown";
}

class DependencyDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    const wordRange = document.getWordRangeAtPosition(position, packageRE);
    if (!wordRange) {
      return;
    }
    const workspace = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspace) {
      vscode.window.showErrorMessage(
        "No workspace folder found for the current document."
      );
      return;
    }
    const line = document.lineAt(position);
    if (!isValidLine(document, line.lineNumber)) {
      return;
    }
    const word = document.getText(wordRange);
    // 去掉双引号
    const packageName = word.slice(1, word.length - 1);
    const dest = vscode.Uri.joinPath(
      // TODO 考虑一个工作区存在多个项目的场景
      workspace.uri,
      "node_modules",
      // 处理 @a/b 的包名场景
      ...packageName.split("/")
    );
    return new vscode.Location(dest, new vscode.Position(0, 0));
  }
}
