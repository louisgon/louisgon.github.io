// vite.config.js
import { defineConfig } from "file:///Users/louis/Github/louisgon/louisgon.github.io/.yarn/__virtual__/vite-virtual-f430c56ed8/4/.yarn/berry/cache/vite-npm-5.4.11-9da365ef2b-10c0.zip/node_modules/vite/dist/node/index.js";
import { ViteMinifyPlugin } from "file:///Users/louis/Github/louisgon/louisgon.github.io/.yarn/__virtual__/vite-plugin-minify-virtual-3cd648fcb4/4/.yarn/berry/cache/vite-plugin-minify-npm-2.0.1-0c543f19a1-10c0.zip/node_modules/vite-plugin-minify/dist/index.cjs";
import fs2 from "node:fs";
import twig from "file:///Users/louis/.yarn/berry/cache/@vituum-vite-plugin-twig-npm-1.1.0-9296def893-10c0.zip/node_modules/@vituum/vite-plugin-twig/index.js";
import path from "node:path";
import sassGlobImports from "file:///Users/louis/Github/louisgon/louisgon.github.io/.yarn/__virtual__/vite-plugin-sass-glob-import-virtual-072e6360c8/4/.yarn/berry/cache/vite-plugin-sass-glob-import-npm-4.0.0-96988ae2a6-10c0.zip/node_modules/vite-plugin-sass-glob-import/dist/index.mjs";
import viteImagemin from "file:///Users/louis/Github/louisgon/louisgon.github.io/.yarn/__virtual__/vite-plugin-imagemin-virtual-3f8de85946/4/.yarn/berry/cache/vite-plugin-imagemin-npm-0.6.1-f240842e35-10c0.zip/node_modules/vite-plugin-imagemin/dist/index.mjs";
import vituum from "file:///Users/louis/.yarn/berry/cache/vituum-npm-1.1.1-f42d94cf8f-10c0.zip/node_modules/vituum/src/index.js";

// helpers.js
function getArrayWithPrefix(array, prefix) {
  return array.filter(Boolean).map((item) => `${prefix}${item}`);
}
function getCssVariables(object) {
  let variables = [];
  object = getObject(object);
  for (let key in object) {
    if (object.hasOwnProperty(key) && object[key] !== "") {
      variables.push(`--${key}: ${object[key]};`);
    }
  }
  return variables.join(" ");
}
function getClassList(args) {
  const object = getObject(args);
  const name = object["name"] ?? "";
  const block = object["block"] ?? "" ? getBlockClasses(object["block"]) : "";
  const classes = typeof object["classes"] === "string" || typeof object["classes"] === null ? object["classes"] : getClassListClasses(object["classes"]);
  const modifiers = object["modifiers"] ?? "" ? getArrayWithPrefix(object["modifiers"] ?? [], `${name}--`) : [];
  const scopes = object["scopes"] ?? "" ? getArrayWithPrefix(object["scopes"], "s-") : [];
  const spacing = object["spacing"] ?? "" ? getSpacingClasses(object["spacing"]) : "";
  const utilities = object["utilities"] ?? "" ? getUtilityClasses(object["utilities"]) : [];
  const vendors = object["vendors"] ?? [];
  const scripts = object["scripts"] ?? "" ? getArrayWithPrefix(object["scripts"], "js-") : [];
  return [classes, name, block, ...modifiers, ...scopes, spacing, ...utilities, ...vendors, ...scripts].filter(Boolean).join(" ");
}
function getClassListClasses(object) {
  if (typeof object !== "object") {
    return "";
  }
  return getClassList(object);
}
function getHtmlAttrs(object) {
  const attributes = [];
  const sorted = getObjectSortedByKeys(object, [
    "src",
    "class",
    "href",
    "data",
    "aria",
    "role",
    "style"
  ]);
  for (let key in sorted) {
    if (object.hasOwnProperty(key) && object[key] !== "") {
      attributes.push(`${key}="${object[key]}"`);
    }
  }
  return attributes.join(" ");
}
function getObject(object) {
  delete object._keys;
  return object;
}
function getObjectSortedByKeys(object, keys) {
  const entries = Object.entries(object);
  entries.sort(([keyA], [keyB]) => {
    const [prefixA, prefixB] = [keyA, keyB].map((key) => key.split("-")[0]);
    const [indexA, indexB] = [prefixA, prefixB].map((prefix) => keys.indexOf(prefix));
    if (indexA === indexB) {
      return keyA.localeCompare(keyB);
    }
    if (indexA === -1) {
      return 1;
    }
    if (indexB === -1) {
      return -1;
    }
    return indexA - indexB;
  });
  return Object.fromEntries(entries);
}
function getObjectWithNestedKeys(object, key) {
  const nested = getObject(object[key]);
  for (let nestedKey in nested) {
    if (!nested.hasOwnProperty(nestedKey)) {
      continue;
    }
    object[`${key}-${getStringKebabCase(nestedKey)}`] = nested[nestedKey];
  }
  return object;
}
function getPropertyValidation(property, type) {
  switch (type) {
    case "object":
      return typeof property === "object" && property !== null;
    case "string":
      return typeof property === "string" && property !== "";
    default:
      return false;
  }
}
function getSpacingClasses(object) {
  let classes = [];
  object = getObject(object);
  let margin_top = (object["mt"] ?? "") !== "" ? getUtilityBreakpointClasses(object["mt"], "mt") : "";
  let padding_top = (object["pt"] ?? "") !== "" ? getUtilityBreakpointClasses(object["pt"], "pt") : "";
  let padding_bottom = (object["pb"] ?? "") !== "" ? getUtilityBreakpointClasses(object["pb"], "pb") : "";
  let margin_bottom = (object["mb"] ?? "") !== "" ? getUtilityBreakpointClasses(object["mb"], "mb") : "";
  return [margin_top, padding_top, padding_bottom, margin_bottom].filter(Boolean).join(" ");
}
function getStringKebabCase(string) {
  return string.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();
}
function getUtilityBreakpointClasses(object, prefix) {
  let classes = [];
  object = getObject(object);
  let base = (object["base"] ?? "") !== "" ? `u-${prefix}-${object["base"]}` : "";
  let md = (object["md"] ?? "") !== "" ? `md:u-${prefix}-${object["md"]}` : "";
  let lg = (object["lg"] ?? "") !== "" ? `lg:u-${prefix}-${object["lg"]}` : "";
  return [base, md, lg].filter(Boolean).join(" ");
}
function getUtilityClasses(utilities) {
  return Array.isArray(utilities) ? getArrayWithPrefix(utilities, "u-") : getUtilityObject(utilities);
}
function getUtilityObject(object) {
  let mergedArray = [];
  object = getObject(object);
  for (let key in object) {
    if (object.hasOwnProperty(key) && object[key] !== "") {
      const value = typeof object[key] == "object" ? getUtilityBreakpointClasses(object[key], key) : `u-${key}-${object[key]}`;
      mergedArray.push(value);
    }
  }
  return mergedArray.filter(Boolean);
}
function classList(args = {}) {
  return getClassList(args);
}
function htmlAttr(args = {}) {
  let object = getObject(args);
  let tag = "";
  object["animateIn"] = object["animateIn"] || "";
  object["aria"] = object["aria"] || "";
  object["class"] = object["class"] || "";
  object["data"] = object["data"] ?? {};
  object["module"] = object["module"] || "";
  object["style"] = object["style"] || "";
  object["tag"] = object["tag"] || "";
  if (getPropertyValidation(object["tag"], "string")) {
    tag = object["tag"];
  }
  delete object["tag"];
  if (getPropertyValidation(object["aria"], "object")) {
    object = getObjectWithNestedKeys(object, "aria");
  }
  delete object["aria"];
  if (getPropertyValidation(object["class"], "object")) {
    object["class"] = getClassList(object["class"]);
  }
  if (getPropertyValidation(object["animateIn"], "string")) {
    object["data"]["animateIn"] = object["animateIn"];
  }
  delete object["animateIn"];
  if (getPropertyValidation(object["module"], "string")) {
    object["data"]["module"] = object["module"];
  }
  delete object["module"];
  if (getPropertyValidation(object["data"], "object")) {
    object = getObjectWithNestedKeys(object, "data");
  }
  delete object["data"];
  if (getPropertyValidation(object["style"], "object")) {
    object["style"] = getCssVariables(object["style"]);
  }
  return [tag, getHtmlAttrs(object)].filter(Boolean).join(" ");
}

