import vscode, { ExtensionContext } from "vscode";
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