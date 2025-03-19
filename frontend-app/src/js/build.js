const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'local';
const envFile = ".env."+env;
const result = dotenv.config({ path: path.resolve('./', envFile) });
if(result.error) {
  console.error(`Error loading ${envFile}:`, result.error);
} else {
  console.log(`Loaded environment file: ${envFile}`);
}

const template = fs.readFileSync("src/index.ejs", "utf-8");
const rendered = ejs.render(template, {
	API_URL: process.env.API_URL
});
fs.writeFileSync("src/index.html", rendered);


const template2 = fs.readFileSync("src/manifest.ejs", "utf-8");
const rendered2 = ejs.render(template2, {
	API_URL: process.env.API_URL
});
fs.writeFileSync("src/manifest.json", rendered2);
