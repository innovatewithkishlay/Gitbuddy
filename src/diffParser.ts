export interface DiffBlock {
  added: string[];
  removed: string[];
}

export function parseDiff(rawDiff: string): DiffBlock[] {
  const lines = rawDiff.split("\n");
  const blocks: DiffBlock[] = [];
  let currentBlock: DiffBlock = { added: [], removed: [] };

  lines.forEach((line) => {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      currentBlock.added.push(line.substring(1));
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      currentBlock.removed.push(line.substring(1));
    } else {
      if (currentBlock.added.length > 0 || currentBlock.removed.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { added: [], removed: [] };
      }
    }
  });

  if (currentBlock.added.length > 0 || currentBlock.removed.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}
