document.addEventListener('DOMContentLoaded', function () {
    const editor = CodeMirror.fromTextArea(document.getElementById("code-area"), {
        mode: "python",
        theme: "blackboard",
        lineNumbers: true,
        indentUnit: 4,
        smartIndent: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        lineWrapping: true
    });

    editor.setValue("print('Hello, World!')");

    async function compileCode() {
        const code = editor.getValue();
        const outputElement = document.getElementById("output-area");
        outputElement.textContent = "Running...";

        const inputPattern = /input\((?:'|"|`)(.*?)(?:'|"|`)\)/g;
        const inputPrompts = Array.from(code.matchAll(inputPattern), match => match[1]);

        if (inputPrompts.length) {
            outputElement.innerHTML = '<h3>Provide Input:</h3>';

            const inputsContainer = document.createElement('div');
            inputsContainer.className = 'inputs-container';

            inputPrompts.forEach((prompt, index) => {
                inputsContainer.innerHTML += `
                    <div class="input-group">
                        <label for="input-${index}">${prompt}</label>
                        <input type="text" id="input-${index}" class="user-input" />
                    </div>
                `;
            });

            const submitButton = document.createElement('button');
            submitButton.id = 'submit-btn';
            submitButton.textContent = 'Submit Inputs';

            outputElement.appendChild(inputsContainer);
            outputElement.appendChild(submitButton);

            submitButton.addEventListener('click', submitInputs);
            return;
        }

        await executeCode(code);
    }

    async function executeCode(code, inputs = []) {
        const outputElement = document.getElementById("output-area");
        outputElement.textContent = "Running...";

        inputs.forEach(input => {
            code = code.replace(/input\((?:'|"|`)(.*?)(?:'|"|`)\)/, `"${input}"`);
        });

        try {
            const response = await fetch("https://emkc.org/api/v2/piston/execute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language: "python",
                    version: "3.10.0",
                    files: [{ content: code }]
                })
            });

            if (!response.ok) throw new Error("Error executing code!");

            const result = await response.json();
            const output = result.run.output || "No output!";

            outputElement.innerHTML = `> ${output}`;
        } catch (err) {
            outputElement.textContent = ` Error: ${err.message}`;
        }
    }

    function submitInputs() {
        const inputs = Array.from(document.querySelectorAll(".user-input")).map(input => input.value);
        const code = editor.getValue();
        executeCode(code, inputs);
    }

    const runButton = document.querySelector("#run-btn");
    runButton.addEventListener('click', compileCode);
});