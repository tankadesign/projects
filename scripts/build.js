const fse = require("fs-extra");
const path = require("path");
const { promisify } = require("util");
const ejsRenderFile = promisify(require("ejs").renderFile);
const fs = require('fs');
const readFile = promisify(fs.readFile);
const globP = promisify(require("glob"));
const config = require("../site.config");
const UglifyJS = require("uglify-es");
const CleanCSS = require('clean-css');
require('dotenv').config();

const srcPath = "./src";
const distPath = "./public";

// clear destination folder
fse.emptyDirSync(distPath);

// copy assets folder

function ignoreJSorCSSsource (src, dest) {
  if(!src.match(/\.(js|css)$/)) return true;
  if(!src.match(/\.min\.(js|css)$/)) return false;
  return true;
}
fse.copy(`${srcPath}/assets`, `${distPath}`, {filter: ignoreJSorCSSsource});

globP("**/*.*(js|css)", { cwd: `${srcPath}/assets` }).then(files => {
  files.forEach(file => {
    if(!file.match(/\.min\.(js|css)$/)) {
      const fileData = path.parse(file);
      const destPath = path.join(distPath, fileData.dir);
      readFile(`${srcPath}/assets/${file}`, 'utf8').then(data => {
        if(file.match(/\.js$/)) {
          const js = UglifyJS.minify(data);
          fse.outputFile(`${destPath}/${fileData.name}.min.js`, js.code);
        }
        if(file.match(/\.css$/)) {
          const css = new CleanCSS().minify(data);
          fse.outputFile(`${destPath}/${fileData.name}.min.css`, css.styles);
        }
      });
    }
  });
});

// read page templates
globP("**/*.ejs", { cwd: `${srcPath}/pages` })
  .then(files => {
    files.forEach(file => {
      const fileData = path.parse(file);
      const destPath = path.join(distPath, fileData.dir);

      // create destination directory
      fse
        .mkdirs(destPath)
        .then(() => {
          // render page
          return ejsRenderFile(
            `${srcPath}/pages/${file}`,
            Object.assign({}, config)
          );
        })
        .then(pageContents => {
          // render layout with page contents
          const fileId = file.replace(".ejs", "");
          return ejsRenderFile(
            `${srcPath}/layout.ejs`,
            Object.assign({}, config, {
              body: pageContents,
              id: config.routes[fileId].id,
              title: config.routes[fileId].title + " | " + config.meta.title,
              process: process
            })
          );
        })
        .then(layoutContent => {
          // save the html file
          fse.writeFile(`${destPath}/${fileData.name}.html`, layoutContent);
        })
        .catch(err => {
          console.error(err);
        });
    });
  })
  .catch(err => {
    console.error(err);
  });
