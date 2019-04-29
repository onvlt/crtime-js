const fs = require('fs')
const path = require('path')
const prependFile = require('prepend-file')
const dateFormat = require('dateformat')

const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
})  

const template = time => `---
created: ${time}
---

`

function parseArgs() {
	if (typeof process.argv[2] !== "string") {
		console.error("Not enough arguments")
		process.exit(1)
	}

	const dir = process.argv[2];

	if (! fs.lstatSync(dir).isDirectory()) {
		console.error(`Path ${dir} is not a directory`)
		process.exit(1)
	}

	return { dir }
}

function run() {
	const { dir } = parseArgs();

	const files = fs.readdirSync(dir)
		.filter(file => file.endsWith('.md'))

	const duplicates = []

	const items = files.map(file => {
		const stat = fs.lstatSync(path.join(dir, file))
		const time = stat.birthtime;
		const id = dateFormat(time, "yyyymmddHHMM");

		return {
			id,
			oldPath: path.join(dir, file),
			newPath: path.join(dir, id + ' ' + file),
		}
	})
		.sort((a, b) => a.birthtime - b.birthtime)
		.reduce((arr, current) => {
			const last = arr[arr.length - 1]

			if (last && current.id == last.id) {
				const id = (parseInt(current.id) + 1).toString();
				
				current = { ...current, id }
				duplicates.push({
					oldId: last.id,
					newId: current.id,
				})
			}

			return [...arr, current]
		}, [])

	items.forEach(({ oldPath, newPath }) => {
		console.log(oldPath + " --> " + newPath)
	})

	console.log("")
	console.log(`Found ${duplicates.length} duplicate IDs, they were incremented by one: `);

	duplicates.forEach(({ oldId, newId }) => {
		console.log(oldId + " --> " + newId)
	})
	
	readline.question("Do you want to proceed with renaming? (y/N) ", () => {
		items.forEach(({ oldPath, newPath}) => {
			fs.rename(oldPath, newPath, err => {
				if (err) console.error(err)
			})
		})
		readline.close()
	})
}

// try {
	run();
// } catch (e) {
// 	console.error("An error occured: " + e.message)
// 	process.exit(1)
// }
