import { resolve } from "path";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  try {
    const extensionDevelopmentPath = resolve(__dirname, "../../");

    const testRunnerOptions = {
      extensionDevelopmentPath,
      extensionTestsPath: resolve(__dirname, "./suite/index"), // Runs the test suite
      launchArgs: ["--disable-extensions"], // Ensures only your extension loads
    };

    await runTests(testRunnerOptions);
  } catch (err) {
    console.error("Failed to run tests:", err);
    process.exit(1);
  }
}

void main();
