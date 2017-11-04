const fs = require("fs");
const path = require("path");

module.exports = (function () {
    var list = {};
    fs.readdirSync(__dirname).filter((f) => {
        return (f.endsWith('.js') && f!=path.basename(__filename));
    }).forEach((f) => {
        let absPath = __dirname + '/' + f;
        list[path.basename(absPath, ".js")] = require(absPath);
    });
    return list;
})();