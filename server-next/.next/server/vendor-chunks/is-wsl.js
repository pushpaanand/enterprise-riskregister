"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-wsl";
exports.ids = ["vendor-chunks/is-wsl"];
exports.modules = {

/***/ "(rsc)/./node_modules/is-wsl/index.js":
/*!**************************************!*\
  !*** ./node_modules/is-wsl/index.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nconst os = __webpack_require__(/*! os */ \"os\");\nconst fs = __webpack_require__(/*! fs */ \"fs\");\nconst isDocker = __webpack_require__(/*! is-docker */ \"(rsc)/./node_modules/is-docker/index.js\");\n\nconst isWsl = () => {\n\tif (process.platform !== 'linux') {\n\t\treturn false;\n\t}\n\n\tif (os.release().toLowerCase().includes('microsoft')) {\n\t\tif (isDocker()) {\n\t\t\treturn false;\n\t\t}\n\n\t\treturn true;\n\t}\n\n\ttry {\n\t\treturn fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft') ?\n\t\t\t!isDocker() : false;\n\t} catch (_) {\n\t\treturn false;\n\t}\n};\n\nif (process.env.__IS_WSL_TEST__) {\n\tmodule.exports = isWsl;\n} else {\n\tmodule.exports = isWsl();\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaXMtd3NsL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFhO0FBQ2IsV0FBVyxtQkFBTyxDQUFDLGNBQUk7QUFDdkIsV0FBVyxtQkFBTyxDQUFDLGNBQUk7QUFDdkIsaUJBQWlCLG1CQUFPLENBQUMsMERBQVc7O0FBRXBDO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9lcm0tbmV4dC1hcGkvLi9ub2RlX21vZHVsZXMvaXMtd3NsL2luZGV4LmpzP2ViOWEiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuY29uc3Qgb3MgPSByZXF1aXJlKCdvcycpO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgaXNEb2NrZXIgPSByZXF1aXJlKCdpcy1kb2NrZXInKTtcblxuY29uc3QgaXNXc2wgPSAoKSA9PiB7XG5cdGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnbGludXgnKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0aWYgKG9zLnJlbGVhc2UoKS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKCdtaWNyb3NvZnQnKSkge1xuXHRcdGlmIChpc0RvY2tlcigpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHR0cnkge1xuXHRcdHJldHVybiBmcy5yZWFkRmlsZVN5bmMoJy9wcm9jL3ZlcnNpb24nLCAndXRmOCcpLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoJ21pY3Jvc29mdCcpID9cblx0XHRcdCFpc0RvY2tlcigpIDogZmFsc2U7XG5cdH0gY2F0Y2ggKF8pIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn07XG5cbmlmIChwcm9jZXNzLmVudi5fX0lTX1dTTF9URVNUX18pIHtcblx0bW9kdWxlLmV4cG9ydHMgPSBpc1dzbDtcbn0gZWxzZSB7XG5cdG1vZHVsZS5leHBvcnRzID0gaXNXc2woKTtcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/is-wsl/index.js\n");

/***/ })

};
;