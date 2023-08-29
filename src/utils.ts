import { existsSync, readJSONSync } from "fs-extra";
import * as vscode from "vscode";
import path = require("path");
/**
 * 当前行是否有效
 * @param document
 * @param line
 * @returns
 */
export function isValidLine(document: vscode.TextDocument, line: number): boolean {
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
/**
 * 由于文件名后缀可能缺失，所以增加后缀
 * @param filename
 * @param ext
 */
export function getFullFileName(filename: string, ext: string = "js") {
  if (!filename) {
    return filename;
  }
  // 判断是否有后缀(考虑 ./index 的特殊场景)
  const hasExt = filename.lastIndexOf(".") > 0;
  if (!hasExt) {
    filename += `.${ext}`;
  }
  return filename;
}
export function getCurrentPackageVersion(packagePath: vscode.Uri): string {
  const packageFilePath = path.join(packagePath.fsPath, "package.json");
  if (existsSync(packageFilePath)) {
    const packageObj = readJSONSync(packageFilePath);
    return packageObj.version;
  }
  return "unknown";
}
/**
 * 获取包的入口文件，默认从 package.json 的 main 取，主要存在以下几种场景:
 * 1.main 存在, 直接拼接 base 的路径(常见)
 * 2.main 存在，但是没有后缀名，需要手动拼接后缀 .js / .d.ts , 然后拼接 base 目录
 * 3.main 不存在，且包名以 @types/ 开头,则是一个 d.ts 定义文件，则需要直接用 index.d.ts 作为入口文件
 * 4.main 不存在，包名不已 @types/ 开头，默认以 index.js 作为入口文件
 * @param base 项目 Base 目录
 * @param packageName 包名
 * @returns
 */
export function getEntryFilePath(base: vscode.Uri, packageName: string) {
  const pkgDir = vscode.Uri.joinPath(
    base,
    "node_modules",
    // 处理 @a/b 的包名场景, 此时会被分割为子级目录
    ...packageName.split("/")
  );
  const pkgJsonPath = vscode.Uri.joinPath(pkgDir, "package.json");
  // 判断是否是types的文件
  const isTypes = packageName.startsWith("@types/");
  if (existsSync(pkgJsonPath.fsPath)) {
    const pkgObj = readJSONSync(pkgJsonPath.fsPath);
    let entryPath;
    // 如果没有 main 字段, 且是 types 文件，则默认以 index.d.ts 为入口, 否则以 index.js 作为入口
    if (!pkgObj.main) {
      const binPath = pkgObj.bin;
      // 如果存在 bin，则以 bin 路径作为入口, 不考虑 bin 为一个 object 的情况
      if (binPath && typeof binPath === "string") {
        entryPath = vscode.Uri.joinPath(
          pkgDir,
          getFullFileName(binPath, isTypes ? "d.ts" : "js")
        );
      } else {
        if (isTypes) {
          entryPath = vscode.Uri.joinPath(pkgDir, "index.d.ts");
        } else {
          entryPath = vscode.Uri.joinPath(pkgDir, "index.js");
        }
      }
    } else {
      entryPath = vscode.Uri.joinPath(
        pkgDir,
        getFullFileName(pkgObj.main, isTypes ? "d.ts" : "js")
      );
    }
    if (existsSync(entryPath.fsPath)) {
      return entryPath;
    }
  }
}
