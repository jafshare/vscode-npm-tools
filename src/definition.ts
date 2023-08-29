import * as vscode from "vscode";
import { packageRE } from "./constant";
import { getEntryFilePath, isValidLine } from "./utils";
export class DependencyDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    const originRange = document.getWordRangeAtPosition(position, packageRE);
    if (!originRange) {
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
    const wordRange = new vscode.Range(
        originRange.start.line,
      // 去掉 "
      originRange.start.character + 1,
      originRange.end.line,
      // 去掉 ": 
      originRange.end.character - 2
    );
    const packageName = document.getText(wordRange);
    const entryPath = getEntryFilePath(workspace.uri, packageName);
    if (entryPath) {
      // 这里返回的格式必须是 vscode.LocationLink[]，否则默认高亮是以单词为单位
      return [
        {
          targetUri: entryPath,
          targetRange: new vscode.Range(0, 0, 0, 0),
          originSelectionRange: wordRange,
        },
      ];
    }
  }
}
