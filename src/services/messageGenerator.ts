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

function sanitizeCodeChanges(code: string): string {
    return code
        .replace(/(?<=API_KEY\s*=\s*['"])[^'"]+/gi, "[REDACTED]") // API keys
        .replace(/(?<=password\s*=\s*['"])[^'"]+/gi, "[REDACTED]") // Passwords
        .replace(/(?<=secret\s*=\s*['"])[^'"]+/gi, "[REDACTED]"); // Other secrets
}

function limitCodeSize(code: string, maxLength = 20000): string {
    return code.length > maxLength ? code.substring(0, maxLength) + "\n...[truncated]..." : code;
}

export async function getAutomatedCommitMessage(context : ExtensionContext, codeChange: string) : Promise <string>{
    const genAI = await initializeGenAI(context);
    const genericCommitMessage = "Autocommit from tracktonic";
    if (!genAI) {
        return genericCommitMessage;
    }
    try {
        const model = genAI.getGenerativeModel({
                model : "gemini-1.5-flash"
        });
        const prompt = `Generate a concise commit message from the following file changes:\n\n ${
            limitCodeSize(sanitizeCodeChanges(codeChange))
        }`;
        const response = await model.generateContent(prompt);
        const commitMessage = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
        return commitMessage || genericCommitMessage;
    } catch (error) {
        vscode.window.showErrorMessage(`Error generating commit message: ${error}`);
        return genericCommitMessage;
    }

}