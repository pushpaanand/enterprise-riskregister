"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/define-lazy-prop";
exports.ids = ["vendor-chunks/define-lazy-prop"];
exports.modules = {

/***/ "(rsc)/./node_modules/define-lazy-prop/index.js":
/*!************************************************!*\
  !*** ./node_modules/define-lazy-prop/index.js ***!
  \************************************************/
/***/ ((module) => {

eval("\nmodule.exports = (object, propertyName, fn) => {\n\tconst define = value => Object.defineProperty(object, propertyName, {value, enumerable: true, writable: true});\n\n\tObject.defineProperty(object, propertyName, {\n\t\tconfigurable: true,\n\t\tenumerable: true,\n\t\tget() {\n\t\t\tconst result = fn();\n\t\t\tdefine(result);\n\t\t\treturn result;\n\t\t},\n\t\tset(value) {\n\t\t\tdefine(value);\n\t\t}\n\t});\n\n\treturn object;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZGVmaW5lLWxhenktcHJvcC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTtBQUNiO0FBQ0Esc0VBQXNFLHdDQUF3Qzs7QUFFOUc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZXJtLW5leHQtYXBpLy4vbm9kZV9tb2R1bGVzL2RlZmluZS1sYXp5LXByb3AvaW5kZXguanM/YzYzOSJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IChvYmplY3QsIHByb3BlcnR5TmFtZSwgZm4pID0+IHtcblx0Y29uc3QgZGVmaW5lID0gdmFsdWUgPT4gT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgcHJvcGVydHlOYW1lLCB7dmFsdWUsIGVudW1lcmFibGU6IHRydWUsIHdyaXRhYmxlOiB0cnVlfSk7XG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgcHJvcGVydHlOYW1lLCB7XG5cdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0Z2V0KCkge1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gZm4oKTtcblx0XHRcdGRlZmluZShyZXN1bHQpO1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9LFxuXHRcdHNldCh2YWx1ZSkge1xuXHRcdFx0ZGVmaW5lKHZhbHVlKTtcblx0XHR9XG5cdH0pO1xuXG5cdHJldHVybiBvYmplY3Q7XG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/define-lazy-prop/index.js\n");

/***/ })

};
;