// helpers/base64.js
function base64(data = "", type = "encode") {
  return type === "encode" ? encode(data) : decode(data);
}
function decode(data = "") {
  return btoa(typeof data === "object" ? JSON.stringify(data) : data);
}
function encode(data = "") {
  return btoa(typeof data === "object" ? JSON.stringify(data) : data);
}

// helpers/iconSvg.js
import fs from "node:fs";
var { JSDOM } = jsdom;
function iconSvg(name = "") {
  const svgPath = `./src/includes/icons/${name}.svg`;
  const fileExists = fs.existsSync(svgPath);
  if (!fileExists) {
    return;
  }
  const svg = fs.readFileSync(svgPath, "utf8");
  console.log("svg", svg);
  return name;
}

// vite.config.js
var vite_config_default = defineConfig({
  base: "/",
  build: {
    assetsInlineLimit: 0,
    emptyOutDir: true,
    modulePreload: false,
    outDir: "./dist",
    rollupOptions: {
      input: [
        "./src/js/*.js",
        "./src/view/**/*.{twig,html}"
      ],
      output: {
        entryFileNames: "js/[hash].js",
        chunkFileNames: "js/[hash].js",
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split(".").pop();
          if (/jpe?g|png|svg|gif|webp|ico/i.test(extType)) {
            extType = "img";
          }
          if (/woff?2|ttf|eot/i.test(extType)) {
            extType = "font";
          }
          return `${extType}/[hash][extname]`;
        }
      }
    }
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        silenceDeprecations: ["mixed-decls"]
      }
    }
  },
  plugins: [
    vituum({
      pages: {
        dir: "./src/view"
      }
    }),
    twig({
      functions: getTwigFunctions(),
      globals: getTwigGlobals(),
      namespaces: getTwigNamespaces(),
      root: "./src"
    }),
    sassGlobImports(),
    viteImagemin({
      gifsicle: {
        optimizationLevel: 1,
        interlaced: false
      },
      optipng: {
        optimizationLevel: 5
      },
      mozjpeg: {
        quality: 75,
        progressive: true
      },
      pngquant: {
        quality: [0.7, 0.9],
        speed: 7
      },
      svgo: {
        plugins: [
          {
            name: "removeViewBox",
            active: false
          },
          {
            name: "convertShapeToPath",
            active: false
          },
          {
            name: "convertEllipseToCircle",
            active: false
          }
        ]
      }
    }),
    ViteMinifyPlugin({
      collapseWhitespace: true,
      includeAutoGeneratedTags: false,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true
    })
  ],
  preview: {
    port: 3e3,
    host: true
  },
  server: {
    port: 5173,
    host: false
  }
});
function getTwigFunctions() {
  return {
    base64,
    classList,
    htmlAttr,
    iconSvg
  };
}
function getTwigGlobals() {
  const data = {};
  const dataFolder = path.join(process.cwd(), "src", "data");
  const dataFiles = fs2.readdirSync(dataFolder).filter((file) => file.endsWith(".json")) || [];
  dataFiles.forEach((file) => {
    const filePath = path.join(process.cwd(), "src", "data", file);
    const fileContent = fs2.readFileSync(filePath, "utf8") || "{}";
    const fileData = JSON.parse(fileContent);
    const fileName = file.replace(".json", "").replace(/[\s-]+/g, "_").replace(/[^a-z_]+/g, "").replace(/(_)./g, (s) => s.slice(-1).toUpperCase());
    data[fileName] = fileData;
  });
  return data;
}
function getTwigNamespaces() {
  const namespaceList = [
    "assets",
    "components",
    "icons",
    "layouts",
    "objects",
    "partials",
    "templates"
  ];
  return namespaceList.reduce((acc, namespace) => {
    return {
      ...acc,
      [namespace]: `./src/includes/${namespace}`
    };
  }, {});
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAiaGVscGVycy5qcyIsICJoZWxwZXJzL2Jhc2U2NC5qcyIsICJoZWxwZXJzL2ljb25TdmcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbG91aXMvR2l0aHViL2xvdWlzZ29uL2xvdWlzZ29uLmdpdGh1Yi5pb1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2xvdWlzL0dpdGh1Yi9sb3Vpc2dvbi9sb3Vpc2dvbi5naXRodWIuaW8vdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2xvdWlzL0dpdGh1Yi9sb3Vpc2dvbi9sb3Vpc2dvbi5naXRodWIuaW8vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgVml0ZU1pbmlmeVBsdWdpbiB9IGZyb20gJ3ZpdGUtcGx1Z2luLW1pbmlmeSdcbmltcG9ydCBmcyBmcm9tICdub2RlOmZzJ1xuaW1wb3J0IHR3aWcgZnJvbSAnQHZpdHV1bS92aXRlLXBsdWdpbi10d2lnJ1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IHNhc3NHbG9iSW1wb3J0cyBmcm9tICd2aXRlLXBsdWdpbi1zYXNzLWdsb2ItaW1wb3J0J1xuaW1wb3J0IHZpdGVJbWFnZW1pbiBmcm9tICd2aXRlLXBsdWdpbi1pbWFnZW1pbidcbmltcG9ydCB2aXR1dW0gZnJvbSAndml0dXVtJ1xuXG5pbXBvcnQgeyBjbGFzc0xpc3QsIGh0bWxBdHRyIH0gZnJvbSAnLi9oZWxwZXJzLmpzJ1xuaW1wb3J0IGJhc2U2NCBmcm9tICcuL2hlbHBlcnMvYmFzZTY0LmpzJ1xuaW1wb3J0IGljb25TdmcgZnJvbSAnLi9oZWxwZXJzL2ljb25TdmcuanMnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6ICcvJyxcbiAgYnVpbGQ6IHtcbiAgICBhc3NldHNJbmxpbmVMaW1pdDogMCxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBtb2R1bGVQcmVsb2FkOiBmYWxzZSxcbiAgICBvdXREaXI6ICcuL2Rpc3QnLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiBbXG4gICAgICAgICcuL3NyYy9qcy8qLmpzJyxcbiAgICAgICAgJy4vc3JjL3ZpZXcvKiovKi57dHdpZyxodG1sfScsXG4gICAgICBdLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnanMvW2hhc2hdLmpzJyxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdqcy9baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGxldCBleHRUeXBlID0gYXNzZXRJbmZvLm5hbWUuc3BsaXQoJy4nKS5wb3AoKVxuXG4gICAgICAgICAgaWYgKC9qcGU/Z3xwbmd8c3ZnfGdpZnx3ZWJwfGljby9pLnRlc3QoZXh0VHlwZSkpIHtcbiAgICAgICAgICAgIGV4dFR5cGUgPSAnaW1nJ1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICgvd29mZj8yfHR0Znxlb3QvaS50ZXN0KGV4dFR5cGUpKSB7XG4gICAgICAgICAgICBleHRUeXBlID0gJ2ZvbnQnXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIGAke2V4dFR5cGV9L1toYXNoXVtleHRuYW1lXWBcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgY3NzOiB7XG4gICAgZGV2U291cmNlbWFwOiB0cnVlLFxuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgYXBpOiAnbW9kZXJuLWNvbXBpbGVyJyxcbiAgICAgICAgc2lsZW5jZURlcHJlY2F0aW9uczogWydtaXhlZC1kZWNscyddLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgdml0dXVtKHtcbiAgICAgIHBhZ2VzOiB7XG4gICAgICAgIGRpcjogJy4vc3JjL3ZpZXcnLFxuICAgICAgfSxcbiAgICB9KSxcbiAgICB0d2lnKHtcbiAgICAgIGZ1bmN0aW9uczogZ2V0VHdpZ0Z1bmN0aW9ucygpLFxuICAgICAgZ2xvYmFsczogZ2V0VHdpZ0dsb2JhbHMoKSxcbiAgICAgIG5hbWVzcGFjZXM6IGdldFR3aWdOYW1lc3BhY2VzKCksXG4gICAgICByb290OiAnLi9zcmMnLFxuICAgIH0pLFxuICAgIHNhc3NHbG9iSW1wb3J0cygpLFxuICAgIHZpdGVJbWFnZW1pbih7XG4gICAgICBnaWZzaWNsZToge1xuICAgICAgICBvcHRpbWl6YXRpb25MZXZlbDogMSxcbiAgICAgICAgaW50ZXJsYWNlZDogZmFsc2UsXG4gICAgICB9LFxuICAgICAgb3B0aXBuZzoge1xuICAgICAgICBvcHRpbWl6YXRpb25MZXZlbDogNSxcbiAgICAgIH0sXG4gICAgICBtb3pqcGVnOiB7XG4gICAgICAgIHF1YWxpdHk6IDc1LCBwcm9ncmVzc2l2ZTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBwbmdxdWFudDoge1xuICAgICAgICBxdWFsaXR5OiBbMC43LCAwLjldLFxuICAgICAgICBzcGVlZDogNyxcbiAgICAgIH0sXG4gICAgICBzdmdvOiB7XG4gICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAncmVtb3ZlVmlld0JveCcsXG4gICAgICAgICAgICBhY3RpdmU6IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2NvbnZlcnRTaGFwZVRvUGF0aCcsXG4gICAgICAgICAgICBhY3RpdmU6IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2NvbnZlcnRFbGxpcHNlVG9DaXJjbGUnLFxuICAgICAgICAgICAgYWN0aXZlOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgICBWaXRlTWluaWZ5UGx1Z2luKHtcbiAgICAgIGNvbGxhcHNlV2hpdGVzcGFjZTogdHJ1ZSxcbiAgICAgIGluY2x1ZGVBdXRvR2VuZXJhdGVkVGFnczogZmFsc2UsXG4gICAgICBtaW5pZnlDU1M6IHRydWUsXG4gICAgICBtaW5pZnlKUzogdHJ1ZSxcbiAgICAgIHJlbW92ZUNvbW1lbnRzOiB0cnVlLFxuICAgIH0pLFxuICBdLFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICBob3N0OiB0cnVlLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IGZhbHNlLFxuICB9LFxufSlcblxuZnVuY3Rpb24gZ2V0VHdpZ0Z1bmN0aW9ucygpIHtcbiAgcmV0dXJuIHtcbiAgICBiYXNlNjQsXG4gICAgY2xhc3NMaXN0LFxuICAgIGh0bWxBdHRyLFxuICAgIGljb25TdmcsXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0VHdpZ0dsb2JhbHMoKSB7XG4gIGNvbnN0IGRhdGEgPSB7fVxuICBjb25zdCBkYXRhRm9sZGVyID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdzcmMnLCAnZGF0YScpXG5cbiAgY29uc3QgZGF0YUZpbGVzID0gZnMucmVhZGRpclN5bmMoZGF0YUZvbGRlcikuZmlsdGVyKChmaWxlKSA9PiBmaWxlLmVuZHNXaXRoKCcuanNvbicpKSB8fCBbXVxuXG4gIGRhdGFGaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3NyYycsICdkYXRhJywgZmlsZSlcblxuICAgIGNvbnN0IGZpbGVDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmOCcpIHx8ICd7fSdcblxuICAgIGNvbnN0IGZpbGVEYXRhID0gSlNPTi5wYXJzZShmaWxlQ29udGVudClcblxuICAgIGNvbnN0IGZpbGVOYW1lID0gZmlsZS5yZXBsYWNlKCcuanNvbicsICcnKS5yZXBsYWNlKC9bXFxzLV0rL2csICdfJykucmVwbGFjZSgvW15hLXpfXSsvZywgJycpLnJlcGxhY2UoLyhfKS4vZywgKHMpID0+IHMuc2xpY2UoLTEpLnRvVXBwZXJDYXNlKCkpXG5cbiAgICBkYXRhW2ZpbGVOYW1lXSA9IGZpbGVEYXRhXG4gIH0pO1xuXG4gIHJldHVybiBkYXRhXG59XG5cbmZ1bmN0aW9uIGdldFR3aWdOYW1lc3BhY2VzKCkge1xuICBjb25zdCBuYW1lc3BhY2VMaXN0ID0gW1xuICAgICdhc3NldHMnLFxuICAgICdjb21wb25lbnRzJyxcbiAgICAnaWNvbnMnLFxuICAgICdsYXlvdXRzJyxcbiAgICAnb2JqZWN0cycsXG4gICAgJ3BhcnRpYWxzJyxcbiAgICAndGVtcGxhdGVzJ1xuICBdXG5cbiAgcmV0dXJuIG5hbWVzcGFjZUxpc3QucmVkdWNlKChhY2MsIG5hbWVzcGFjZSkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIC4uLmFjYyxcbiAgICAgICAgW25hbWVzcGFjZV06IGAuL3NyYy9pbmNsdWRlcy8ke25hbWVzcGFjZX1gXG4gICAgfVxuICB9LCB7fSlcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2xvdWlzL0dpdGh1Yi9sb3Vpc2dvbi9sb3Vpc2dvbi5naXRodWIuaW9cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9sb3Vpcy9HaXRodWIvbG91aXNnb24vbG91aXNnb24uZ2l0aHViLmlvL2hlbHBlcnMuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2xvdWlzL0dpdGh1Yi9sb3Vpc2dvbi9sb3Vpc2dvbi5naXRodWIuaW8vaGVscGVycy5qc1wiO2ltcG9ydCBmcyBmcm9tICdub2RlOmZzJ1xuXG4vLyBNZXRob2RzXG5mdW5jdGlvbiBnZXRBcnJheVdpdGhQcmVmaXggKGFycmF5LCBwcmVmaXgpIHtcbiAgcmV0dXJuIGFycmF5XG4gICAgLmZpbHRlcihCb29sZWFuKVxuICAgIC5tYXAoaXRlbSA9PiBgJHtwcmVmaXh9JHtpdGVtfWApXG59XG5cbmZ1bmN0aW9uIGdldENzc1ZhcmlhYmxlcyAob2JqZWN0KSB7XG4gIGxldCB2YXJpYWJsZXMgPSBbXVxuXG4gIC8vIGdldCBvYmplY3RcbiAgb2JqZWN0ID0gZ2V0T2JqZWN0KG9iamVjdClcblxuICBmb3IgKGxldCBrZXkgaW4gb2JqZWN0KSB7XG4gICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIG9iamVjdFtrZXldICE9PSAnJykge1xuICAgICAgdmFyaWFibGVzLnB1c2goYC0tJHtrZXl9OiAke29iamVjdFtrZXldfTtgKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB2YXJpYWJsZXMuam9pbignICcpXG59XG5cbmZ1bmN0aW9uIGdldENsYXNzTGlzdCAoYXJncykge1xuICBjb25zdCBvYmplY3QgPSBnZXRPYmplY3QoYXJncylcblxuICBjb25zdCBuYW1lID0gb2JqZWN0WyduYW1lJ10gPz8gJydcblxuICAvLyBibG9ja3NcbiAgY29uc3QgYmxvY2sgPSAob2JqZWN0WydibG9jayddID8/ICcnKVxuICAgID8gZ2V0QmxvY2tDbGFzc2VzKG9iamVjdFsnYmxvY2snXSlcbiAgICA6ICcnXG5cbiAgLy8gY2xhc3NlcyAoY2hlY2sgaWYgc3RyaW5nIG9yIClcbiAgY29uc3QgY2xhc3NlcyA9IHR5cGVvZiBvYmplY3RbJ2NsYXNzZXMnXSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIG9iamVjdFsnY2xhc3NlcyddID09PSBudWxsXG4gICAgPyBvYmplY3RbJ2NsYXNzZXMnXVxuICAgIDogZ2V0Q2xhc3NMaXN0Q2xhc3NlcyhvYmplY3RbJ2NsYXNzZXMnXSlcblxuICAvLyBtb2RpZmllcnNcbiAgY29uc3QgbW9kaWZpZXJzID0gKG9iamVjdFsnbW9kaWZpZXJzJ10gPz8gJycpXG4gICAgPyBnZXRBcnJheVdpdGhQcmVmaXgob2JqZWN0Wydtb2RpZmllcnMnXSA/PyBbXSwgYCR7bmFtZX0tLWApXG4gICAgOiBbXVxuXG4gIC8vIHNjb3Blc1xuICBjb25zdCBzY29wZXMgPSAob2JqZWN0WydzY29wZXMnXSA/PyAnJylcbiAgICA/IGdldEFycmF5V2l0aFByZWZpeChvYmplY3RbJ3Njb3BlcyddLCAncy0nKVxuICAgIDogW11cblxuICAvLyBzcGFjaW5nXG4gIGNvbnN0IHNwYWNpbmcgPSAob2JqZWN0WydzcGFjaW5nJ10gPz8gJycpXG4gICAgPyBnZXRTcGFjaW5nQ2xhc3NlcyhvYmplY3RbJ3NwYWNpbmcnXSlcbiAgICA6ICcnXG5cbiAgLy8gdXRpbGl0aWVzXG4gIGNvbnN0IHV0aWxpdGllcyA9IChvYmplY3RbJ3V0aWxpdGllcyddID8/ICcnKVxuICAgID8gZ2V0VXRpbGl0eUNsYXNzZXMob2JqZWN0Wyd1dGlsaXRpZXMnXSlcbiAgICA6IFtdXG5cbiAgLy8gdmVuZG9yc1xuICBjb25zdCB2ZW5kb3JzID0gb2JqZWN0Wyd2ZW5kb3JzJ10gPz8gW11cblxuICAvLyBzY3JpcHRzXG4gIGNvbnN0IHNjcmlwdHMgPSAob2JqZWN0WydzY3JpcHRzJ10gPz8gJycpXG4gICAgPyBnZXRBcnJheVdpdGhQcmVmaXgob2JqZWN0WydzY3JpcHRzJ10sICdqcy0nKVxuICAgIDogW11cblxuICAvLyBtZXJnZSBjbGFzc2VzXG4gIHJldHVybiBbY2xhc3NlcywgbmFtZSwgYmxvY2ssIC4uLm1vZGlmaWVycywgLi4uc2NvcGVzLCBzcGFjaW5nLCAuLi51dGlsaXRpZXMsIC4uLnZlbmRvcnMsIC4uLnNjcmlwdHNdXG4gICAgLmZpbHRlcihCb29sZWFuKVxuICAgIC5qb2luKCcgJylcbn1cblxuZnVuY3Rpb24gZ2V0Q2xhc3NMaXN0Q2xhc3NlcyAob2JqZWN0KSB7XG4gIC8vIGlmIG5vdCBvYmplY3QgcmV0dXJuIHN0cmluZ1xuICBpZiAodHlwZW9mIG9iamVjdCAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIHJldHVybiBnZXRDbGFzc0xpc3Qob2JqZWN0KVxufVxuXG5mdW5jdGlvbiBnZXRIdG1sQXR0cnMgKG9iamVjdCkge1xuICBjb25zdCBhdHRyaWJ1dGVzID0gW11cblxuICAvLyBzb3J0IG9iamVjdFxuICBjb25zdCBzb3J0ZWQgPSBnZXRPYmplY3RTb3J0ZWRCeUtleXMob2JqZWN0LCBbXG4gICAgJ3NyYycsXG4gICAgJ2NsYXNzJyxcbiAgICAnaHJlZicsXG4gICAgJ2RhdGEnLFxuICAgICdhcmlhJyxcbiAgICAncm9sZScsXG4gICAgJ3N0eWxlJyxcbiAgXSlcblxuICAvLyBhZGQgYXR0cmlidXRlc1xuICBmb3IgKGxldCBrZXkgaW4gc29ydGVkKSB7XG4gICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIG9iamVjdFtrZXldICE9PSAnJykge1xuICAgICAgYXR0cmlidXRlcy5wdXNoKGAke2tleX09XCIke29iamVjdFtrZXldfVwiYClcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cmlidXRlcy5qb2luKCcgJylcbn1cblxuXG5cbmZ1bmN0aW9uIGdldE9iamVjdCAob2JqZWN0KSB7XG4gIC8vIGRlbGV0ZSBfa2V5cyBwcm9wZXJ0eVxuICBkZWxldGUgb2JqZWN0Ll9rZXlzXG5cbiAgcmV0dXJuIG9iamVjdFxufVxuXG5mdW5jdGlvbiBnZXRPYmplY3RTb3J0ZWQgKG9iamVjdCkge1xuICBsZXQgY2xlYW5PYmplY3QgPSB7fVxuXG4gIC8vIGdldCBvYmplY3RcbiAgb2JqZWN0ID0gZ2V0T2JqZWN0KG9iamVjdClcblxuICAvLyBnZXQgb2JqZWN0IGtleXNcbiAgbGV0IHNvcnRlZEtleXMgPSBPYmplY3Qua2V5cyhvYmplY3QpLnJldmVyc2UoKVxuXG4gIC8vIG9yZGVyIG9iamVjdCBrZXlzXG4gIHNvcnRlZEtleXMuZm9yRWFjaCgoa2V5LCBpbmRleCkgPT4ge1xuICAgIGxldCB2YWx1ZSA9IG9iamVjdFtrZXldXG5cbiAgICBpZiAodmFsdWUgPz8gJycpIHtcbiAgICAgIGNsZWFuT2JqZWN0W2tleV0gPSB2YWx1ZVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4gY2xlYW5PYmplY3Rcbn1cblxuZnVuY3Rpb24gZ2V0T2JqZWN0U29ydGVkQnlLZXlzIChvYmplY3QsIGtleXMpIHtcbiAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKG9iamVjdClcblxuICBlbnRyaWVzLnNvcnQoKFtrZXlBXSwgW2tleUJdKSA9PiB7XG4gICAgY29uc3QgW3ByZWZpeEEsIHByZWZpeEJdID0gW2tleUEsIGtleUJdLm1hcChrZXkgPT4ga2V5LnNwbGl0KCctJylbMF0pXG4gICAgY29uc3QgW2luZGV4QSwgaW5kZXhCXSA9IFtwcmVmaXhBLCBwcmVmaXhCXS5tYXAocHJlZml4ID0+IGtleXMuaW5kZXhPZihwcmVmaXgpKVxuXG4gICAgaWYgKGluZGV4QSA9PT0gaW5kZXhCKSB7XG4gICAgICByZXR1cm4ga2V5QS5sb2NhbGVDb21wYXJlKGtleUIpICAvLyBTb3J0IGFscGhhYmV0aWNhbGx5IGlmIGJvdGgga2V5cyBoYXZlIHRoZSBzYW1lIHByZWZpeCBpbmRleFxuICAgIH1cblxuICAgIGlmIChpbmRleEEgPT09IC0xKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cblxuICAgIGlmIChpbmRleEIgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG5cbiAgICByZXR1cm4gaW5kZXhBIC0gaW5kZXhCXG4gIH0pXG5cbiAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhlbnRyaWVzKVxufVxuXG5mdW5jdGlvbiBnZXRPYmplY3RXaXRoTmVzdGVkS2V5cyAob2JqZWN0LCBrZXkpIHtcbiAgY29uc3QgbmVzdGVkID0gZ2V0T2JqZWN0KG9iamVjdFtrZXldKVxuXG4gIGZvciAobGV0IG5lc3RlZEtleSBpbiBuZXN0ZWQpIHtcbiAgICBpZiAoIW5lc3RlZC5oYXNPd25Qcm9wZXJ0eShuZXN0ZWRLZXkpKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIG9iamVjdFtgJHtrZXl9LSR7Z2V0U3RyaW5nS2ViYWJDYXNlKG5lc3RlZEtleSl9YF0gPSBuZXN0ZWRbbmVzdGVkS2V5XVxuICB9XG5cbiAgcmV0dXJuIG9iamVjdFxufVxuXG5mdW5jdGlvbiBnZXRQcm9wZXJ0eVZhbGlkYXRpb24gKHByb3BlcnR5LCB0eXBlKSB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICByZXR1cm4gdHlwZW9mIHByb3BlcnR5ID09PSAnb2JqZWN0JyAmJiBwcm9wZXJ0eSAhPT0gbnVsbFxuICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICByZXR1cm4gdHlwZW9mIHByb3BlcnR5ID09PSAnc3RyaW5nJyAmJiBwcm9wZXJ0eSAhPT0gJydcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0U3BhY2luZ0NsYXNzZXMgKG9iamVjdCkge1xuICBsZXQgY2xhc3NlcyA9IFtdXG5cbiAgLy8gZ2V0IG9iamVjdFxuICBvYmplY3QgPSBnZXRPYmplY3Qob2JqZWN0KVxuXG4gIC8vIG1hcmdpbiB0b3BcbiAgbGV0IG1hcmdpbl90b3AgPSAob2JqZWN0WydtdCddID8/ICcnKSAhPT0gJydcbiAgICA/IGdldFV0aWxpdHlCcmVha3BvaW50Q2xhc3NlcyhvYmplY3RbJ210J10sICdtdCcpXG4gICAgOiAnJ1xuXG4gIC8vIHBhZGRpbmcgdG9wXG4gIGxldCBwYWRkaW5nX3RvcCA9IChvYmplY3RbJ3B0J10gPz8gJycpICE9PSAnJ1xuICAgID8gZ2V0VXRpbGl0eUJyZWFrcG9pbnRDbGFzc2VzKG9iamVjdFsncHQnXSwgJ3B0JylcbiAgICA6ICcnXG5cbiAgLy8gcGFkZGluZyB0b3BcbiAgbGV0IHBhZGRpbmdfYm90dG9tID0gKG9iamVjdFsncGInXSA/PyAnJykgIT09ICcnXG4gICAgPyBnZXRVdGlsaXR5QnJlYWtwb2ludENsYXNzZXMob2JqZWN0WydwYiddLCAncGInKVxuICAgIDogJydcblxuICAvLyBtYXJnaW4gdG9wXG4gIGxldCBtYXJnaW5fYm90dG9tID0gKG9iamVjdFsnbWInXSA/PyAnJykgIT09ICcnXG4gICAgPyBnZXRVdGlsaXR5QnJlYWtwb2ludENsYXNzZXMob2JqZWN0WydtYiddLCAnbWInKVxuICAgIDogJydcblxuICAvLyBtZXJnZSBjbGFzc2VzXG4gIHJldHVybiBbbWFyZ2luX3RvcCwgcGFkZGluZ190b3AsIHBhZGRpbmdfYm90dG9tLCBtYXJnaW5fYm90dG9tXVxuICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAuam9pbignICcpXG59XG5cbmZ1bmN0aW9uIGdldFN0cmluZ0tlYmFiQ2FzZSAoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmdcbiAgICAucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJylcbiAgICAucmVwbGFjZSgvXFxzKy9nLCAnLScpXG4gICAgLnRvTG93ZXJDYXNlKClcbn1cblxuZnVuY3Rpb24gZ2V0VXRpbGl0eUJyZWFrcG9pbnRDbGFzc2VzIChvYmplY3QsIHByZWZpeCkge1xuICBsZXQgY2xhc3NlcyA9IFtdXG5cbiAgLy8gZ2V0IG9iamVjdFxuICBvYmplY3QgPSBnZXRPYmplY3Qob2JqZWN0KVxuXG4gIC8vIGJhc2VcbiAgbGV0IGJhc2UgPSAob2JqZWN0WydiYXNlJ10gPz8gJycpICE9PSAnJ1xuICAgID8gYHUtJHtwcmVmaXh9LSR7b2JqZWN0WydiYXNlJ119YFxuICAgIDogJydcblxuICAvLyBtZFxuICBsZXQgbWQgPSAob2JqZWN0WydtZCddID8/ICcnKSAhPT0gJydcbiAgICA/IGBtZDp1LSR7cHJlZml4fS0ke29iamVjdFsnbWQnXX1gXG4gICAgOiAnJ1xuXG4gIC8vIGxnXG4gIGxldCBsZyA9IChvYmplY3RbJ2xnJ10gPz8gJycpICE9PSAnJ1xuICAgID8gYGxnOnUtJHtwcmVmaXh9LSR7b2JqZWN0WydsZyddfWBcbiAgICA6ICcnXG5cbiAgcmV0dXJuIFtiYXNlLCBtZCwgbGddXG4gICAgLmZpbHRlcihCb29sZWFuKVxuICAgIC5qb2luKCcgJylcbn1cblxuZnVuY3Rpb24gZ2V0VXRpbGl0eUNsYXNzZXMgKHV0aWxpdGllcykge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh1dGlsaXRpZXMpXG4gICAgPyBnZXRBcnJheVdpdGhQcmVmaXgodXRpbGl0aWVzLCAndS0nKVxuICAgIDogZ2V0VXRpbGl0eU9iamVjdCh1dGlsaXRpZXMpXG59XG5cbmZ1bmN0aW9uIGdldFV0aWxpdHlPYmplY3QgKG9iamVjdCkge1xuICBsZXQgbWVyZ2VkQXJyYXkgPSBbXVxuXG4gIC8vIGdldCBvYmplY3RcbiAgb2JqZWN0ID0gZ2V0T2JqZWN0KG9iamVjdClcblxuICBmb3IgKGxldCBrZXkgaW4gb2JqZWN0KSB7XG4gICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIG9iamVjdFtrZXldICE9PSAnJykge1xuICAgICAgY29uc3QgdmFsdWUgPSAodHlwZW9mIG9iamVjdFtrZXldID09ICdvYmplY3QnKVxuICAgICAgICA/IGdldFV0aWxpdHlCcmVha3BvaW50Q2xhc3NlcyhvYmplY3Rba2V5XSwga2V5KVxuICAgICAgICA6IGB1LSR7a2V5fS0ke29iamVjdFtrZXldfWBcblxuICAgICAgbWVyZ2VkQXJyYXkucHVzaCh2YWx1ZSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWVyZ2VkQXJyYXkuZmlsdGVyKEJvb2xlYW4pXG59XG5cbi8vIEV4cG9ydHNcbmV4cG9ydCBmdW5jdGlvbiBjbGFzc0xpc3QgKGFyZ3MgPSB7fSkge1xuICByZXR1cm4gZ2V0Q2xhc3NMaXN0KGFyZ3MpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBodG1sQXR0ciAoYXJncyA9IHt9KSB7XG4gIGxldCBvYmplY3QgPSBnZXRPYmplY3QoYXJncylcbiAgbGV0IHRhZyA9ICcnXG5cbiAgLy8gZGVmaW5lIG9iamVjdCBwcm9wcyB0aGF0IHNob3VsZCBiZSBwYXJzZWRcbiAgb2JqZWN0WydhbmltYXRlSW4nXSA9IG9iamVjdFsnYW5pbWF0ZUluJ10gfHwgJydcbiAgb2JqZWN0WydhcmlhJ10gPSBvYmplY3RbJ2FyaWEnXSB8fCAnJ1xuICBvYmplY3RbJ2NsYXNzJ10gPSBvYmplY3RbJ2NsYXNzJ10gfHwgJydcbiAgb2JqZWN0WydkYXRhJ10gPSBvYmplY3RbJ2RhdGEnXSA/PyB7fVxuICBvYmplY3RbJ21vZHVsZSddID0gb2JqZWN0Wydtb2R1bGUnXSB8fCAnJ1xuICBvYmplY3RbJ3N0eWxlJ10gPSBvYmplY3RbJ3N0eWxlJ10gfHwgJydcbiAgb2JqZWN0Wyd0YWcnXSA9IG9iamVjdFsndGFnJ10gfHwgJydcblxuICAvLyBwYXJzZSB0YWcgYW5kIGVuc3VyZSBpdCdzIGEgc3RyaW5nXG4gIGlmIChnZXRQcm9wZXJ0eVZhbGlkYXRpb24ob2JqZWN0Wyd0YWcnXSwgJ3N0cmluZycpKSB7XG4gICAgdGFnID0gb2JqZWN0Wyd0YWcnXVxuICB9XG5cbiAgLy8gZGVsZXRlIHRhZyBwcm9wZXJ0eVxuICBkZWxldGUgb2JqZWN0Wyd0YWcnXVxuXG4gIC8vIHBhcnNlIGFyaWEgaWYgb2JqZWN0XG4gIGlmIChnZXRQcm9wZXJ0eVZhbGlkYXRpb24ob2JqZWN0WydhcmlhJ10sICdvYmplY3QnKSkge1xuICAgIG9iamVjdCA9IGdldE9iamVjdFdpdGhOZXN0ZWRLZXlzKG9iamVjdCwgJ2FyaWEnKVxuICB9XG5cbiAgLy8gZGVsZXRlIGFyaWEgcHJvcGVydHlcbiAgZGVsZXRlIG9iamVjdFsnYXJpYSddXG5cbiAgLy8gcGFyc2UgY2xhc3MgbGlzdCBpZiBvYmplY3RcbiAgaWYgKGdldFByb3BlcnR5VmFsaWRhdGlvbihvYmplY3RbJ2NsYXNzJ10sICdvYmplY3QnKSkge1xuICAgIG9iamVjdFsnY2xhc3MnXSA9IGdldENsYXNzTGlzdChvYmplY3RbJ2NsYXNzJ10pXG4gIH1cblxuICAvLyBwYXJzZSBhbmltYXRlSW4gYW5kIGFkZCB0byBkYXRhIGF0dHJpYnV0ZVxuICBpZiAoZ2V0UHJvcGVydHlWYWxpZGF0aW9uKG9iamVjdFsnYW5pbWF0ZUluJ10sICdzdHJpbmcnKSkge1xuICAgIG9iamVjdFsnZGF0YSddWydhbmltYXRlSW4nXSA9IG9iamVjdFsnYW5pbWF0ZUluJ11cbiAgfVxuXG4gIC8vIGRlbGV0ZSBhbmltYXRlSW4gcHJvcGVydHlcbiAgZGVsZXRlIG9iamVjdFsnYW5pbWF0ZUluJ11cblxuICAvLyBwYXJzZSBtb2R1bGUgYW5kIGFkZCB0byBkYXRhIGF0dHJpYnV0ZSwgbmVlZHMgdG8gYmUgYmVmb3JlIGRhdGEgcGFyc2luZ1xuICBpZiAoZ2V0UHJvcGVydHlWYWxpZGF0aW9uKG9iamVjdFsnbW9kdWxlJ10sICdzdHJpbmcnKSkge1xuICAgIG9iamVjdFsnZGF0YSddWydtb2R1bGUnXSA9IG9iamVjdFsnbW9kdWxlJ11cbiAgfVxuXG4gIC8vIGRlbGV0ZSBtb2R1bGUgcHJvcGVydHlcbiAgZGVsZXRlIG9iamVjdFsnbW9kdWxlJ11cblxuICAvLyBwYXJzZSBkYXRhIGlmIG9iamVjdFxuICBpZiAoZ2V0UHJvcGVydHlWYWxpZGF0aW9uKG9iamVjdFsnZGF0YSddLCAnb2JqZWN0JykpIHtcbiAgICBvYmplY3QgPSBnZXRPYmplY3RXaXRoTmVzdGVkS2V5cyhvYmplY3QsICdkYXRhJylcbiAgfVxuXG4gIC8vIGRlbGV0ZSBkYXRhIHByb3BlcnR5XG4gIGRlbGV0ZSBvYmplY3RbJ2RhdGEnXVxuXG4gIC8vIHBhcnNlIHN0eWxlIGlmIG9iamVjdFxuICBpZiAoZ2V0UHJvcGVydHlWYWxpZGF0aW9uKG9iamVjdFsnc3R5bGUnXSwgJ29iamVjdCcpKSB7XG4gICAgb2JqZWN0WydzdHlsZSddID0gZ2V0Q3NzVmFyaWFibGVzKG9iamVjdFsnc3R5bGUnXSlcbiAgfVxuXG4gIHJldHVybiBbdGFnLCBnZXRIdG1sQXR0cnMob2JqZWN0KV0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oJyAnKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaWNvblN2ZyAobmFtZSA9ICcnKSB7XG4gIHJldHVybiBnZXRJY29uU3ZnKG5hbWUpXG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9sb3Vpcy9HaXRodWIvbG91aXNnb24vbG91aXNnb24uZ2l0aHViLmlvL2hlbHBlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9sb3Vpcy9HaXRodWIvbG91aXNnb24vbG91aXNnb24uZ2l0aHViLmlvL2hlbHBlcnMvYmFzZTY0LmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9sb3Vpcy9HaXRodWIvbG91aXNnb24vbG91aXNnb24uZ2l0aHViLmlvL2hlbHBlcnMvYmFzZTY0LmpzXCI7ZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gYmFzZTY0IChkYXRhID0gJycsIHR5cGUgPSAnZW5jb2RlJykge1xuICByZXR1cm4gdHlwZSA9PT0gJ2VuY29kZSdcbiAgICA/IGVuY29kZShkYXRhKVxuICAgIDogZGVjb2RlKGRhdGEpXG59XG5cbmZ1bmN0aW9uIGRlY29kZSAoZGF0YSA9ICcnKSB7XG4gIHJldHVybiBidG9hKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0J1xuICAgID8gSlNPTi5zdHJpbmdpZnkoZGF0YSlcbiAgICA6IGRhdGEpXG59XG5cbmZ1bmN0aW9uIGVuY29kZSAoZGF0YSA9ICcnKSB7XG4gIHJldHVybiBidG9hKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0J1xuICAgID8gSlNPTi5zdHJpbmdpZnkoZGF0YSlcbiAgICA6IGRhdGEpXG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9sb3Vpcy9HaXRodWIvbG91aXNnb24vbG91aXNnb24uZ2l0aHViLmlvL2hlbHBlcnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9sb3Vpcy9HaXRodWIvbG91aXNnb24vbG91aXNnb24uZ2l0aHViLmlvL2hlbHBlcnMvaWNvblN2Zy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbG91aXMvR2l0aHViL2xvdWlzZ29uL2xvdWlzZ29uLmdpdGh1Yi5pby9oZWxwZXJzL2ljb25TdmcuanNcIjtpbXBvcnQgZnMgZnJvbSAnbm9kZTpmcydcbmNvbnN0IHsgSlNET00gfSA9IGpzZG9tXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGljb25TdmcgKG5hbWUgPSAnJykge1xuICBjb25zdCBzdmdQYXRoID0gYC4vc3JjL2luY2x1ZGVzL2ljb25zLyR7bmFtZX0uc3ZnYFxuXG4gIGNvbnN0IGZpbGVFeGlzdHMgPSBmcy5leGlzdHNTeW5jKHN2Z1BhdGgpXG5cbiAgaWYgKCFmaWxlRXhpc3RzKSB7XG4gICAgLy8gY29uc29sZS5lcnJvcignRmlsZSBkb2VzIG5vdCBleGlzdCBhdCBwYXRoOiAnLCBzdmdQYXRoKVxuXG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBnZXQgc3ZnIGZpbGUgY29udGVudHNcbiAgY29uc3Qgc3ZnID0gZnMucmVhZEZpbGVTeW5jKHN2Z1BhdGgsICd1dGY4JylcblxuICBjb25zb2xlLmxvZygnc3ZnJywgc3ZnKVxuXG4gIC8vIGlmIChzdmcpIHtcbiAgLy8gICBjb25zb2xlLmxvZygndGVzdCcsIHN2ZylcbiAgLy8gfVxuXG4gIHJldHVybiBuYW1lXG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStULFNBQVMsb0JBQW9CO0FBQzVWLFNBQVMsd0JBQXdCO0FBQ2pDLE9BQU9BLFNBQVE7QUFDZixPQUFPLFVBQVU7QUFDakIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8scUJBQXFCO0FBQzVCLE9BQU8sa0JBQWtCO0FBQ3pCLE9BQU8sWUFBWTs7O0FDSm5CLFNBQVMsbUJBQW9CLE9BQU8sUUFBUTtBQUMxQyxTQUFPLE1BQ0osT0FBTyxPQUFPLEVBQ2QsSUFBSSxVQUFR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
