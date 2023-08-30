import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { getEntryFilePath, getFullFileName } from "../../utils";
import { join } from "path";
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("getFullFileName test", () => {
    const data = [
      ["", ""],
      ["index", "index.js"],
      ["index.ts", "index.ts"],
      ["index.js", "index.js"],
      [".a.ts", ".a.ts"],
      [".ignore", ".ignore"],
      ['a.b.js','a.b.js'],
      ["./lib/api.js", "./lib/api.js"],
      ["index.abc", "index.abc"],
      ["./lib/index", "./lib/index.js"],
      ["../lib/index", "../lib/index.js"],
    ];
    data.forEach(([val, expectVal]) => {
      assert.strictEqual(getFullFileName(val), expectVal);
    });
  });
  test("getEntryFilePath test", () => {
    const data = [
      [
        "package1",
        vscode.Uri.parse(__dirname),
        vscode.Uri.parse(join(__dirname, "node_modules/package1/main.js")),
      ],
      [
        "package2",
        vscode.Uri.parse(__dirname),
        vscode.Uri.parse(join(__dirname, "node_modules/package2/index.js")),
      ],
      [
        "package3",
        vscode.Uri.parse(__dirname),
        vscode.Uri.parse(join(__dirname, "node_modules/package3/index.js")),
      ],
      [
        "@types/package4",
        vscode.Uri.parse(__dirname),
        vscode.Uri.parse(
          join(__dirname, "node_modules/@types/package4/index.d.ts")
        ),
      ],
      [
        "package5",
        vscode.Uri.parse(__dirname),
        vscode.Uri.parse(join(__dirname, "node_modules/package5/index.js")),
      ],
    ] as [string, vscode.Uri, vscode.Uri][];
    data.forEach(([pkgName, base, expectVal]) => {
      assert.strictEqual(
        getEntryFilePath(base, pkgName)?.fsPath,
        expectVal.fsPath
      );
    });
  });
});
