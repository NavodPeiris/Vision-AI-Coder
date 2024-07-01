import { WebviewViewProvider, WebviewView, Webview, Uri, EventEmitter, window, ExtensionContext, Task, TaskScope, ShellExecution, TaskRevealKind, tasks} from "vscode";
import { Utils } from "utils";
import LeftPanel from 'components/LeftPanel';
import {renderToString} from "react-dom/server";

async function codeLlama(postMessage: any, instruction: string, port: number, imagePath: string, sendText: (text: string) => void) {
    const { llamacpp, streamText } = await import('modelfusion');
    const fs = await import('fs');
    const {readChunk} = await import('read-chunk');
    const imageType = await import('image-type');
    const {minimumBytes} = await import('image-type');

    var image: any;
    var textStream: any;
    
    if(imagePath){
        try {
            const buffer = await readChunk(imagePath, {length: minimumBytes});
            const fileType = await imageType.default(buffer);
            if (!fileType || !fileType.mime.startsWith('image/')) {
                window.showErrorMessage('The selected file is not a valid image. please select an image file.');
                return;
            }
        } catch (err) {
            console.log(err);
            window.showErrorMessage('An error occurred while reading the file. please check if the file path is correct and make sure absolute file path is given. make sure not to include any quotation marks.');
            return;
        }
    
        try {
            image = fs.readFileSync(imagePath);
        } catch (err) {
            console.log(err);
            window.showErrorMessage('An error occurred while reading the file. please check if the file path is correct and make sure absolute file path is given. make sure not to include any quotation marks.');
            return;
        }
    
        console.log('The file is a valid image.');
    }
    
    const api = llamacpp.Api({
        baseUrl: {
          host: "localhost",
          port: `${port}`,
        },
    });

    postMessage({ command: 'startChat', text: instruction });

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
    // Install axios globally
    const downloadAxiosTask = new Task(
        { type: 'shell' },
        TaskScope.Workspace,
        'downloading axios',
        'setup',
        new ShellExecution('npm install axios')
    );
    downloadAxiosTask.presentationOptions = {
        reveal: TaskRevealKind.Silent,
    };

    // Create a promise to await axios installation
    const axiosTaskPromise = new Promise<void>((resolve, reject) => {
        const disposable = tasks.onDidEndTaskProcess((e) => {
            if (e.execution.task === downloadAxiosTask) {
                disposable.dispose();
                if (e.exitCode === 0) {
                    resolve();
                } else {
                    reject(new Error('Failed to install axios.'));
                }
            }
        });
    });

    // Execute the axios installation task
    await tasks.executeTask(downloadAxiosTask);

    // Wait for axios installation to complete
    try {
        await axiosTaskPromise;

        // Download the model
        const downloadModelTask = new Task(
            { type: 'shell' },
            TaskScope.Workspace,
            'downloading model',
            'setup',
            new ShellExecution('node' + ' ' + context.asAbsolutePath(`script/index.js`) + ' ' + context.asAbsolutePath(`script`))
        );
        downloadModelTask.presentationOptions = {
            reveal: TaskRevealKind.Silent,
        };

        // Execute the model download task
        await tasks.executeTask(downloadModelTask);
    } catch (error) {
        window.showErrorMessage(error.message);
    }
}


async function startLLamaServer(context: ExtensionContext, port: number) {
    const task = new Task(
        { type: 'shell' },
        TaskScope.Workspace,
        'starting server',
        'setup',
        new ShellExecution(context.asAbsolutePath('script/llamafile.exe') + ' -m ' + context.asAbsolutePath(`script/llava-phi-3-mini-int4.gguf`) + " --mmproj " + context.asAbsolutePath(`script/llava-phi-3-mini-mmproj-f16.gguf`) + ` -c 4096 --nobrowser --port ${port}`)
    );
    task.presentationOptions = {
        reveal: TaskRevealKind.Silent,
    };

    await tasks.executeTask(task);
}

export class LeftPanelWebview implements WebviewViewProvider {
	constructor(
		private readonly context: ExtensionContext,
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
			localResourceRoots: [this.extensionPath]
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
					console.log("this runs1");
					await codeLlama(this._view.webview.postMessage.bind(this._view.webview), message.text, 4000, message.imagePath,(text: string) => {
						this._view.webview.postMessage({ command: 'streamAnswer', text });
					});
					console.log("this runs2");
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
                        
                        renderToString((
							<LeftPanel></LeftPanel>
						))
                    }
                    <script nonce="${nonce}" type="text/javascript">
                        var __importDefault = (this && this.__importDefault) || function (mod) { return (mod && mod.__esModule) ? mod : { "default": mod }; }
                    </script>
					<script nonce="${nonce}" type="text/javascript" src="${constantUri}"></script>
					<script nonce="${nonce}" src="${scriptUri}"></script>
				</body>
            </html>`;
	}
}
