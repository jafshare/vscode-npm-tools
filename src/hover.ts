import * as vscode from "vscode";
import { getCurrentPackageVersion, isValidLine } from "./utils";
import { packageRE } from "./constant";
export class DependencyHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
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
    const hover = new vscode.Hover(hoverContent, wordRange);
    hover.range = wordRange;
    return hover;
  }
}
