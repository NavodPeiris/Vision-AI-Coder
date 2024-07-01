try {
	require("module-alias/register");
} catch (e) {
	console.log("module-alias import error !");
}
import {ExtensionContext, commands, window} from "vscode";
import { EXTENSION_CONSTANT } from "constant";
import { LeftPanelWebview } from "providers/left-webview-provider";

export function activate(context: ExtensionContext) {
	let helloWorldCommand = commands.registerCommand(
		"visionAICoder.helloWorld",
		() => {
			window.showInformationMessage(
				"Hello World from Vision AI Coder on VSCode!"
			);
		}
	);
	context.subscriptions.push(helloWorldCommand);
    

	// Register view
	const leftPanelWebViewProvider = new LeftPanelWebview(context, context?.extensionUri, {});
	let view = window.registerWebviewViewProvider(
		EXTENSION_CONSTANT.LEFT_PANEL_WEBVIEW_ID,
		leftPanelWebViewProvider,
	);
	context.subscriptions.push(view);

};

// this method is called when your extension is deactivated
export function deactivate() {}
