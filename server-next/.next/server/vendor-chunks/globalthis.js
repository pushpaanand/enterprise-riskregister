"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/globalthis";
exports.ids = ["vendor-chunks/globalthis"];
exports.modules = {

/***/ "(rsc)/./node_modules/globalthis/implementation.js":
/*!***************************************************!*\
  !*** ./node_modules/globalthis/implementation.js ***!
  \***************************************************/
/***/ ((module) => {

eval("\n\nmodule.exports = global;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9pbXBsZW1lbnRhdGlvbi5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYiIsInNvdXJjZXMiOlsid2VicGFjazovL2VybS1uZXh0LWFwaS8uL25vZGVfbW9kdWxlcy9nbG9iYWx0aGlzL2ltcGxlbWVudGF0aW9uLmpzP2FmN2EiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdsb2JhbDtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/globalthis/implementation.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/globalthis/index.js":
/*!******************************************!*\
  !*** ./node_modules/globalthis/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar defineProperties = __webpack_require__(/*! define-properties */ \"(rsc)/./node_modules/define-properties/index.js\");\n\nvar implementation = __webpack_require__(/*! ./implementation */ \"(rsc)/./node_modules/globalthis/implementation.js\");\nvar getPolyfill = __webpack_require__(/*! ./polyfill */ \"(rsc)/./node_modules/globalthis/polyfill.js\");\nvar shim = __webpack_require__(/*! ./shim */ \"(rsc)/./node_modules/globalthis/shim.js\");\n\nvar polyfill = getPolyfill();\n\nvar getGlobal = function () { return polyfill; };\n\ndefineProperties(getGlobal, {\n\tgetPolyfill: getPolyfill,\n\timplementation: implementation,\n\tshim: shim\n});\n\nmodule.exports = getGlobal;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYix1QkFBdUIsbUJBQU8sQ0FBQywwRUFBbUI7O0FBRWxELHFCQUFxQixtQkFBTyxDQUFDLDJFQUFrQjtBQUMvQyxrQkFBa0IsbUJBQU8sQ0FBQywrREFBWTtBQUN0QyxXQUFXLG1CQUFPLENBQUMsdURBQVE7O0FBRTNCOztBQUVBLDhCQUE4Qjs7QUFFOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZXJtLW5leHQtYXBpLy4vbm9kZV9tb2R1bGVzL2dsb2JhbHRoaXMvaW5kZXguanM/MmYxNyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZpbmVQcm9wZXJ0aWVzID0gcmVxdWlyZSgnZGVmaW5lLXByb3BlcnRpZXMnKTtcblxudmFyIGltcGxlbWVudGF0aW9uID0gcmVxdWlyZSgnLi9pbXBsZW1lbnRhdGlvbicpO1xudmFyIGdldFBvbHlmaWxsID0gcmVxdWlyZSgnLi9wb2x5ZmlsbCcpO1xudmFyIHNoaW0gPSByZXF1aXJlKCcuL3NoaW0nKTtcblxudmFyIHBvbHlmaWxsID0gZ2V0UG9seWZpbGwoKTtcblxudmFyIGdldEdsb2JhbCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBvbHlmaWxsOyB9O1xuXG5kZWZpbmVQcm9wZXJ0aWVzKGdldEdsb2JhbCwge1xuXHRnZXRQb2x5ZmlsbDogZ2V0UG9seWZpbGwsXG5cdGltcGxlbWVudGF0aW9uOiBpbXBsZW1lbnRhdGlvbixcblx0c2hpbTogc2hpbVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0R2xvYmFsO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/globalthis/index.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/globalthis/polyfill.js":
/*!*********************************************!*\
  !*** ./node_modules/globalthis/polyfill.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar implementation = __webpack_require__(/*! ./implementation */ \"(rsc)/./node_modules/globalthis/implementation.js\");\n\nmodule.exports = function getPolyfill() {\n\tif (typeof global !== 'object' || !global || global.Math !== Math || global.Array !== Array) {\n\t\treturn implementation;\n\t}\n\treturn global;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9wb2x5ZmlsbC5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYixxQkFBcUIsbUJBQU8sQ0FBQywyRUFBa0I7O0FBRS9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2VybS1uZXh0LWFwaS8uL25vZGVfbW9kdWxlcy9nbG9iYWx0aGlzL3BvbHlmaWxsLmpzPzU0YTUiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW1wbGVtZW50YXRpb24gPSByZXF1aXJlKCcuL2ltcGxlbWVudGF0aW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0UG9seWZpbGwoKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsICE9PSAnb2JqZWN0JyB8fCAhZ2xvYmFsIHx8IGdsb2JhbC5NYXRoICE9PSBNYXRoIHx8IGdsb2JhbC5BcnJheSAhPT0gQXJyYXkpIHtcblx0XHRyZXR1cm4gaW1wbGVtZW50YXRpb247XG5cdH1cblx0cmV0dXJuIGdsb2JhbDtcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/globalthis/polyfill.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/globalthis/shim.js":
/*!*****************************************!*\
  !*** ./node_modules/globalthis/shim.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar define = __webpack_require__(/*! define-properties */ \"(rsc)/./node_modules/define-properties/index.js\");\nvar gOPD = __webpack_require__(/*! gopd */ \"(rsc)/./node_modules/gopd/index.js\");\nvar getPolyfill = __webpack_require__(/*! ./polyfill */ \"(rsc)/./node_modules/globalthis/polyfill.js\");\n\nmodule.exports = function shimGlobal() {\n\tvar polyfill = getPolyfill();\n\tif (define.supportsDescriptors) {\n\t\tvar descriptor = gOPD(polyfill, 'globalThis');\n\t\tif (\n\t\t\t!descriptor\n\t\t\t|| (\n\t\t\t\tdescriptor.configurable\n\t\t\t\t&& (descriptor.enumerable || !descriptor.writable || globalThis !== polyfill)\n\t\t\t)\n\t\t) {\n\t\t\tObject.defineProperty(polyfill, 'globalThis', {\n\t\t\t\tconfigurable: true,\n\t\t\t\tenumerable: false,\n\t\t\t\tvalue: polyfill,\n\t\t\t\twritable: true\n\t\t\t});\n\t\t}\n\t} else if (typeof globalThis !== 'object' || globalThis !== polyfill) {\n\t\tpolyfill.globalThis = polyfill;\n\t}\n\treturn polyfill;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZ2xvYmFsdGhpcy9zaGltLmpzIiwibWFwcGluZ3MiOiJBQUFhOztBQUViLGFBQWEsbUJBQU8sQ0FBQywwRUFBbUI7QUFDeEMsV0FBVyxtQkFBTyxDQUFDLGdEQUFNO0FBQ3pCLGtCQUFrQixtQkFBTyxDQUFDLCtEQUFZOztBQUV0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2VybS1uZXh0LWFwaS8uL25vZGVfbW9kdWxlcy9nbG9iYWx0aGlzL3NoaW0uanM/ZTExOSJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBkZWZpbmUgPSByZXF1aXJlKCdkZWZpbmUtcHJvcGVydGllcycpO1xudmFyIGdPUEQgPSByZXF1aXJlKCdnb3BkJyk7XG52YXIgZ2V0UG9seWZpbGwgPSByZXF1aXJlKCcuL3BvbHlmaWxsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc2hpbUdsb2JhbCgpIHtcblx0dmFyIHBvbHlmaWxsID0gZ2V0UG9seWZpbGwoKTtcblx0aWYgKGRlZmluZS5zdXBwb3J0c0Rlc2NyaXB0b3JzKSB7XG5cdFx0dmFyIGRlc2NyaXB0b3IgPSBnT1BEKHBvbHlmaWxsLCAnZ2xvYmFsVGhpcycpO1xuXHRcdGlmIChcblx0XHRcdCFkZXNjcmlwdG9yXG5cdFx0XHR8fCAoXG5cdFx0XHRcdGRlc2NyaXB0b3IuY29uZmlndXJhYmxlXG5cdFx0XHRcdCYmIChkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgIWRlc2NyaXB0b3Iud3JpdGFibGUgfHwgZ2xvYmFsVGhpcyAhPT0gcG9seWZpbGwpXG5cdFx0XHQpXG5cdFx0KSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkocG9seWZpbGwsICdnbG9iYWxUaGlzJywge1xuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWUsXG5cdFx0XHRcdGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdFx0XHR2YWx1ZTogcG9seWZpbGwsXG5cdFx0XHRcdHdyaXRhYmxlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cdH0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbFRoaXMgIT09ICdvYmplY3QnIHx8IGdsb2JhbFRoaXMgIT09IHBvbHlmaWxsKSB7XG5cdFx0cG9seWZpbGwuZ2xvYmFsVGhpcyA9IHBvbHlmaWxsO1xuXHR9XG5cdHJldHVybiBwb2x5ZmlsbDtcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/globalthis/shim.js\n");

/***/ })

};
;