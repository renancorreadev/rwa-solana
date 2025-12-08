"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const url_1 = require("url");
const path_1 = require("path");
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = (0, path_1.dirname)(__filename);
const idlPath = (0, path_1.join)(__dirname, '../credential_program_idl.json');
const IDL = JSON.parse((0, fs_1.readFileSync)(idlPath, 'utf-8'));
//# sourceMappingURL=temp_import.js.map