const fs = require("fs");
const path = require("path");
const dateFormat = require("dateformat");

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

function parseArgs() {
  if (typeof process.argv[2] !== "string") {
    console.error("Not enough arguments");
    process.exit(1);
  }

  const dir = process.argv[2];

  if (!fs.lstatSync(dir).isDirectory()) {
    console.error(`Path ${dir} is not a directory`);
    process.exit(1);
  }

  return { dir };
}

function run() {
  const { dir } = parseArgs();

  const items = fs
    .readdirSync(dir)
    .filter(file => file.endsWith(".md") || file.endsWith(".txt"))
    .map(file => ({ file, stat: fs.lstatSync(path.join(dir, file)) }))
    .filter(({ stat }) => stat.isFile())
    .sort(({ stat: a }, { stat: b }) => a.birthtimeMs - b.birthtimeMs)
    .map(({ file, stat }) => {
      const time = stat.birthtime;
      const id = dateFormat(time, "yyyymmddHHMM");

      const oldPath = path.join(dir, file);
      const newPath = path.join(dir, id + " " + file);

      return { id, oldPath, newPath };
    });

  items.forEach(({ newPath }) => {
    console.log(newPath);
  });

  readline.question("Do you want to proceed with renaming? (y/n)", answer => {
    if (answer.toLowerCase() == "y") {
      items.forEach(({ oldPath, newPath }) => {
        fs.rename(oldPath, newPath, err => {
          if (err) console.error(err);
        });
      });
    } else {
      console.log("Aborting renaming");
    }

    readline.close();
  });
}

run();
