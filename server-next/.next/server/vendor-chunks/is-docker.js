"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-docker";
exports.ids = ["vendor-chunks/is-docker"];
exports.modules = {

/***/ "(rsc)/./node_modules/is-docker/index.js":
/*!*****************************************!*\
  !*** ./node_modules/is-docker/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nconst fs = __webpack_require__(/*! fs */ \"fs\");\n\nlet isDocker;\n\nfunction hasDockerEnv() {\n\ttry {\n\t\tfs.statSync('/.dockerenv');\n\t\treturn true;\n\t} catch (_) {\n\t\treturn false;\n\t}\n}\n\nfunction hasDockerCGroup() {\n\ttry {\n\t\treturn fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');\n\t} catch (_) {\n\t\treturn false;\n\t}\n}\n\nmodule.exports = () => {\n\tif (isDocker === undefined) {\n\t\tisDocker = hasDockerEnv() || hasDockerCGroup();\n\t}\n\n\treturn isDocker;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaXMtZG9ja2VyL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFhO0FBQ2IsV0FBVyxtQkFBTyxDQUFDLGNBQUk7O0FBRXZCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9lcm0tbmV4dC1hcGkvLi9ub2RlX21vZHVsZXMvaXMtZG9ja2VyL2luZGV4LmpzP2E5NWIiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuXG5sZXQgaXNEb2NrZXI7XG5cbmZ1bmN0aW9uIGhhc0RvY2tlckVudigpIHtcblx0dHJ5IHtcblx0XHRmcy5zdGF0U3luYygnLy5kb2NrZXJlbnYnKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoXykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5mdW5jdGlvbiBoYXNEb2NrZXJDR3JvdXAoKSB7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIGZzLnJlYWRGaWxlU3luYygnL3Byb2Mvc2VsZi9jZ3JvdXAnLCAndXRmOCcpLmluY2x1ZGVzKCdkb2NrZXInKTtcblx0fSBjYXRjaCAoXykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcblx0aWYgKGlzRG9ja2VyID09PSB1bmRlZmluZWQpIHtcblx0XHRpc0RvY2tlciA9IGhhc0RvY2tlckVudigpIHx8IGhhc0RvY2tlckNHcm91cCgpO1xuXHR9XG5cblx0cmV0dXJuIGlzRG9ja2VyO1xufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/is-docker/index.js\n");

/***/ })

};
;