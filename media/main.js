(function () {
  const vscode = acquireVsCodeApi();

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.type === "update") {
      renderDiffs(message.data);
    }
  });

  document.getElementById("commit-button").onclick = function () {
    const msg = document.getElementById("commit-message").value;
    vscode.postMessage({ type: "commit", message: msg });
  };

  document.getElementById("refresh-button").onclick = function () {
    vscode.postMessage({ type: "refresh" });
  };

  function renderDiffs(files) {
    const container = document.getElementById("diff-list");
    container.innerHTML = "";
    if (!files.length) {
      container.innerHTML = "<p>No changes detected.</p>";
      return;
    }
    files.forEach((file) => {
      const fileDiv = document.createElement("div");
      fileDiv.className = "file-block";
      fileDiv.innerHTML = `<h3>${file.path}</h3>`;
      file.diff.forEach((block) => {
        block.added.forEach((line) => {
          const lineDiv = document.createElement("div");
          lineDiv.className = "added";
          lineDiv.textContent = "+ " + line;
          fileDiv.appendChild(lineDiv);
        });
        block.removed.forEach((line) => {
          const lineDiv = document.createElement("div");
          lineDiv.className = "removed";
          lineDiv.textContent = "- " + line;
          fileDiv.appendChild(lineDiv);
        });
      });
      container.appendChild(fileDiv);
    });
  }
})();
