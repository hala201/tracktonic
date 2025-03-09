import vscode, { Extension, ExtensionContext } from "vscode";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { error } from "console";

async function getGoogleAPIKey(context : ExtensionContext) : Promise<string | undefined> {
    const secrets = context.secrets;
    let genaiAPIKey = await secrets.get("genaiapikey");
    if(!genaiAPIKey) {
        genaiAPIKey = await vscode.window.showInputBox({
            prompt : "Please enter your Google AI API key from https://aistudio.google.com/apikey",
            placeHolder: "Google AI API Key",
            ignoreFocusOut: true,
            validateInput : (input) => input.trim() === ""? "Google AI API Key Cannot Be Empty" : null,
            password: true
        });

        if (genaiAPIKey) {
            await secrets.store("genaiapikey", genaiAPIKey);
        } else {
            vscode.window.showErrorMessage("Google AI API key is required to generate commit messages.");
            return undefined;
        }
    }
    return genaiAPIKey;
}

async function initializeGenAI(context: ExtensionContext) : Promise<GoogleGenerativeAI | undefined> {
    const genaiAPIKey = await getGoogleAPIKey(context);
    if (!genaiAPIKey) {
        return undefined;
    } 
    try {
        const genAI = new GoogleGenerativeAI(genaiAPIKey);
        return genAI;
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Could not verify API Key: ${error.message}`);
        }
        return undefined;
    }
}

export async function getAutomatedCommitMessage(context : ExtensionContext, codeChange: string) : Promise <string>{
    const genAI = await initializeGenAI(context);
    const genericCommitMessage = "Autocommit from tracktonic";
    if (!genAI) {
        return genericCommitMessage;
    }
    try {
        const model = genAI.getGenerativeModel({
                model : "gemini-1.5-flas-8b"
        });
        const prompt = `Generate a concise commit message from the following file changes:\n\n ${codeChange}`;
        const response = await model.generateContent(prompt);
        const commitMessage = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
        return commitMessage || genericCommitMessage;
    } catch (error) {
        vscode.window.showErrorMessage(`Error generating commit message: ${error}`);
        return genericCommitMessage;
    }

}