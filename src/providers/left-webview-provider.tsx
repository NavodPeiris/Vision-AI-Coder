import { WebviewViewProvider, WebviewView, Webview, Uri, EventEmitter, window, ExtensionContext, Task, TaskScope, ShellExecution, TaskRevealKind, tasks} from "vscode";
import { Utils } from "utils";
import LeftPanel from 'components/LeftPanel';
import * as ReactDOMServer from "react-dom/server";

async function codeLlama(instruction: string, port: number, imagePath: string, sendText: (text: string) => void) {
    const { llamacpp, streamText } = await import('modelfusion');
    const fs = await import('fs');
    var image: any;
    var textStream: any;
    try{
        image = fs.readFileSync(imagePath);
    }
    catch(err){
        console.log(err)
    }
    
    const api = llamacpp.Api({
        baseUrl: {
          host: "localhost",
          port: `${port}`,
        },
    });

    if(image){
        textStream = await streamText({
            model: llamacpp
              .CompletionTextGenerator({
                api: api,
                promptTemplate: llamacpp.prompt.BakLLaVA1,
                maxGenerationTokens: 1024,
                temperature: 0,
                topP: 0.8,
                topK: 100,
                repeatPenalty: 1.05
              })
              .withInstructionPrompt(),
          
            prompt: {
              instruction: [
                { type: "text", text: instruction },
                { type: "image", image },
              ],
            },
        });
    }
    else {
        textStream = await streamText({
            model: llamacpp
              .CompletionTextGenerator({
                api: api,
                promptTemplate: llamacpp.prompt.ChatML,
                maxGenerationTokens: 1024,
                temperature: 0,
                topP: 0.8,
                topK: 100,
                repeatPenalty: 1.05
              })
              .withInstructionPrompt(),
          
            prompt: {
              instruction: instruction
            },
        });
    }

    for await (const textPart of textStream) {
        sendText(textPart);
    }
}

async function downloadModel(context: ExtensionContext) {
    const task = new Task(
        { type: 'shell' },
        TaskScope.Workspace,
        'downloading model',
        'setup',
        new ShellExecution('node' + ' ' + context.asAbsolutePath(`src/index.js`) + ' ' + context.asAbsolutePath(`src`))
    );
    task.presentationOptions = {
        reveal: TaskRevealKind.Silent,
    };

    await tasks.executeTask(task);
}

async function startLLamaServer(context: ExtensionContext, port: number) {
    const task = new Task(
        { type: 'shell' },
        TaskScope.Workspace,
        'starting server',
        'setup',
        new ShellExecution(context.asAbsolutePath('src/llamafile.exe') + ' -m ' + context.asAbsolutePath(`src/llava-phi-3-mini-int4.gguf`) + " --mmproj " + context.asAbsolutePath(`src/llava-phi-3-mini-mmproj-f16.gguf`) + ` -c 4096 --nobrowser --port ${port}`)
    );
    task.presentationOptions = {
        reveal: TaskRevealKind.Silent,
    };

    await tasks.executeTask(task);
}

export class LeftPanelWebview implements WebviewViewProvider {
	constructor(
		private context: any,
		private readonly extensionPath: Uri,
		private data: any,
		private _view: any = null
	) {}
    private onDidChangeTreeData: EventEmitter<any | undefined | null | void> = new EventEmitter<any | undefined | null | void>();

    refresh(context: any): void {
        this.onDidChangeTreeData.fire(null);
        this._view.webview.html = this._getHtmlForWebview(this._view?.webview);
    }

	//called when a view first becomes visible
	resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionPath],
		};
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
		this._view = webviewView;
		this.activateMessageListener();
	}

	private activateMessageListener() {
		this._view.webview.onDidReceiveMessage(async(message) => {
			switch (message.command){
				case 'downloadModel':
					await downloadModel(this.context);
					break;
				case 'startServer':
					startLLamaServer(this.context, 4000);
                    break;
				case 'question':
					console.log("this runs1")
                    this._view.webview.postMessage({ command: 'startChat', text: message.text});
					await codeLlama(message.text, 4000, message.imagePath,(text: string) => {
						this._view.webview.postMessage({ command: 'streamAnswer', text });
					});
					console.log("this runs2")
					break;
				default:
					break;
			}
		});
	}

	private _getHtmlForWebview(webview: Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		// Script to handle user action
		const scriptUri = webview.asWebviewUri(
			Uri.joinPath(this.extensionPath, "script", "left-webview-provider.js")
		);
		const constantUri = webview.asWebviewUri(
			Uri.joinPath(this.extensionPath, "script", "constant.js")
		);
		// CSS file to handle styling
		const styleUri = webview.asWebviewUri(
			Uri.joinPath(this.extensionPath, "script", "left-webview-provider.css")
		);

		//vscode-icon file from codicon lib
		const codiconsUri = webview.asWebviewUri(
			Uri.joinPath(this.extensionPath, "script", "codicon.css")
		);

		// Use a nonce to only allow a specific script to be run.
		const nonce = Utils.getNonce();

		return `<html>
                <head>
                    <meta charSet="utf-8"/>
                    <meta http-equiv="Content-Security-Policy" 
                            content="default-src 'none';
                            img-src vscode-resource: https:;
                            font-src ${webview.cspSource};
                            style-src ${webview.cspSource} 'unsafe-inline';
                            script-src 'nonce-${nonce}'
							
							;">             

                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${codiconsUri}" rel="stylesheet" />
                    <link href="${styleUri}" rel="stylesheet">

                </head>
                <body>
                    ${
                        
                        ReactDOMServer.renderToString((
							<LeftPanel></LeftPanel>
						))
                    }
					<script nonce="${nonce}" type="text/javascript" src="${constantUri}"></script>
					<script nonce="${nonce}" src="${scriptUri}"></script>
				</body>
            </html>`;
	}
}
