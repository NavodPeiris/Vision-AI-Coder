(function () {
    const vscode = acquireVsCodeApi();
    document.getElementById(ELEMENT_IDS.DOWNLOAD_MODEL_BUTTON).addEventListener('click', ()=> {
        vscode.postMessage({ 
            command: "downloadModel", 
            text: "Downloading TinyLlama Model"
        });
    });

    document.getElementById(ELEMENT_IDS.START_SERVER_BUTTON).addEventListener('click', () => {
        vscode.postMessage({ command: 'startServer', text: "starting TinyLlama Server"});
    });

    document.getElementById('askButton').addEventListener('click', () => {
        const questionElement = document.getElementById('question');
        const question = questionElement.value;
        const imagePathElement = document.getElementById('image');
        const imagePath = imagePathElement.value;
        vscode.postMessage({ command: 'question', text: question, imagePath: imagePath});
    });

    window.addEventListener('message', event => {
        const message = event.data;
        const chatDiv = document.getElementById('chat');

        switch (message.command) {
            case 'startChat':
                const userMessageDiv = document.createElement('div');
                userMessageDiv.className = 'user-message';
                userMessageDiv.innerText = `User:\n\n${message.text}`;
                chatDiv.appendChild(userMessageDiv);
    
                const aiMessageDiv = document.createElement('div');
                aiMessageDiv.className = 'ai-message';
                aiMessageDiv.innerText = `AI:\n\n`;
                chatDiv.appendChild(aiMessageDiv);
                break;

            case 'streamAnswer':
                console.log("this runs3");
                const lastAiMessageDiv = chatDiv.querySelector('.ai-message:last-of-type');
                if (lastAiMessageDiv) {
                    lastAiMessageDiv.innerText += message.text;
                }
                break;

            default:
                break;
        }
    });

}());