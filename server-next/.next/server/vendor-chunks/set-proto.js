"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/set-proto";
exports.ids = ["vendor-chunks/set-proto"];
exports.modules = {

/***/ "(rsc)/./node_modules/set-proto/Object.setPrototypeOf.js":
/*!*********************************************************!*\
  !*** ./node_modules/set-proto/Object.setPrototypeOf.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar $Object = __webpack_require__(/*! es-object-atoms */ \"(rsc)/./node_modules/es-object-atoms/index.js\");\n\n/** @type {import('./Object.setPrototypeOf')} */\nmodule.exports = $Object.setPrototypeOf || null;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvc2V0LXByb3RvL09iamVjdC5zZXRQcm90b3R5cGVPZi5qcyIsIm1hcHBpbmdzIjoiQUFBYTs7QUFFYixjQUFjLG1CQUFPLENBQUMsc0VBQWlCOztBQUV2QyxXQUFXLG1DQUFtQztBQUM5QyIsInNvdXJjZXMiOlsid2VicGFjazovL2VybS1uZXh0LWFwaS8uL25vZGVfbW9kdWxlcy9zZXQtcHJvdG8vT2JqZWN0LnNldFByb3RvdHlwZU9mLmpzP2NlMGIiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgJE9iamVjdCA9IHJlcXVpcmUoJ2VzLW9iamVjdC1hdG9tcycpO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi9PYmplY3Quc2V0UHJvdG90eXBlT2YnKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gJE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fCBudWxsO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/set-proto/Object.setPrototypeOf.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/set-proto/Reflect.setPrototypeOf.js":
/*!**********************************************************!*\
  !*** ./node_modules/set-proto/Reflect.setPrototypeOf.js ***!
  \**********************************************************/
/***/ ((module) => {

eval("\n\n/** @type {import('./Reflect.setPrototypeOf')} */\nmodule.exports = (typeof Reflect !== 'undefined' && Reflect.setPrototypeOf) || null;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvc2V0LXByb3RvL1JlZmxlY3Quc2V0UHJvdG90eXBlT2YuanMiLCJtYXBwaW5ncyI6IkFBQWE7O0FBRWIsV0FBVyxvQ0FBb0M7QUFDL0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9lcm0tbmV4dC1hcGkvLi9ub2RlX21vZHVsZXMvc2V0LXByb3RvL1JlZmxlY3Quc2V0UHJvdG90eXBlT2YuanM/Y2YwNCJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuL1JlZmxlY3Quc2V0UHJvdG90eXBlT2YnKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gKHR5cGVvZiBSZWZsZWN0ICE9PSAndW5kZWZpbmVkJyAmJiBSZWZsZWN0LnNldFByb3RvdHlwZU9mKSB8fCBudWxsO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/set-proto/Reflect.setPrototypeOf.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/set-proto/index.js":
/*!*****************************************!*\
  !*** ./node_modules/set-proto/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar reflectSetProto = __webpack_require__(/*! ./Reflect.setPrototypeOf */ \"(rsc)/./node_modules/set-proto/Reflect.setPrototypeOf.js\");\nvar originalSetProto = __webpack_require__(/*! ./Object.setPrototypeOf */ \"(rsc)/./node_modules/set-proto/Object.setPrototypeOf.js\");\n\nvar setDunderProto = __webpack_require__(/*! dunder-proto/set */ \"(rsc)/./node_modules/dunder-proto/set.js\");\n\nvar $TypeError = __webpack_require__(/*! es-errors/type */ \"(rsc)/./node_modules/es-errors/type.js\");\n\n/** @type {import('.')} */\nmodule.exports = reflectSetProto\n\t? function setProto(O, proto) {\n\t\t// @ts-expect-error TS can't narrow inside a closure, for some reason\n\t\tif (reflectSetProto(O, proto)) {\n\t\t\treturn O;\n\t\t}\n\t\tthrow new $TypeError('Reflect.setPrototypeOf: failed to set [[Prototype]]');\n\t}\n\t: originalSetProto || (\n\t\tsetDunderProto ? function setProto(O, proto) {\n\t\t\t// @ts-expect-error TS can't narrow inside a closure, for some reason\n\t\t\tsetDunderProto(O, proto);\n\t\t\treturn O;\n\t\t} : null\n\t);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvc2V0LXByb3RvL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFhOztBQUViLHNCQUFzQixtQkFBTyxDQUFDLDBGQUEwQjtBQUN4RCx1QkFBdUIsbUJBQU8sQ0FBQyx3RkFBeUI7O0FBRXhELHFCQUFxQixtQkFBTyxDQUFDLGtFQUFrQjs7QUFFL0MsaUJBQWlCLG1CQUFPLENBQUMsOERBQWdCOztBQUV6QyxXQUFXLGFBQWE7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0oiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9lcm0tbmV4dC1hcGkvLi9ub2RlX21vZHVsZXMvc2V0LXByb3RvL2luZGV4LmpzPzUzYmEiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVmbGVjdFNldFByb3RvID0gcmVxdWlyZSgnLi9SZWZsZWN0LnNldFByb3RvdHlwZU9mJyk7XG52YXIgb3JpZ2luYWxTZXRQcm90byA9IHJlcXVpcmUoJy4vT2JqZWN0LnNldFByb3RvdHlwZU9mJyk7XG5cbnZhciBzZXREdW5kZXJQcm90byA9IHJlcXVpcmUoJ2R1bmRlci1wcm90by9zZXQnKTtcblxudmFyICRUeXBlRXJyb3IgPSByZXF1aXJlKCdlcy1lcnJvcnMvdHlwZScpO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLicpfSAqL1xubW9kdWxlLmV4cG9ydHMgPSByZWZsZWN0U2V0UHJvdG9cblx0PyBmdW5jdGlvbiBzZXRQcm90byhPLCBwcm90bykge1xuXHRcdC8vIEB0cy1leHBlY3QtZXJyb3IgVFMgY2FuJ3QgbmFycm93IGluc2lkZSBhIGNsb3N1cmUsIGZvciBzb21lIHJlYXNvblxuXHRcdGlmIChyZWZsZWN0U2V0UHJvdG8oTywgcHJvdG8pKSB7XG5cdFx0XHRyZXR1cm4gTztcblx0XHR9XG5cdFx0dGhyb3cgbmV3ICRUeXBlRXJyb3IoJ1JlZmxlY3Quc2V0UHJvdG90eXBlT2Y6IGZhaWxlZCB0byBzZXQgW1tQcm90b3R5cGVdXScpO1xuXHR9XG5cdDogb3JpZ2luYWxTZXRQcm90byB8fCAoXG5cdFx0c2V0RHVuZGVyUHJvdG8gPyBmdW5jdGlvbiBzZXRQcm90byhPLCBwcm90bykge1xuXHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvciBUUyBjYW4ndCBuYXJyb3cgaW5zaWRlIGEgY2xvc3VyZSwgZm9yIHNvbWUgcmVhc29uXG5cdFx0XHRzZXREdW5kZXJQcm90byhPLCBwcm90byk7XG5cdFx0XHRyZXR1cm4gTztcblx0XHR9IDogbnVsbFxuXHQpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/set-proto/index.js\n");

/***/ })

};
;