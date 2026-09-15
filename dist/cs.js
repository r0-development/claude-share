import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
  get: (a, b3) => (typeof require !== "undefined" ? require : a)[b3]
}) : x2)(function(x2) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x2 + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/commander/lib/error.js
var require_error = __commonJS({
  "node_modules/commander/lib/error.js"(exports) {
    var CommanderError2 = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {number} exitCode suggested exit code which could be used with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
        this.nestedError = void 0;
      }
    };
    var InvalidArgumentError2 = class extends CommanderError2 {
      /**
       * Constructs the InvalidArgumentError class
       * @param {string} [message] explanation of why argument is invalid
       */
      constructor(message) {
        super(1, "commander.invalidArgument", message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }
    };
    exports.CommanderError = CommanderError2;
    exports.InvalidArgumentError = InvalidArgumentError2;
  }
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS({
  "node_modules/commander/lib/argument.js"(exports) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Argument2 = class {
      /**
       * Initialize a new command argument with the given name and description.
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @param {string} name
       * @param {string} [description]
       */
      constructor(name2, description) {
        this.description = description || "";
        this.variadic = false;
        this.parseArg = void 0;
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.argChoices = void 0;
        switch (name2[0]) {
          case "<":
            this.required = true;
            this._name = name2.slice(1, -1);
            break;
          case "[":
            this.required = false;
            this._name = name2.slice(1, -1);
            break;
          default:
            this.required = true;
            this._name = name2;
            break;
        }
        if (this._name.length > 3 && this._name.slice(-3) === "...") {
          this.variadic = true;
          this._name = this._name.slice(0, -3);
        }
      }
      /**
       * Return argument name.
       *
       * @return {string}
       */
      name() {
        return this._name;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Argument}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Set the custom handler for processing CLI command arguments into argument values.
       *
       * @param {Function} [fn]
       * @return {Argument}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Only allow argument value to be one of choices.
       *
       * @param {string[]} values
       * @return {Argument}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Make argument required.
       *
       * @returns {Argument}
       */
      argRequired() {
        this.required = true;
        return this;
      }
      /**
       * Make argument optional.
       *
       * @returns {Argument}
       */
      argOptional() {
        this.required = false;
        return this;
      }
    };
    function humanReadableArgName(arg) {
      const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    exports.Argument = Argument2;
    exports.humanReadableArgName = humanReadableArgName;
  }
});

// node_modules/commander/lib/help.js
var require_help = __commonJS({
  "node_modules/commander/lib/help.js"(exports) {
    var { humanReadableArgName } = require_argument();
    var Help2 = class {
      constructor() {
        this.helpWidth = void 0;
        this.minWidthToWrap = 40;
        this.sortSubcommands = false;
        this.sortOptions = false;
        this.showGlobalOptions = false;
      }
      /**
       * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
       * and just before calling `formatHelp()`.
       *
       * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
       *
       * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
       */
      prepareContext(contextOptions) {
        this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
      }
      /**
       * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
       *
       * @param {Command} cmd
       * @returns {Command[]}
       */
      visibleCommands(cmd) {
        const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
        const helpCommand = cmd._getHelpCommand();
        if (helpCommand && !helpCommand._hidden) {
          visibleCommands.push(helpCommand);
        }
        if (this.sortSubcommands) {
          visibleCommands.sort((a, b3) => {
            return a.name().localeCompare(b3.name());
          });
        }
        return visibleCommands;
      }
      /**
       * Compare options for sort.
       *
       * @param {Option} a
       * @param {Option} b
       * @returns {number}
       */
      compareOptions(a, b3) {
        const getSortKey = (option) => {
          return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
        };
        return getSortKey(a).localeCompare(getSortKey(b3));
      }
      /**
       * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleOptions(cmd) {
        const visibleOptions = cmd.options.filter((option) => !option.hidden);
        const helpOption = cmd._getHelpOption();
        if (helpOption && !helpOption.hidden) {
          const removeShort = helpOption.short && cmd._findOption(helpOption.short);
          const removeLong = helpOption.long && cmd._findOption(helpOption.long);
          if (!removeShort && !removeLong) {
            visibleOptions.push(helpOption);
          } else if (helpOption.long && !removeLong) {
            visibleOptions.push(
              cmd.createOption(helpOption.long, helpOption.description)
            );
          } else if (helpOption.short && !removeShort) {
            visibleOptions.push(
              cmd.createOption(helpOption.short, helpOption.description)
            );
          }
        }
        if (this.sortOptions) {
          visibleOptions.sort(this.compareOptions);
        }
        return visibleOptions;
      }
      /**
       * Get an array of the visible global options. (Not including help.)
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleGlobalOptions(cmd) {
        if (!this.showGlobalOptions) return [];
        const globalOptions = [];
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          const visibleOptions = ancestorCmd.options.filter(
            (option) => !option.hidden
          );
          globalOptions.push(...visibleOptions);
        }
        if (this.sortOptions) {
          globalOptions.sort(this.compareOptions);
        }
        return globalOptions;
      }
      /**
       * Get an array of the arguments if any have a description.
       *
       * @param {Command} cmd
       * @returns {Argument[]}
       */
      visibleArguments(cmd) {
        if (cmd._argsDescription) {
          cmd.registeredArguments.forEach((argument) => {
            argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
          });
        }
        if (cmd.registeredArguments.find((argument) => argument.description)) {
          return cmd.registeredArguments;
        }
        return [];
      }
      /**
       * Get the command term to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandTerm(cmd) {
        const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
        return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
        (args ? " " + args : "");
      }
      /**
       * Get the option term to show in the list of options.
       *
       * @param {Option} option
       * @returns {string}
       */
      optionTerm(option) {
        return option.flags;
      }
      /**
       * Get the argument term to show in the list of arguments.
       *
       * @param {Argument} argument
       * @returns {string}
       */
      argumentTerm(argument) {
        return argument.name();
      }
      /**
       * Get the longest command term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestSubcommandTermLength(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleSubcommandTerm(helper.subcommandTerm(command))
            )
          );
        }, 0);
      }
      /**
       * Get the longest option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestOptionTermLength(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest global option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestGlobalOptionTermLength(cmd, helper) {
        return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest argument term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestArgumentTermLength(cmd, helper) {
        return helper.visibleArguments(cmd).reduce((max, argument) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleArgumentTerm(helper.argumentTerm(argument))
            )
          );
        }, 0);
      }
      /**
       * Get the command usage to be displayed at the top of the built-in help.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandUsage(cmd) {
        let cmdName = cmd._name;
        if (cmd._aliases[0]) {
          cmdName = cmdName + "|" + cmd._aliases[0];
        }
        let ancestorCmdNames = "";
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
        }
        return ancestorCmdNames + cmdName + " " + cmd.usage();
      }
      /**
       * Get the description for the command.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the subcommand summary to show in the list of subcommands.
       * (Fallback to description for backwards compatibility.)
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandDescription(cmd) {
        return cmd.summary() || cmd.description();
      }
      /**
       * Get the option description to show in the list of options.
       *
       * @param {Option} option
       * @return {string}
       */
      optionDescription(option) {
        const extraInfo = [];
        if (option.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (option.defaultValue !== void 0) {
          const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
          if (showDefault) {
            extraInfo.push(
              `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
            );
          }
        }
        if (option.presetArg !== void 0 && option.optional) {
          extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
        }
        if (option.envVar !== void 0) {
          extraInfo.push(`env: ${option.envVar}`);
        }
        if (extraInfo.length > 0) {
          return `${option.description} (${extraInfo.join(", ")})`;
        }
        return option.description;
      }
      /**
       * Get the argument description to show in the list of arguments.
       *
       * @param {Argument} argument
       * @return {string}
       */
      argumentDescription(argument) {
        const extraInfo = [];
        if (argument.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (argument.defaultValue !== void 0) {
          extraInfo.push(
            `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
          );
        }
        if (extraInfo.length > 0) {
          const extraDescription = `(${extraInfo.join(", ")})`;
          if (argument.description) {
            return `${argument.description} ${extraDescription}`;
          }
          return extraDescription;
        }
        return argument.description;
      }
      /**
       * Generate the built-in help text.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {string}
       */
      formatHelp(cmd, helper) {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth ?? 80;
        function callFormatItem(term, description) {
          return helper.formatItem(term, termWidth, description, helper);
        }
        let output = [
          `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
          ""
        ];
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
          output = output.concat([
            helper.boxWrap(
              helper.styleCommandDescription(commandDescription),
              helpWidth
            ),
            ""
          ]);
        }
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
          return callFormatItem(
            helper.styleArgumentTerm(helper.argumentTerm(argument)),
            helper.styleArgumentDescription(helper.argumentDescription(argument))
          );
        });
        if (argumentList.length > 0) {
          output = output.concat([
            helper.styleTitle("Arguments:"),
            ...argumentList,
            ""
          ]);
        }
        const optionList = helper.visibleOptions(cmd).map((option) => {
          return callFormatItem(
            helper.styleOptionTerm(helper.optionTerm(option)),
            helper.styleOptionDescription(helper.optionDescription(option))
          );
        });
        if (optionList.length > 0) {
          output = output.concat([
            helper.styleTitle("Options:"),
            ...optionList,
            ""
          ]);
        }
        if (helper.showGlobalOptions) {
          const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
            return callFormatItem(
              helper.styleOptionTerm(helper.optionTerm(option)),
              helper.styleOptionDescription(helper.optionDescription(option))
            );
          });
          if (globalOptionList.length > 0) {
            output = output.concat([
              helper.styleTitle("Global Options:"),
              ...globalOptionList,
              ""
            ]);
          }
        }
        const commandList = helper.visibleCommands(cmd).map((cmd2) => {
          return callFormatItem(
            helper.styleSubcommandTerm(helper.subcommandTerm(cmd2)),
            helper.styleSubcommandDescription(helper.subcommandDescription(cmd2))
          );
        });
        if (commandList.length > 0) {
          output = output.concat([
            helper.styleTitle("Commands:"),
            ...commandList,
            ""
          ]);
        }
        return output.join("\n");
      }
      /**
       * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
       *
       * @param {string} str
       * @returns {number}
       */
      displayWidth(str) {
        return stripColor(str).length;
      }
      /**
       * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
       *
       * @param {string} str
       * @returns {string}
       */
      styleTitle(str) {
        return str;
      }
      styleUsage(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word === "[command]") return this.styleSubcommandText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleCommandText(word);
        }).join(" ");
      }
      styleCommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleOptionDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleSubcommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleArgumentDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleDescriptionText(str) {
        return str;
      }
      styleOptionTerm(str) {
        return this.styleOptionText(str);
      }
      styleSubcommandTerm(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleSubcommandText(word);
        }).join(" ");
      }
      styleArgumentTerm(str) {
        return this.styleArgumentText(str);
      }
      styleOptionText(str) {
        return str;
      }
      styleArgumentText(str) {
        return str;
      }
      styleSubcommandText(str) {
        return str;
      }
      styleCommandText(str) {
        return str;
      }
      /**
       * Calculate the pad width from the maximum term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      padWidth(cmd, helper) {
        return Math.max(
          helper.longestOptionTermLength(cmd, helper),
          helper.longestGlobalOptionTermLength(cmd, helper),
          helper.longestSubcommandTermLength(cmd, helper),
          helper.longestArgumentTermLength(cmd, helper)
        );
      }
      /**
       * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
       *
       * @param {string} str
       * @returns {boolean}
       */
      preformatted(str) {
        return /\n[^\S\r\n]/.test(str);
      }
      /**
       * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
       *
       * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
       *   TTT  DDD DDDD
       *        DD DDD
       *
       * @param {string} term
       * @param {number} termWidth
       * @param {string} description
       * @param {Help} helper
       * @returns {string}
       */
      formatItem(term, termWidth, description, helper) {
        const itemIndent = 2;
        const itemIndentStr = " ".repeat(itemIndent);
        if (!description) return itemIndentStr + term;
        const paddedTerm = term.padEnd(
          termWidth + term.length - helper.displayWidth(term)
        );
        const spacerWidth = 2;
        const helpWidth = this.helpWidth ?? 80;
        const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
        let formattedDescription;
        if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
          formattedDescription = description;
        } else {
          const wrappedDescription = helper.boxWrap(description, remainingWidth);
          formattedDescription = wrappedDescription.replace(
            /\n/g,
            "\n" + " ".repeat(termWidth + spacerWidth)
          );
        }
        return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
      }
      /**
       * Wrap a string at whitespace, preserving existing line breaks.
       * Wrapping is skipped if the width is less than `minWidthToWrap`.
       *
       * @param {string} str
       * @param {number} width
       * @returns {string}
       */
      boxWrap(str, width) {
        if (width < this.minWidthToWrap) return str;
        const rawLines = str.split(/\r\n|\n/);
        const chunkPattern = /[\s]*[^\s]+/g;
        const wrappedLines = [];
        rawLines.forEach((line) => {
          const chunks = line.match(chunkPattern);
          if (chunks === null) {
            wrappedLines.push("");
            return;
          }
          let sumChunks = [chunks.shift()];
          let sumWidth = this.displayWidth(sumChunks[0]);
          chunks.forEach((chunk) => {
            const visibleWidth = this.displayWidth(chunk);
            if (sumWidth + visibleWidth <= width) {
              sumChunks.push(chunk);
              sumWidth += visibleWidth;
              return;
            }
            wrappedLines.push(sumChunks.join(""));
            const nextChunk = chunk.trimStart();
            sumChunks = [nextChunk];
            sumWidth = this.displayWidth(nextChunk);
          });
          wrappedLines.push(sumChunks.join(""));
        });
        return wrappedLines.join("\n");
      }
    };
    function stripColor(str) {
      const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
      return str.replace(sgrPattern, "");
    }
    exports.Help = Help2;
    exports.stripColor = stripColor;
  }
});

// node_modules/commander/lib/option.js
var require_option = __commonJS({
  "node_modules/commander/lib/option.js"(exports) {
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Option2 = class {
      /**
       * Initialize a new `Option` with the given `flags` and `description`.
       *
       * @param {string} flags
       * @param {string} [description]
       */
      constructor(flags, description) {
        this.flags = flags;
        this.description = description || "";
        this.required = flags.includes("<");
        this.optional = flags.includes("[");
        this.variadic = /\w\.\.\.[>\]]$/.test(flags);
        this.mandatory = false;
        const optionFlags = splitOptionFlags(flags);
        this.short = optionFlags.shortFlag;
        this.long = optionFlags.longFlag;
        this.negate = false;
        if (this.long) {
          this.negate = this.long.startsWith("--no-");
        }
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.presetArg = void 0;
        this.envVar = void 0;
        this.parseArg = void 0;
        this.hidden = false;
        this.argChoices = void 0;
        this.conflictsWith = [];
        this.implied = void 0;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Option}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Preset to use when option used without option-argument, especially optional but also boolean and negated.
       * The custom processing (parseArg) is called.
       *
       * @example
       * new Option('--color').default('GREYSCALE').preset('RGB');
       * new Option('--donate [amount]').preset('20').argParser(parseFloat);
       *
       * @param {*} arg
       * @return {Option}
       */
      preset(arg) {
        this.presetArg = arg;
        return this;
      }
      /**
       * Add option name(s) that conflict with this option.
       * An error will be displayed if conflicting options are found during parsing.
       *
       * @example
       * new Option('--rgb').conflicts('cmyk');
       * new Option('--js').conflicts(['ts', 'jsx']);
       *
       * @param {(string | string[])} names
       * @return {Option}
       */
      conflicts(names) {
        this.conflictsWith = this.conflictsWith.concat(names);
        return this;
      }
      /**
       * Specify implied option values for when this option is set and the implied options are not.
       *
       * The custom processing (parseArg) is not called on the implied values.
       *
       * @example
       * program
       *   .addOption(new Option('--log', 'write logging information to file'))
       *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
       *
       * @param {object} impliedOptionValues
       * @return {Option}
       */
      implies(impliedOptionValues) {
        let newImplied = impliedOptionValues;
        if (typeof impliedOptionValues === "string") {
          newImplied = { [impliedOptionValues]: true };
        }
        this.implied = Object.assign(this.implied || {}, newImplied);
        return this;
      }
      /**
       * Set environment variable to check for option value.
       *
       * An environment variable is only used if when processed the current option value is
       * undefined, or the source of the current value is 'default' or 'config' or 'env'.
       *
       * @param {string} name
       * @return {Option}
       */
      env(name2) {
        this.envVar = name2;
        return this;
      }
      /**
       * Set the custom handler for processing CLI option arguments into option values.
       *
       * @param {Function} [fn]
       * @return {Option}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Whether the option is mandatory and must have a value after parsing.
       *
       * @param {boolean} [mandatory=true]
       * @return {Option}
       */
      makeOptionMandatory(mandatory = true) {
        this.mandatory = !!mandatory;
        return this;
      }
      /**
       * Hide option in help.
       *
       * @param {boolean} [hide=true]
       * @return {Option}
       */
      hideHelp(hide = true) {
        this.hidden = !!hide;
        return this;
      }
      /**
       * @package
       */
      _concatValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        return previous.concat(value);
      }
      /**
       * Only allow option value to be one of choices.
       *
       * @param {string[]} values
       * @return {Option}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._concatValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Return option name.
       *
       * @return {string}
       */
      name() {
        if (this.long) {
          return this.long.replace(/^--/, "");
        }
        return this.short.replace(/^-/, "");
      }
      /**
       * Return option name, in a camelcase format that can be used
       * as an object attribute key.
       *
       * @return {string}
       */
      attributeName() {
        if (this.negate) {
          return camelcase(this.name().replace(/^no-/, ""));
        }
        return camelcase(this.name());
      }
      /**
       * Check if `arg` matches the short or long flag.
       *
       * @param {string} arg
       * @return {boolean}
       * @package
       */
      is(arg) {
        return this.short === arg || this.long === arg;
      }
      /**
       * Return whether a boolean option.
       *
       * Options are one of boolean, negated, required argument, or optional argument.
       *
       * @return {boolean}
       * @package
       */
      isBoolean() {
        return !this.required && !this.optional && !this.negate;
      }
    };
    var DualOptions = class {
      /**
       * @param {Option[]} options
       */
      constructor(options) {
        this.positiveOptions = /* @__PURE__ */ new Map();
        this.negativeOptions = /* @__PURE__ */ new Map();
        this.dualOptions = /* @__PURE__ */ new Set();
        options.forEach((option) => {
          if (option.negate) {
            this.negativeOptions.set(option.attributeName(), option);
          } else {
            this.positiveOptions.set(option.attributeName(), option);
          }
        });
        this.negativeOptions.forEach((value, key) => {
          if (this.positiveOptions.has(key)) {
            this.dualOptions.add(key);
          }
        });
      }
      /**
       * Did the value come from the option, and not from possible matching dual option?
       *
       * @param {*} value
       * @param {Option} option
       * @returns {boolean}
       */
      valueFromOption(value, option) {
        const optionKey = option.attributeName();
        if (!this.dualOptions.has(optionKey)) return true;
        const preset = this.negativeOptions.get(optionKey).presetArg;
        const negativeValue = preset !== void 0 ? preset : false;
        return option.negate === (negativeValue === value);
      }
    };
    function camelcase(str) {
      return str.split("-").reduce((str2, word) => {
        return str2 + word[0].toUpperCase() + word.slice(1);
      });
    }
    function splitOptionFlags(flags) {
      let shortFlag;
      let longFlag;
      const shortFlagExp = /^-[^-]$/;
      const longFlagExp = /^--[^-]/;
      const flagParts = flags.split(/[ |,]+/).concat("guard");
      if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
      if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
      if (!shortFlag && shortFlagExp.test(flagParts[0]))
        shortFlag = flagParts.shift();
      if (!shortFlag && longFlagExp.test(flagParts[0])) {
        shortFlag = longFlag;
        longFlag = flagParts.shift();
      }
      if (flagParts[0].startsWith("-")) {
        const unsupportedFlag = flagParts[0];
        const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
        if (/^-[^-][^-]/.test(unsupportedFlag))
          throw new Error(
            `${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`
          );
        if (shortFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many short flags`);
        if (longFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many long flags`);
        throw new Error(`${baseError}
- unrecognised flag format`);
      }
      if (shortFlag === void 0 && longFlag === void 0)
        throw new Error(
          `option creation failed due to no flags found in '${flags}'.`
        );
      return { shortFlag, longFlag };
    }
    exports.Option = Option2;
    exports.DualOptions = DualOptions;
  }
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS({
  "node_modules/commander/lib/suggestSimilar.js"(exports) {
    var maxDistance = 3;
    function editDistance(a, b3) {
      if (Math.abs(a.length - b3.length) > maxDistance)
        return Math.max(a.length, b3.length);
      const d3 = [];
      for (let i = 0; i <= a.length; i++) {
        d3[i] = [i];
      }
      for (let j2 = 0; j2 <= b3.length; j2++) {
        d3[0][j2] = j2;
      }
      for (let j2 = 1; j2 <= b3.length; j2++) {
        for (let i = 1; i <= a.length; i++) {
          let cost = 1;
          if (a[i - 1] === b3[j2 - 1]) {
            cost = 0;
          } else {
            cost = 1;
          }
          d3[i][j2] = Math.min(
            d3[i - 1][j2] + 1,
            // deletion
            d3[i][j2 - 1] + 1,
            // insertion
            d3[i - 1][j2 - 1] + cost
            // substitution
          );
          if (i > 1 && j2 > 1 && a[i - 1] === b3[j2 - 2] && a[i - 2] === b3[j2 - 1]) {
            d3[i][j2] = Math.min(d3[i][j2], d3[i - 2][j2 - 2] + 1);
          }
        }
      }
      return d3[a.length][b3.length];
    }
    function suggestSimilar(word, candidates) {
      if (!candidates || candidates.length === 0) return "";
      candidates = Array.from(new Set(candidates));
      const searchingOptions = word.startsWith("--");
      if (searchingOptions) {
        word = word.slice(2);
        candidates = candidates.map((candidate) => candidate.slice(2));
      }
      let similar = [];
      let bestDistance = maxDistance;
      const minSimilarity = 0.4;
      candidates.forEach((candidate) => {
        if (candidate.length <= 1) return;
        const distance = editDistance(word, candidate);
        const length = Math.max(word.length, candidate.length);
        const similarity = (length - distance) / length;
        if (similarity > minSimilarity) {
          if (distance < bestDistance) {
            bestDistance = distance;
            similar = [candidate];
          } else if (distance === bestDistance) {
            similar.push(candidate);
          }
        }
      });
      similar.sort((a, b3) => a.localeCompare(b3));
      if (searchingOptions) {
        similar = similar.map((candidate) => `--${candidate}`);
      }
      if (similar.length > 1) {
        return `
(Did you mean one of ${similar.join(", ")}?)`;
      }
      if (similar.length === 1) {
        return `
(Did you mean ${similar[0]}?)`;
      }
      return "";
    }
    exports.suggestSimilar = suggestSimilar;
  }
});

// node_modules/commander/lib/command.js
var require_command = __commonJS({
  "node_modules/commander/lib/command.js"(exports) {
    var EventEmitter = __require("node:events").EventEmitter;
    var childProcess = __require("node:child_process");
    var path = __require("node:path");
    var fs = __require("node:fs");
    var process2 = __require("node:process");
    var { Argument: Argument2, humanReadableArgName } = require_argument();
    var { CommanderError: CommanderError2 } = require_error();
    var { Help: Help2, stripColor } = require_help();
    var { Option: Option2, DualOptions } = require_option();
    var { suggestSimilar } = require_suggestSimilar();
    var Command2 = class _Command extends EventEmitter {
      /**
       * Initialize a new `Command`.
       *
       * @param {string} [name]
       */
      constructor(name2) {
        super();
        this.commands = [];
        this.options = [];
        this.parent = null;
        this._allowUnknownOption = false;
        this._allowExcessArguments = false;
        this.registeredArguments = [];
        this._args = this.registeredArguments;
        this.args = [];
        this.rawArgs = [];
        this.processedArgs = [];
        this._scriptPath = null;
        this._name = name2 || "";
        this._optionValues = {};
        this._optionValueSources = {};
        this._storeOptionsAsProperties = false;
        this._actionHandler = null;
        this._executableHandler = false;
        this._executableFile = null;
        this._executableDir = null;
        this._defaultCommandName = null;
        this._exitCallback = null;
        this._aliases = [];
        this._combineFlagAndOptionalValue = true;
        this._description = "";
        this._summary = "";
        this._argsDescription = void 0;
        this._enablePositionalOptions = false;
        this._passThroughOptions = false;
        this._lifeCycleHooks = {};
        this._showHelpAfterError = false;
        this._showSuggestionAfterError = true;
        this._savedState = null;
        this._outputConfiguration = {
          writeOut: (str) => process2.stdout.write(str),
          writeErr: (str) => process2.stderr.write(str),
          outputError: (str, write2) => write2(str),
          getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : void 0,
          getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : void 0,
          getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
          getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
          stripColor: (str) => stripColor(str)
        };
        this._hidden = false;
        this._helpOption = void 0;
        this._addImplicitHelpCommand = void 0;
        this._helpCommand = void 0;
        this._helpConfiguration = {};
      }
      /**
       * Copy settings that are useful to have in common across root command and subcommands.
       *
       * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
       *
       * @param {Command} sourceCommand
       * @return {Command} `this` command for chaining
       */
      copyInheritedSettings(sourceCommand) {
        this._outputConfiguration = sourceCommand._outputConfiguration;
        this._helpOption = sourceCommand._helpOption;
        this._helpCommand = sourceCommand._helpCommand;
        this._helpConfiguration = sourceCommand._helpConfiguration;
        this._exitCallback = sourceCommand._exitCallback;
        this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
        this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
        this._allowExcessArguments = sourceCommand._allowExcessArguments;
        this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
        this._showHelpAfterError = sourceCommand._showHelpAfterError;
        this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
        return this;
      }
      /**
       * @returns {Command[]}
       * @private
       */
      _getCommandAndAncestors() {
        const result = [];
        for (let command = this; command; command = command.parent) {
          result.push(command);
        }
        return result;
      }
      /**
       * Define a command.
       *
       * There are two styles of command: pay attention to where to put the description.
       *
       * @example
       * // Command implemented using action handler (description is supplied separately to `.command`)
       * program
       *   .command('clone <source> [destination]')
       *   .description('clone a repository into a newly created directory')
       *   .action((source, destination) => {
       *     console.log('clone command called');
       *   });
       *
       * // Command implemented using separate executable file (description is second parameter to `.command`)
       * program
       *   .command('start <service>', 'start named service')
       *   .command('stop [service]', 'stop named service, or all if no name supplied');
       *
       * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
       * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
       * @param {object} [execOpts] - configuration options (for executable)
       * @return {Command} returns new command for action handler, or `this` for executable command
       */
      command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
        let desc = actionOptsOrExecDesc;
        let opts = execOpts;
        if (typeof desc === "object" && desc !== null) {
          opts = desc;
          desc = null;
        }
        opts = opts || {};
        const [, name2, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const cmd = this.createCommand(name2);
        if (desc) {
          cmd.description(desc);
          cmd._executableHandler = true;
        }
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        cmd._hidden = !!(opts.noHelp || opts.hidden);
        cmd._executableFile = opts.executableFile || null;
        if (args) cmd.arguments(args);
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd.copyInheritedSettings(this);
        if (desc) return this;
        return cmd;
      }
      /**
       * Factory routine to create a new unattached command.
       *
       * See .command() for creating an attached subcommand, which uses this routine to
       * create the command. You can override createCommand to customise subcommands.
       *
       * @param {string} [name]
       * @return {Command} new command
       */
      createCommand(name2) {
        return new _Command(name2);
      }
      /**
       * You can customise the help with a subclass of Help by overriding createHelp,
       * or by overriding Help properties using configureHelp().
       *
       * @return {Help}
       */
      createHelp() {
        return Object.assign(new Help2(), this.configureHelp());
      }
      /**
       * You can customise the help by overriding Help properties using configureHelp(),
       * or with a subclass of Help by overriding createHelp().
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureHelp(configuration) {
        if (configuration === void 0) return this._helpConfiguration;
        this._helpConfiguration = configuration;
        return this;
      }
      /**
       * The default output goes to stdout and stderr. You can customise this for special
       * applications. You can also customise the display of errors by overriding outputError.
       *
       * The configuration properties are all functions:
       *
       *     // change how output being written, defaults to stdout and stderr
       *     writeOut(str)
       *     writeErr(str)
       *     // change how output being written for errors, defaults to writeErr
       *     outputError(str, write) // used for displaying errors and not used for displaying help
       *     // specify width for wrapping help
       *     getOutHelpWidth()
       *     getErrHelpWidth()
       *     // color support, currently only used with Help
       *     getOutHasColors()
       *     getErrHasColors()
       *     stripColor() // used to remove ANSI escape codes if output does not have colors
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureOutput(configuration) {
        if (configuration === void 0) return this._outputConfiguration;
        Object.assign(this._outputConfiguration, configuration);
        return this;
      }
      /**
       * Display the help or a custom message after an error occurs.
       *
       * @param {(boolean|string)} [displayHelp]
       * @return {Command} `this` command for chaining
       */
      showHelpAfterError(displayHelp = true) {
        if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
        this._showHelpAfterError = displayHelp;
        return this;
      }
      /**
       * Display suggestion of similar commands for unknown commands, or options for unknown options.
       *
       * @param {boolean} [displaySuggestion]
       * @return {Command} `this` command for chaining
       */
      showSuggestionAfterError(displaySuggestion = true) {
        this._showSuggestionAfterError = !!displaySuggestion;
        return this;
      }
      /**
       * Add a prepared subcommand.
       *
       * See .command() for creating an attached subcommand which inherits settings from its parent.
       *
       * @param {Command} cmd - new subcommand
       * @param {object} [opts] - configuration options
       * @return {Command} `this` command for chaining
       */
      addCommand(cmd, opts) {
        if (!cmd._name) {
          throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
        }
        opts = opts || {};
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        if (opts.noHelp || opts.hidden) cmd._hidden = true;
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd._checkForBrokenPassThrough();
        return this;
      }
      /**
       * Factory routine to create a new unattached argument.
       *
       * See .argument() for creating an attached argument, which uses this routine to
       * create the argument. You can override createArgument to return a custom argument.
       *
       * @param {string} name
       * @param {string} [description]
       * @return {Argument} new argument
       */
      createArgument(name2, description) {
        return new Argument2(name2, description);
      }
      /**
       * Define argument syntax for command.
       *
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @example
       * program.argument('<input-file>');
       * program.argument('[output-file]');
       *
       * @param {string} name
       * @param {string} [description]
       * @param {(Function|*)} [fn] - custom argument processing function
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      argument(name2, description, fn, defaultValue) {
        const argument = this.createArgument(name2, description);
        if (typeof fn === "function") {
          argument.default(defaultValue).argParser(fn);
        } else {
          argument.default(fn);
        }
        this.addArgument(argument);
        return this;
      }
      /**
       * Define argument syntax for command, adding multiple at once (without descriptions).
       *
       * See also .argument().
       *
       * @example
       * program.arguments('<cmd> [env]');
       *
       * @param {string} names
       * @return {Command} `this` command for chaining
       */
      arguments(names) {
        names.trim().split(/ +/).forEach((detail) => {
          this.argument(detail);
        });
        return this;
      }
      /**
       * Define argument syntax for command, adding a prepared argument.
       *
       * @param {Argument} argument
       * @return {Command} `this` command for chaining
       */
      addArgument(argument) {
        const previousArgument = this.registeredArguments.slice(-1)[0];
        if (previousArgument && previousArgument.variadic) {
          throw new Error(
            `only the last argument can be variadic '${previousArgument.name()}'`
          );
        }
        if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
          throw new Error(
            `a default value for a required argument is never used: '${argument.name()}'`
          );
        }
        this.registeredArguments.push(argument);
        return this;
      }
      /**
       * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
       *
       * @example
       *    program.helpCommand('help [cmd]');
       *    program.helpCommand('help [cmd]', 'show help');
       *    program.helpCommand(false); // suppress default help command
       *    program.helpCommand(true); // add help command even if no subcommands
       *
       * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
       * @param {string} [description] - custom description
       * @return {Command} `this` command for chaining
       */
      helpCommand(enableOrNameAndArgs, description) {
        if (typeof enableOrNameAndArgs === "boolean") {
          this._addImplicitHelpCommand = enableOrNameAndArgs;
          return this;
        }
        enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
        const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
        const helpDescription = description ?? "display help for command";
        const helpCommand = this.createCommand(helpName);
        helpCommand.helpOption(false);
        if (helpArgs) helpCommand.arguments(helpArgs);
        if (helpDescription) helpCommand.description(helpDescription);
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Add prepared custom help command.
       *
       * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
       * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
       * @return {Command} `this` command for chaining
       */
      addHelpCommand(helpCommand, deprecatedDescription) {
        if (typeof helpCommand !== "object") {
          this.helpCommand(helpCommand, deprecatedDescription);
          return this;
        }
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        return this;
      }
      /**
       * Lazy create help command.
       *
       * @return {(Command|null)}
       * @package
       */
      _getHelpCommand() {
        const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
        if (hasImplicitHelpCommand) {
          if (this._helpCommand === void 0) {
            this.helpCommand(void 0, void 0);
          }
          return this._helpCommand;
        }
        return null;
      }
      /**
       * Add hook for life cycle event.
       *
       * @param {string} event
       * @param {Function} listener
       * @return {Command} `this` command for chaining
       */
      hook(event, listener) {
        const allowedValues = ["preSubcommand", "preAction", "postAction"];
        if (!allowedValues.includes(event)) {
          throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        if (this._lifeCycleHooks[event]) {
          this._lifeCycleHooks[event].push(listener);
        } else {
          this._lifeCycleHooks[event] = [listener];
        }
        return this;
      }
      /**
       * Register callback to use as replacement for calling process.exit.
       *
       * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
       * @return {Command} `this` command for chaining
       */
      exitOverride(fn) {
        if (fn) {
          this._exitCallback = fn;
        } else {
          this._exitCallback = (err) => {
            if (err.code !== "commander.executeSubCommandAsync") {
              throw err;
            } else {
            }
          };
        }
        return this;
      }
      /**
       * Call process.exit, and _exitCallback if defined.
       *
       * @param {number} exitCode exit code for using with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @return never
       * @private
       */
      _exit(exitCode, code, message) {
        if (this._exitCallback) {
          this._exitCallback(new CommanderError2(exitCode, code, message));
        }
        process2.exit(exitCode);
      }
      /**
       * Register callback `fn` for the command.
       *
       * @example
       * program
       *   .command('serve')
       *   .description('start service')
       *   .action(function() {
       *      // do work here
       *   });
       *
       * @param {Function} fn
       * @return {Command} `this` command for chaining
       */
      action(fn) {
        const listener = (args) => {
          const expectedArgsCount = this.registeredArguments.length;
          const actionArgs = args.slice(0, expectedArgsCount);
          if (this._storeOptionsAsProperties) {
            actionArgs[expectedArgsCount] = this;
          } else {
            actionArgs[expectedArgsCount] = this.opts();
          }
          actionArgs.push(this);
          return fn.apply(this, actionArgs);
        };
        this._actionHandler = listener;
        return this;
      }
      /**
       * Factory routine to create a new unattached option.
       *
       * See .option() for creating an attached option, which uses this routine to
       * create the option. You can override createOption to return a custom option.
       *
       * @param {string} flags
       * @param {string} [description]
       * @return {Option} new option
       */
      createOption(flags, description) {
        return new Option2(flags, description);
      }
      /**
       * Wrap parseArgs to catch 'commander.invalidArgument'.
       *
       * @param {(Option | Argument)} target
       * @param {string} value
       * @param {*} previous
       * @param {string} invalidArgumentMessage
       * @private
       */
      _callParseArg(target, value, previous, invalidArgumentMessage) {
        try {
          return target.parseArg(value, previous);
        } catch (err) {
          if (err.code === "commander.invalidArgument") {
            const message = `${invalidArgumentMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      /**
       * Check for option flag conflicts.
       * Register option if no conflicts found, or throw on conflict.
       *
       * @param {Option} option
       * @private
       */
      _registerOption(option) {
        const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
        if (matchingOption) {
          const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
          throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
        }
        this.options.push(option);
      }
      /**
       * Check for command name and alias conflicts with existing commands.
       * Register command if no conflicts found, or throw on conflict.
       *
       * @param {Command} command
       * @private
       */
      _registerCommand(command) {
        const knownBy = (cmd) => {
          return [cmd.name()].concat(cmd.aliases());
        };
        const alreadyUsed = knownBy(command).find(
          (name2) => this._findCommand(name2)
        );
        if (alreadyUsed) {
          const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
          const newCmd = knownBy(command).join("|");
          throw new Error(
            `cannot add command '${newCmd}' as already have command '${existingCmd}'`
          );
        }
        this.commands.push(command);
      }
      /**
       * Add an option.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addOption(option) {
        this._registerOption(option);
        const oname = option.name();
        const name2 = option.attributeName();
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, "--");
          if (!this._findOption(positiveLongFlag)) {
            this.setOptionValueWithSource(
              name2,
              option.defaultValue === void 0 ? true : option.defaultValue,
              "default"
            );
          }
        } else if (option.defaultValue !== void 0) {
          this.setOptionValueWithSource(name2, option.defaultValue, "default");
        }
        const handleOptionValue = (val, invalidValueMessage, valueSource) => {
          if (val == null && option.presetArg !== void 0) {
            val = option.presetArg;
          }
          const oldValue = this.getOptionValue(name2);
          if (val !== null && option.parseArg) {
            val = this._callParseArg(option, val, oldValue, invalidValueMessage);
          } else if (val !== null && option.variadic) {
            val = option._concatValue(val, oldValue);
          }
          if (val == null) {
            if (option.negate) {
              val = false;
            } else if (option.isBoolean() || option.optional) {
              val = true;
            } else {
              val = "";
            }
          }
          this.setOptionValueWithSource(name2, val, valueSource);
        };
        this.on("option:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "cli");
        });
        if (option.envVar) {
          this.on("optionEnv:" + oname, (val) => {
            const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
            handleOptionValue(val, invalidValueMessage, "env");
          });
        }
        return this;
      }
      /**
       * Internal implementation shared by .option() and .requiredOption()
       *
       * @return {Command} `this` command for chaining
       * @private
       */
      _optionEx(config2, flags, description, fn, defaultValue) {
        if (typeof flags === "object" && flags instanceof Option2) {
          throw new Error(
            "To add an Option object use addOption() instead of option() or requiredOption()"
          );
        }
        const option = this.createOption(flags, description);
        option.makeOptionMandatory(!!config2.mandatory);
        if (typeof fn === "function") {
          option.default(defaultValue).argParser(fn);
        } else if (fn instanceof RegExp) {
          const regex = fn;
          fn = (val, def) => {
            const m2 = regex.exec(val);
            return m2 ? m2[0] : def;
          };
          option.default(defaultValue).argParser(fn);
        } else {
          option.default(fn);
        }
        return this.addOption(option);
      }
      /**
       * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
       * option-argument is indicated by `<>` and an optional option-argument by `[]`.
       *
       * See the README for more details, and see also addOption() and requiredOption().
       *
       * @example
       * program
       *     .option('-p, --pepper', 'add pepper')
       *     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
       *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
       *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      option(flags, description, parseArg, defaultValue) {
        return this._optionEx({}, flags, description, parseArg, defaultValue);
      }
      /**
       * Add a required option which must have a value after parsing. This usually means
       * the option must be specified on the command line. (Otherwise the same as .option().)
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      requiredOption(flags, description, parseArg, defaultValue) {
        return this._optionEx(
          { mandatory: true },
          flags,
          description,
          parseArg,
          defaultValue
        );
      }
      /**
       * Alter parsing of short flags with optional values.
       *
       * @example
       * // for `.option('-f,--flag [value]'):
       * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
       * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
       *
       * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
       * @return {Command} `this` command for chaining
       */
      combineFlagAndOptionalValue(combine = true) {
        this._combineFlagAndOptionalValue = !!combine;
        return this;
      }
      /**
       * Allow unknown options on the command line.
       *
       * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
       * @return {Command} `this` command for chaining
       */
      allowUnknownOption(allowUnknown = true) {
        this._allowUnknownOption = !!allowUnknown;
        return this;
      }
      /**
       * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
       *
       * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
       * @return {Command} `this` command for chaining
       */
      allowExcessArguments(allowExcess = true) {
        this._allowExcessArguments = !!allowExcess;
        return this;
      }
      /**
       * Enable positional options. Positional means global options are specified before subcommands which lets
       * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
       * The default behaviour is non-positional and global options may appear anywhere on the command line.
       *
       * @param {boolean} [positional]
       * @return {Command} `this` command for chaining
       */
      enablePositionalOptions(positional = true) {
        this._enablePositionalOptions = !!positional;
        return this;
      }
      /**
       * Pass through options that come after command-arguments rather than treat them as command-options,
       * so actual command-options come before command-arguments. Turning this on for a subcommand requires
       * positional options to have been enabled on the program (parent commands).
       * The default behaviour is non-positional and options may appear before or after command-arguments.
       *
       * @param {boolean} [passThrough] for unknown options.
       * @return {Command} `this` command for chaining
       */
      passThroughOptions(passThrough = true) {
        this._passThroughOptions = !!passThrough;
        this._checkForBrokenPassThrough();
        return this;
      }
      /**
       * @private
       */
      _checkForBrokenPassThrough() {
        if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
          throw new Error(
            `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
          );
        }
      }
      /**
       * Whether to store option values as properties on command object,
       * or store separately (specify false). In both cases the option values can be accessed using .opts().
       *
       * @param {boolean} [storeAsProperties=true]
       * @return {Command} `this` command for chaining
       */
      storeOptionsAsProperties(storeAsProperties = true) {
        if (this.options.length) {
          throw new Error("call .storeOptionsAsProperties() before adding options");
        }
        if (Object.keys(this._optionValues).length) {
          throw new Error(
            "call .storeOptionsAsProperties() before setting option values"
          );
        }
        this._storeOptionsAsProperties = !!storeAsProperties;
        return this;
      }
      /**
       * Retrieve option value.
       *
       * @param {string} key
       * @return {object} value
       */
      getOptionValue(key) {
        if (this._storeOptionsAsProperties) {
          return this[key];
        }
        return this._optionValues[key];
      }
      /**
       * Store option value.
       *
       * @param {string} key
       * @param {object} value
       * @return {Command} `this` command for chaining
       */
      setOptionValue(key, value) {
        return this.setOptionValueWithSource(key, value, void 0);
      }
      /**
       * Store option value and where the value came from.
       *
       * @param {string} key
       * @param {object} value
       * @param {string} source - expected values are default/config/env/cli/implied
       * @return {Command} `this` command for chaining
       */
      setOptionValueWithSource(key, value, source) {
        if (this._storeOptionsAsProperties) {
          this[key] = value;
        } else {
          this._optionValues[key] = value;
        }
        this._optionValueSources[key] = source;
        return this;
      }
      /**
       * Get source of option value.
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSource(key) {
        return this._optionValueSources[key];
      }
      /**
       * Get source of option value. See also .optsWithGlobals().
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSourceWithGlobals(key) {
        let source;
        this._getCommandAndAncestors().forEach((cmd) => {
          if (cmd.getOptionValueSource(key) !== void 0) {
            source = cmd.getOptionValueSource(key);
          }
        });
        return source;
      }
      /**
       * Get user arguments from implied or explicit arguments.
       * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
       *
       * @private
       */
      _prepareUserArgs(argv, parseOptions) {
        if (argv !== void 0 && !Array.isArray(argv)) {
          throw new Error("first parameter to parse must be array or undefined");
        }
        parseOptions = parseOptions || {};
        if (argv === void 0 && parseOptions.from === void 0) {
          if (process2.versions?.electron) {
            parseOptions.from = "electron";
          }
          const execArgv = process2.execArgv ?? [];
          if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
            parseOptions.from = "eval";
          }
        }
        if (argv === void 0) {
          argv = process2.argv;
        }
        this.rawArgs = argv.slice();
        let userArgs;
        switch (parseOptions.from) {
          case void 0:
          case "node":
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
            break;
          case "electron":
            if (process2.defaultApp) {
              this._scriptPath = argv[1];
              userArgs = argv.slice(2);
            } else {
              userArgs = argv.slice(1);
            }
            break;
          case "user":
            userArgs = argv.slice(0);
            break;
          case "eval":
            userArgs = argv.slice(1);
            break;
          default:
            throw new Error(
              `unexpected parse option { from: '${parseOptions.from}' }`
            );
        }
        if (!this._name && this._scriptPath)
          this.nameFromFilename(this._scriptPath);
        this._name = this._name || "program";
        return userArgs;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Use parseAsync instead of parse if any of your action handlers are async.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * program.parse(); // parse process.argv and auto-detect electron and special node flags
       * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
       * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv] - optional, defaults to process.argv
       * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
       * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
       * @return {Command} `this` command for chaining
       */
      parse(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
       * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
       * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv]
       * @param {object} [parseOptions]
       * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
       * @return {Promise}
       */
      async parseAsync(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        await this._parseCommand([], userArgs);
        return this;
      }
      _prepareForParse() {
        if (this._savedState === null) {
          this.saveStateBeforeParse();
        } else {
          this.restoreStateBeforeParse();
        }
      }
      /**
       * Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state saved.
       */
      saveStateBeforeParse() {
        this._savedState = {
          // name is stable if supplied by author, but may be unspecified for root command and deduced during parsing
          _name: this._name,
          // option values before parse have default values (including false for negated options)
          // shallow clones
          _optionValues: { ...this._optionValues },
          _optionValueSources: { ...this._optionValueSources }
        };
      }
      /**
       * Restore state before parse for calls after the first.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state restored.
       */
      restoreStateBeforeParse() {
        if (this._storeOptionsAsProperties)
          throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
        this._name = this._savedState._name;
        this._scriptPath = null;
        this.rawArgs = [];
        this._optionValues = { ...this._savedState._optionValues };
        this._optionValueSources = { ...this._savedState._optionValueSources };
        this.args = [];
        this.processedArgs = [];
      }
      /**
       * Throw if expected executable is missing. Add lots of help for author.
       *
       * @param {string} executableFile
       * @param {string} executableDir
       * @param {string} subcommandName
       */
      _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
        if (fs.existsSync(executableFile)) return;
        const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
        const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
        throw new Error(executableMissing);
      }
      /**
       * Execute a sub-command executable.
       *
       * @private
       */
      _executeSubCommand(subcommand, args) {
        args = args.slice();
        let launchWithNode = false;
        const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
        function findFile(baseDir, baseName) {
          const localBin = path.resolve(baseDir, baseName);
          if (fs.existsSync(localBin)) return localBin;
          if (sourceExt.includes(path.extname(baseName))) return void 0;
          const foundExt = sourceExt.find(
            (ext) => fs.existsSync(`${localBin}${ext}`)
          );
          if (foundExt) return `${localBin}${foundExt}`;
          return void 0;
        }
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
        let executableDir = this._executableDir || "";
        if (this._scriptPath) {
          let resolvedScriptPath;
          try {
            resolvedScriptPath = fs.realpathSync(this._scriptPath);
          } catch {
            resolvedScriptPath = this._scriptPath;
          }
          executableDir = path.resolve(
            path.dirname(resolvedScriptPath),
            executableDir
          );
        }
        if (executableDir) {
          let localFile = findFile(executableDir, executableFile);
          if (!localFile && !subcommand._executableFile && this._scriptPath) {
            const legacyName = path.basename(
              this._scriptPath,
              path.extname(this._scriptPath)
            );
            if (legacyName !== this._name) {
              localFile = findFile(
                executableDir,
                `${legacyName}-${subcommand._name}`
              );
            }
          }
          executableFile = localFile || executableFile;
        }
        launchWithNode = sourceExt.includes(path.extname(executableFile));
        let proc;
        if (process2.platform !== "win32") {
          if (launchWithNode) {
            args.unshift(executableFile);
            args = incrementNodeInspectorPort(process2.execArgv).concat(args);
            proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
          } else {
            proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
          }
        } else {
          this._checkForMissingExecutable(
            executableFile,
            executableDir,
            subcommand._name
          );
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
        }
        if (!proc.killed) {
          const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
          signals.forEach((signal) => {
            process2.on(signal, () => {
              if (proc.killed === false && proc.exitCode === null) {
                proc.kill(signal);
              }
            });
          });
        }
        const exitCallback = this._exitCallback;
        proc.on("close", (code) => {
          code = code ?? 1;
          if (!exitCallback) {
            process2.exit(code);
          } else {
            exitCallback(
              new CommanderError2(
                code,
                "commander.executeSubCommandAsync",
                "(close)"
              )
            );
          }
        });
        proc.on("error", (err) => {
          if (err.code === "ENOENT") {
            this._checkForMissingExecutable(
              executableFile,
              executableDir,
              subcommand._name
            );
          } else if (err.code === "EACCES") {
            throw new Error(`'${executableFile}' not executable`);
          }
          if (!exitCallback) {
            process2.exit(1);
          } else {
            const wrappedError = new CommanderError2(
              1,
              "commander.executeSubCommandAsync",
              "(error)"
            );
            wrappedError.nestedError = err;
            exitCallback(wrappedError);
          }
        });
        this.runningCommand = proc;
      }
      /**
       * @private
       */
      _dispatchSubcommand(commandName, operands, unknown) {
        const subCommand = this._findCommand(commandName);
        if (!subCommand) this.help({ error: true });
        subCommand._prepareForParse();
        let promiseChain;
        promiseChain = this._chainOrCallSubCommandHook(
          promiseChain,
          subCommand,
          "preSubcommand"
        );
        promiseChain = this._chainOrCall(promiseChain, () => {
          if (subCommand._executableHandler) {
            this._executeSubCommand(subCommand, operands.concat(unknown));
          } else {
            return subCommand._parseCommand(operands, unknown);
          }
        });
        return promiseChain;
      }
      /**
       * Invoke help directly if possible, or dispatch if necessary.
       * e.g. help foo
       *
       * @private
       */
      _dispatchHelpCommand(subcommandName) {
        if (!subcommandName) {
          this.help();
        }
        const subCommand = this._findCommand(subcommandName);
        if (subCommand && !subCommand._executableHandler) {
          subCommand.help();
        }
        return this._dispatchSubcommand(
          subcommandName,
          [],
          [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
        );
      }
      /**
       * Check this.args against expected this.registeredArguments.
       *
       * @private
       */
      _checkNumberOfArguments() {
        this.registeredArguments.forEach((arg, i) => {
          if (arg.required && this.args[i] == null) {
            this.missingArgument(arg.name());
          }
        });
        if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
          return;
        }
        if (this.args.length > this.registeredArguments.length) {
          this._excessArguments(this.args);
        }
      }
      /**
       * Process this.args using this.registeredArguments and save as this.processedArgs!
       *
       * @private
       */
      _processArguments() {
        const myParseArg = (argument, value, previous) => {
          let parsedValue = value;
          if (value !== null && argument.parseArg) {
            const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
            parsedValue = this._callParseArg(
              argument,
              value,
              previous,
              invalidValueMessage
            );
          }
          return parsedValue;
        };
        this._checkNumberOfArguments();
        const processedArgs = [];
        this.registeredArguments.forEach((declaredArg, index) => {
          let value = declaredArg.defaultValue;
          if (declaredArg.variadic) {
            if (index < this.args.length) {
              value = this.args.slice(index);
              if (declaredArg.parseArg) {
                value = value.reduce((processed, v2) => {
                  return myParseArg(declaredArg, v2, processed);
                }, declaredArg.defaultValue);
              }
            } else if (value === void 0) {
              value = [];
            }
          } else if (index < this.args.length) {
            value = this.args[index];
            if (declaredArg.parseArg) {
              value = myParseArg(declaredArg, value, declaredArg.defaultValue);
            }
          }
          processedArgs[index] = value;
        });
        this.processedArgs = processedArgs;
      }
      /**
       * Once we have a promise we chain, but call synchronously until then.
       *
       * @param {(Promise|undefined)} promise
       * @param {Function} fn
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCall(promise, fn) {
        if (promise && promise.then && typeof promise.then === "function") {
          return promise.then(() => fn());
        }
        return fn();
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallHooks(promise, event) {
        let result = promise;
        const hooks = [];
        this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
          hookedCommand._lifeCycleHooks[event].forEach((callback) => {
            hooks.push({ hookedCommand, callback });
          });
        });
        if (event === "postAction") {
          hooks.reverse();
        }
        hooks.forEach((hookDetail) => {
          result = this._chainOrCall(result, () => {
            return hookDetail.callback(hookDetail.hookedCommand, this);
          });
        });
        return result;
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {Command} subCommand
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallSubCommandHook(promise, subCommand, event) {
        let result = promise;
        if (this._lifeCycleHooks[event] !== void 0) {
          this._lifeCycleHooks[event].forEach((hook) => {
            result = this._chainOrCall(result, () => {
              return hook(this, subCommand);
            });
          });
        }
        return result;
      }
      /**
       * Process arguments in context of this command.
       * Returns action result, in case it is a promise.
       *
       * @private
       */
      _parseCommand(operands, unknown) {
        const parsed = this.parseOptions(unknown);
        this._parseOptionsEnv();
        this._parseOptionsImplied();
        operands = operands.concat(parsed.operands);
        unknown = parsed.unknown;
        this.args = operands.concat(unknown);
        if (operands && this._findCommand(operands[0])) {
          return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
        }
        if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
          return this._dispatchHelpCommand(operands[1]);
        }
        if (this._defaultCommandName) {
          this._outputHelpIfRequested(unknown);
          return this._dispatchSubcommand(
            this._defaultCommandName,
            operands,
            unknown
          );
        }
        if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
          this.help({ error: true });
        }
        this._outputHelpIfRequested(parsed.unknown);
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        const checkForUnknownOptions = () => {
          if (parsed.unknown.length > 0) {
            this.unknownOption(parsed.unknown[0]);
          }
        };
        const commandEvent = `command:${this.name()}`;
        if (this._actionHandler) {
          checkForUnknownOptions();
          this._processArguments();
          let promiseChain;
          promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
          promiseChain = this._chainOrCall(
            promiseChain,
            () => this._actionHandler(this.processedArgs)
          );
          if (this.parent) {
            promiseChain = this._chainOrCall(promiseChain, () => {
              this.parent.emit(commandEvent, operands, unknown);
            });
          }
          promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
          return promiseChain;
        }
        if (this.parent && this.parent.listenerCount(commandEvent)) {
          checkForUnknownOptions();
          this._processArguments();
          this.parent.emit(commandEvent, operands, unknown);
        } else if (operands.length) {
          if (this._findCommand("*")) {
            return this._dispatchSubcommand("*", operands, unknown);
          }
          if (this.listenerCount("command:*")) {
            this.emit("command:*", operands, unknown);
          } else if (this.commands.length) {
            this.unknownCommand();
          } else {
            checkForUnknownOptions();
            this._processArguments();
          }
        } else if (this.commands.length) {
          checkForUnknownOptions();
          this.help({ error: true });
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      }
      /**
       * Find matching command.
       *
       * @private
       * @return {Command | undefined}
       */
      _findCommand(name2) {
        if (!name2) return void 0;
        return this.commands.find(
          (cmd) => cmd._name === name2 || cmd._aliases.includes(name2)
        );
      }
      /**
       * Return an option matching `arg` if any.
       *
       * @param {string} arg
       * @return {Option}
       * @package
       */
      _findOption(arg) {
        return this.options.find((option) => option.is(arg));
      }
      /**
       * Display an error message if a mandatory option does not have a value.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForMissingMandatoryOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd.options.forEach((anOption) => {
            if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
              cmd.missingMandatoryOptionValue(anOption);
            }
          });
        });
      }
      /**
       * Display an error message if conflicting options are used together in this.
       *
       * @private
       */
      _checkForConflictingLocalOptions() {
        const definedNonDefaultOptions = this.options.filter((option) => {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === void 0) {
            return false;
          }
          return this.getOptionValueSource(optionKey) !== "default";
        });
        const optionsWithConflicting = definedNonDefaultOptions.filter(
          (option) => option.conflictsWith.length > 0
        );
        optionsWithConflicting.forEach((option) => {
          const conflictingAndDefined = definedNonDefaultOptions.find(
            (defined) => option.conflictsWith.includes(defined.attributeName())
          );
          if (conflictingAndDefined) {
            this._conflictingOption(option, conflictingAndDefined);
          }
        });
      }
      /**
       * Display an error message if conflicting options are used together.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForConflictingOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd._checkForConflictingLocalOptions();
        });
      }
      /**
       * Parse options from `argv` removing known options,
       * and return argv split into operands and unknown arguments.
       *
       * Side effects: modifies command by storing options. Does not reset state if called again.
       *
       * Examples:
       *
       *     argv => operands, unknown
       *     --known kkk op => [op], []
       *     op --known kkk => [op], []
       *     sub --unknown uuu op => [sub], [--unknown uuu op]
       *     sub -- --unknown uuu op => [sub --unknown uuu op], []
       *
       * @param {string[]} argv
       * @return {{operands: string[], unknown: string[]}}
       */
      parseOptions(argv) {
        const operands = [];
        const unknown = [];
        let dest = operands;
        const args = argv.slice();
        function maybeOption(arg) {
          return arg.length > 1 && arg[0] === "-";
        }
        let activeVariadicOption = null;
        while (args.length) {
          const arg = args.shift();
          if (arg === "--") {
            if (dest === unknown) dest.push(arg);
            dest.push(...args);
            break;
          }
          if (activeVariadicOption && !maybeOption(arg)) {
            this.emit(`option:${activeVariadicOption.name()}`, arg);
            continue;
          }
          activeVariadicOption = null;
          if (maybeOption(arg)) {
            const option = this._findOption(arg);
            if (option) {
              if (option.required) {
                const value = args.shift();
                if (value === void 0) this.optionMissingArgument(option);
                this.emit(`option:${option.name()}`, value);
              } else if (option.optional) {
                let value = null;
                if (args.length > 0 && !maybeOption(args[0])) {
                  value = args.shift();
                }
                this.emit(`option:${option.name()}`, value);
              } else {
                this.emit(`option:${option.name()}`);
              }
              activeVariadicOption = option.variadic ? option : null;
              continue;
            }
          }
          if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
            const option = this._findOption(`-${arg[1]}`);
            if (option) {
              if (option.required || option.optional && this._combineFlagAndOptionalValue) {
                this.emit(`option:${option.name()}`, arg.slice(2));
              } else {
                this.emit(`option:${option.name()}`);
                args.unshift(`-${arg.slice(2)}`);
              }
              continue;
            }
          }
          if (/^--[^=]+=/.test(arg)) {
            const index = arg.indexOf("=");
            const option = this._findOption(arg.slice(0, index));
            if (option && (option.required || option.optional)) {
              this.emit(`option:${option.name()}`, arg.slice(index + 1));
              continue;
            }
          }
          if (maybeOption(arg)) {
            dest = unknown;
          }
          if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
            if (this._findCommand(arg)) {
              operands.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
              operands.push(arg);
              if (args.length > 0) operands.push(...args);
              break;
            } else if (this._defaultCommandName) {
              unknown.push(arg);
              if (args.length > 0) unknown.push(...args);
              break;
            }
          }
          if (this._passThroughOptions) {
            dest.push(arg);
            if (args.length > 0) dest.push(...args);
            break;
          }
          dest.push(arg);
        }
        return { operands, unknown };
      }
      /**
       * Return an object containing local option values as key-value pairs.
       *
       * @return {object}
       */
      opts() {
        if (this._storeOptionsAsProperties) {
          const result = {};
          const len = this.options.length;
          for (let i = 0; i < len; i++) {
            const key = this.options[i].attributeName();
            result[key] = key === this._versionOptionName ? this._version : this[key];
          }
          return result;
        }
        return this._optionValues;
      }
      /**
       * Return an object containing merged local and global option values as key-value pairs.
       *
       * @return {object}
       */
      optsWithGlobals() {
        return this._getCommandAndAncestors().reduce(
          (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
          {}
        );
      }
      /**
       * Display error message and exit (or call exitOverride).
       *
       * @param {string} message
       * @param {object} [errorOptions]
       * @param {string} [errorOptions.code] - an id string representing the error
       * @param {number} [errorOptions.exitCode] - used with process.exit
       */
      error(message, errorOptions) {
        this._outputConfiguration.outputError(
          `${message}
`,
          this._outputConfiguration.writeErr
        );
        if (typeof this._showHelpAfterError === "string") {
          this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
        } else if (this._showHelpAfterError) {
          this._outputConfiguration.writeErr("\n");
          this.outputHelp({ error: true });
        }
        const config2 = errorOptions || {};
        const exitCode = config2.exitCode || 1;
        const code = config2.code || "commander.error";
        this._exit(exitCode, code, message);
      }
      /**
       * Apply any option related environment variables, if option does
       * not have a value from cli or client code.
       *
       * @private
       */
      _parseOptionsEnv() {
        this.options.forEach((option) => {
          if (option.envVar && option.envVar in process2.env) {
            const optionKey = option.attributeName();
            if (this.getOptionValue(optionKey) === void 0 || ["default", "config", "env"].includes(
              this.getOptionValueSource(optionKey)
            )) {
              if (option.required || option.optional) {
                this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
              } else {
                this.emit(`optionEnv:${option.name()}`);
              }
            }
          }
        });
      }
      /**
       * Apply any implied option values, if option is undefined or default value.
       *
       * @private
       */
      _parseOptionsImplied() {
        const dualHelper = new DualOptions(this.options);
        const hasCustomOptionValue = (optionKey) => {
          return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
        };
        this.options.filter(
          (option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(
            this.getOptionValue(option.attributeName()),
            option
          )
        ).forEach((option) => {
          Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
            this.setOptionValueWithSource(
              impliedKey,
              option.implied[impliedKey],
              "implied"
            );
          });
        });
      }
      /**
       * Argument `name` is missing.
       *
       * @param {string} name
       * @private
       */
      missingArgument(name2) {
        const message = `error: missing required argument '${name2}'`;
        this.error(message, { code: "commander.missingArgument" });
      }
      /**
       * `Option` is missing an argument.
       *
       * @param {Option} option
       * @private
       */
      optionMissingArgument(option) {
        const message = `error: option '${option.flags}' argument missing`;
        this.error(message, { code: "commander.optionMissingArgument" });
      }
      /**
       * `Option` does not have a value, and is a mandatory option.
       *
       * @param {Option} option
       * @private
       */
      missingMandatoryOptionValue(option) {
        const message = `error: required option '${option.flags}' not specified`;
        this.error(message, { code: "commander.missingMandatoryOptionValue" });
      }
      /**
       * `Option` conflicts with another option.
       *
       * @param {Option} option
       * @param {Option} conflictingOption
       * @private
       */
      _conflictingOption(option, conflictingOption) {
        const findBestOptionFromValue = (option2) => {
          const optionKey = option2.attributeName();
          const optionValue = this.getOptionValue(optionKey);
          const negativeOption = this.options.find(
            (target) => target.negate && optionKey === target.attributeName()
          );
          const positiveOption = this.options.find(
            (target) => !target.negate && optionKey === target.attributeName()
          );
          if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) {
            return negativeOption;
          }
          return positiveOption || option2;
        };
        const getErrorMessage = (option2) => {
          const bestOption = findBestOptionFromValue(option2);
          const optionKey = bestOption.attributeName();
          const source = this.getOptionValueSource(optionKey);
          if (source === "env") {
            return `environment variable '${bestOption.envVar}'`;
          }
          return `option '${bestOption.flags}'`;
        };
        const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
        this.error(message, { code: "commander.conflictingOption" });
      }
      /**
       * Unknown option `flag`.
       *
       * @param {string} flag
       * @private
       */
      unknownOption(flag) {
        if (this._allowUnknownOption) return;
        let suggestion = "";
        if (flag.startsWith("--") && this._showSuggestionAfterError) {
          let candidateFlags = [];
          let command = this;
          do {
            const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
            candidateFlags = candidateFlags.concat(moreFlags);
            command = command.parent;
          } while (command && !command._enablePositionalOptions);
          suggestion = suggestSimilar(flag, candidateFlags);
        }
        const message = `error: unknown option '${flag}'${suggestion}`;
        this.error(message, { code: "commander.unknownOption" });
      }
      /**
       * Excess arguments, more than expected.
       *
       * @param {string[]} receivedArgs
       * @private
       */
      _excessArguments(receivedArgs) {
        if (this._allowExcessArguments) return;
        const expected = this.registeredArguments.length;
        const s = expected === 1 ? "" : "s";
        const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
        const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
        this.error(message, { code: "commander.excessArguments" });
      }
      /**
       * Unknown command.
       *
       * @private
       */
      unknownCommand() {
        const unknownName = this.args[0];
        let suggestion = "";
        if (this._showSuggestionAfterError) {
          const candidateNames = [];
          this.createHelp().visibleCommands(this).forEach((command) => {
            candidateNames.push(command.name());
            if (command.alias()) candidateNames.push(command.alias());
          });
          suggestion = suggestSimilar(unknownName, candidateNames);
        }
        const message = `error: unknown command '${unknownName}'${suggestion}`;
        this.error(message, { code: "commander.unknownCommand" });
      }
      /**
       * Get or set the program version.
       *
       * This method auto-registers the "-V, --version" option which will print the version number.
       *
       * You can optionally supply the flags and description to override the defaults.
       *
       * @param {string} [str]
       * @param {string} [flags]
       * @param {string} [description]
       * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
       */
      version(str, flags, description) {
        if (str === void 0) return this._version;
        this._version = str;
        flags = flags || "-V, --version";
        description = description || "output the version number";
        const versionOption = this.createOption(flags, description);
        this._versionOptionName = versionOption.attributeName();
        this._registerOption(versionOption);
        this.on("option:" + versionOption.name(), () => {
          this._outputConfiguration.writeOut(`${str}
`);
          this._exit(0, "commander.version", str);
        });
        return this;
      }
      /**
       * Set the description.
       *
       * @param {string} [str]
       * @param {object} [argsDescription]
       * @return {(string|Command)}
       */
      description(str, argsDescription) {
        if (str === void 0 && argsDescription === void 0)
          return this._description;
        this._description = str;
        if (argsDescription) {
          this._argsDescription = argsDescription;
        }
        return this;
      }
      /**
       * Set the summary. Used when listed as subcommand of parent.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      summary(str) {
        if (str === void 0) return this._summary;
        this._summary = str;
        return this;
      }
      /**
       * Set an alias for the command.
       *
       * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
       *
       * @param {string} [alias]
       * @return {(string|Command)}
       */
      alias(alias) {
        if (alias === void 0) return this._aliases[0];
        let command = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command = this.commands[this.commands.length - 1];
        }
        if (alias === command._name)
          throw new Error("Command alias can't be the same as its name");
        const matchingCommand = this.parent?._findCommand(alias);
        if (matchingCommand) {
          const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
          throw new Error(
            `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
          );
        }
        command._aliases.push(alias);
        return this;
      }
      /**
       * Set aliases for the command.
       *
       * Only the first alias is shown in the auto-generated help.
       *
       * @param {string[]} [aliases]
       * @return {(string[]|Command)}
       */
      aliases(aliases) {
        if (aliases === void 0) return this._aliases;
        aliases.forEach((alias) => this.alias(alias));
        return this;
      }
      /**
       * Set / get the command usage `str`.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      usage(str) {
        if (str === void 0) {
          if (this._usage) return this._usage;
          const args = this.registeredArguments.map((arg) => {
            return humanReadableArgName(arg);
          });
          return [].concat(
            this.options.length || this._helpOption !== null ? "[options]" : [],
            this.commands.length ? "[command]" : [],
            this.registeredArguments.length ? args : []
          ).join(" ");
        }
        this._usage = str;
        return this;
      }
      /**
       * Get or set the name of the command.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      name(str) {
        if (str === void 0) return this._name;
        this._name = str;
        return this;
      }
      /**
       * Set the name of the command from script filename, such as process.argv[1],
       * or require.main.filename, or __filename.
       *
       * (Used internally and public although not documented in README.)
       *
       * @example
       * program.nameFromFilename(require.main.filename);
       *
       * @param {string} filename
       * @return {Command}
       */
      nameFromFilename(filename) {
        this._name = path.basename(filename, path.extname(filename));
        return this;
      }
      /**
       * Get or set the directory for searching for executable subcommands of this command.
       *
       * @example
       * program.executableDir(__dirname);
       * // or
       * program.executableDir('subcommands');
       *
       * @param {string} [path]
       * @return {(string|null|Command)}
       */
      executableDir(path2) {
        if (path2 === void 0) return this._executableDir;
        this._executableDir = path2;
        return this;
      }
      /**
       * Return program help documentation.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
       * @return {string}
       */
      helpInformation(contextOptions) {
        const helper = this.createHelp();
        const context = this._getOutputContext(contextOptions);
        helper.prepareContext({
          error: context.error,
          helpWidth: context.helpWidth,
          outputHasColors: context.hasColors
        });
        const text2 = helper.formatHelp(this, helper);
        if (context.hasColors) return text2;
        return this._outputConfiguration.stripColor(text2);
      }
      /**
       * @typedef HelpContext
       * @type {object}
       * @property {boolean} error
       * @property {number} helpWidth
       * @property {boolean} hasColors
       * @property {function} write - includes stripColor if needed
       *
       * @returns {HelpContext}
       * @private
       */
      _getOutputContext(contextOptions) {
        contextOptions = contextOptions || {};
        const error2 = !!contextOptions.error;
        let baseWrite;
        let hasColors;
        let helpWidth;
        if (error2) {
          baseWrite = (str) => this._outputConfiguration.writeErr(str);
          hasColors = this._outputConfiguration.getErrHasColors();
          helpWidth = this._outputConfiguration.getErrHelpWidth();
        } else {
          baseWrite = (str) => this._outputConfiguration.writeOut(str);
          hasColors = this._outputConfiguration.getOutHasColors();
          helpWidth = this._outputConfiguration.getOutHelpWidth();
        }
        const write2 = (str) => {
          if (!hasColors) str = this._outputConfiguration.stripColor(str);
          return baseWrite(str);
        };
        return { error: error2, write: write2, hasColors, helpWidth };
      }
      /**
       * Output help information for this command.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      outputHelp(contextOptions) {
        let deprecatedCallback;
        if (typeof contextOptions === "function") {
          deprecatedCallback = contextOptions;
          contextOptions = void 0;
        }
        const outputContext = this._getOutputContext(contextOptions);
        const eventContext = {
          error: outputContext.error,
          write: outputContext.write,
          command: this
        };
        this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
        this.emit("beforeHelp", eventContext);
        let helpInformation = this.helpInformation({ error: outputContext.error });
        if (deprecatedCallback) {
          helpInformation = deprecatedCallback(helpInformation);
          if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
            throw new Error("outputHelp callback must return a string or a Buffer");
          }
        }
        outputContext.write(helpInformation);
        if (this._getHelpOption()?.long) {
          this.emit(this._getHelpOption().long);
        }
        this.emit("afterHelp", eventContext);
        this._getCommandAndAncestors().forEach(
          (command) => command.emit("afterAllHelp", eventContext)
        );
      }
      /**
       * You can pass in flags and a description to customise the built-in help option.
       * Pass in false to disable the built-in help option.
       *
       * @example
       * program.helpOption('-?, --help' 'show help'); // customise
       * program.helpOption(false); // disable
       *
       * @param {(string | boolean)} flags
       * @param {string} [description]
       * @return {Command} `this` command for chaining
       */
      helpOption(flags, description) {
        if (typeof flags === "boolean") {
          if (flags) {
            this._helpOption = this._helpOption ?? void 0;
          } else {
            this._helpOption = null;
          }
          return this;
        }
        flags = flags ?? "-h, --help";
        description = description ?? "display help for command";
        this._helpOption = this.createOption(flags, description);
        return this;
      }
      /**
       * Lazy create help option.
       * Returns null if has been disabled with .helpOption(false).
       *
       * @returns {(Option | null)} the help option
       * @package
       */
      _getHelpOption() {
        if (this._helpOption === void 0) {
          this.helpOption(void 0, void 0);
        }
        return this._helpOption;
      }
      /**
       * Supply your own option to use for the built-in help option.
       * This is an alternative to using helpOption() to customise the flags and description etc.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addHelpOption(option) {
        this._helpOption = option;
        return this;
      }
      /**
       * Output help information and exit.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      help(contextOptions) {
        this.outputHelp(contextOptions);
        let exitCode = Number(process2.exitCode ?? 0);
        if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
          exitCode = 1;
        }
        this._exit(exitCode, "commander.help", "(outputHelp)");
      }
      /**
       * // Do a little typing to coordinate emit and listener for the help text events.
       * @typedef HelpTextEventContext
       * @type {object}
       * @property {boolean} error
       * @property {Command} command
       * @property {function} write
       */
      /**
       * Add additional text to be displayed with the built-in help.
       *
       * Position is 'before' or 'after' to affect just this command,
       * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
       *
       * @param {string} position - before or after built-in help
       * @param {(string | Function)} text - string to add, or a function returning a string
       * @return {Command} `this` command for chaining
       */
      addHelpText(position, text2) {
        const allowedValues = ["beforeAll", "before", "after", "afterAll"];
        if (!allowedValues.includes(position)) {
          throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        const helpEvent = `${position}Help`;
        this.on(helpEvent, (context) => {
          let helpStr;
          if (typeof text2 === "function") {
            helpStr = text2({ error: context.error, command: context.command });
          } else {
            helpStr = text2;
          }
          if (helpStr) {
            context.write(`${helpStr}
`);
          }
        });
        return this;
      }
      /**
       * Output help information if help flags specified
       *
       * @param {Array} args - array of options to search for help flags
       * @private
       */
      _outputHelpIfRequested(args) {
        const helpOption = this._getHelpOption();
        const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
        if (helpRequested) {
          this.outputHelp();
          this._exit(0, "commander.helpDisplayed", "(outputHelp)");
        }
      }
    };
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        if (!arg.startsWith("--inspect")) {
          return arg;
        }
        let debugOption;
        let debugHost = "127.0.0.1";
        let debugPort = "9229";
        let match;
        if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
          debugOption = match[1];
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
          debugOption = match[1];
          if (/^\d+$/.test(match[3])) {
            debugPort = match[3];
          } else {
            debugHost = match[3];
          }
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
          debugOption = match[1];
          debugHost = match[3];
          debugPort = match[4];
        }
        if (debugOption && debugPort !== "0") {
          return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
        }
        return arg;
      });
    }
    function useColor() {
      if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
        return false;
      if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== void 0)
        return true;
      return void 0;
    }
    exports.Command = Command2;
    exports.useColor = useColor;
  }
});

// node_modules/commander/index.js
var require_commander = __commonJS({
  "node_modules/commander/index.js"(exports) {
    var { Argument: Argument2 } = require_argument();
    var { Command: Command2 } = require_command();
    var { CommanderError: CommanderError2, InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2 } = require_option();
    exports.program = new Command2();
    exports.createCommand = (name2) => new Command2(name2);
    exports.createOption = (flags, description) => new Option2(flags, description);
    exports.createArgument = (name2, description) => new Argument2(name2, description);
    exports.Command = Command2;
    exports.Option = Option2;
    exports.Argument = Argument2;
    exports.Help = Help2;
    exports.CommanderError = CommanderError2;
    exports.InvalidArgumentError = InvalidArgumentError2;
    exports.InvalidOptionArgumentError = InvalidArgumentError2;
  }
});

// node_modules/sisteransi/src/index.js
var require_src = __commonJS({
  "node_modules/sisteransi/src/index.js"(exports, module) {
    "use strict";
    var ESC = "\x1B";
    var CSI = `${ESC}[`;
    var beep = "\x07";
    var cursor = {
      to(x2, y3) {
        if (!y3) return `${CSI}${x2 + 1}G`;
        return `${CSI}${y3 + 1};${x2 + 1}H`;
      },
      move(x2, y3) {
        let ret = "";
        if (x2 < 0) ret += `${CSI}${-x2}D`;
        else if (x2 > 0) ret += `${CSI}${x2}C`;
        if (y3 < 0) ret += `${CSI}${-y3}A`;
        else if (y3 > 0) ret += `${CSI}${y3}B`;
        return ret;
      },
      up: (count = 1) => `${CSI}${count}A`,
      down: (count = 1) => `${CSI}${count}B`,
      forward: (count = 1) => `${CSI}${count}C`,
      backward: (count = 1) => `${CSI}${count}D`,
      nextLine: (count = 1) => `${CSI}E`.repeat(count),
      prevLine: (count = 1) => `${CSI}F`.repeat(count),
      left: `${CSI}G`,
      hide: `${CSI}?25l`,
      show: `${CSI}?25h`,
      save: `${ESC}7`,
      restore: `${ESC}8`
    };
    var scroll = {
      up: (count = 1) => `${CSI}S`.repeat(count),
      down: (count = 1) => `${CSI}T`.repeat(count)
    };
    var erase = {
      screen: `${CSI}2J`,
      up: (count = 1) => `${CSI}1J`.repeat(count),
      down: (count = 1) => `${CSI}J`.repeat(count),
      line: `${CSI}2K`,
      lineEnd: `${CSI}K`,
      lineStart: `${CSI}1K`,
      lines(count) {
        let clear = "";
        for (let i = 0; i < count; i++)
          clear += this.line + (i < count - 1 ? cursor.up() : "");
        if (count)
          clear += cursor.left;
        return clear;
      }
    };
    module.exports = { cursor, scroll, erase, beep };
  }
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/picocolors/picocolors.js"(exports, module) {
    var p2 = process || {};
    var argv = p2.argv || [];
    var env2 = p2.env || {};
    var isColorSupported = !(!!env2.NO_COLOR || argv.includes("--no-color")) && (!!env2.FORCE_COLOR || argv.includes("--color") || p2.platform === "win32" || (p2.stdout || {}).isTTY && env2.TERM !== "dumb" || !!env2.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// node_modules/@clack/core/dist/index.mjs
import { stdin as j, stdout as M } from "node:process";
import * as g from "node:readline";
import O from "node:readline";
import { Writable as X } from "node:stream";
function DD({ onlyFirst: e2 = false } = {}) {
  const t = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");
  return new RegExp(t, e2 ? void 0 : "g");
}
function P(e2) {
  if (typeof e2 != "string") throw new TypeError(`Expected a \`string\`, got \`${typeof e2}\``);
  return e2.replace(uD, "");
}
function L(e2) {
  return e2 && e2.__esModule && Object.prototype.hasOwnProperty.call(e2, "default") ? e2.default : e2;
}
function p(e2, u2 = {}) {
  if (typeof e2 != "string" || e2.length === 0 || (u2 = { ambiguousIsNarrow: true, ...u2 }, e2 = P(e2), e2.length === 0)) return 0;
  e2 = e2.replace(sD(), "  ");
  const t = u2.ambiguousIsNarrow ? 1 : 2;
  let F2 = 0;
  for (const s of e2) {
    const i = s.codePointAt(0);
    if (i <= 31 || i >= 127 && i <= 159 || i >= 768 && i <= 879) continue;
    switch (eD.eastAsianWidth(s)) {
      case "F":
      case "W":
        F2 += 2;
        break;
      case "A":
        F2 += t;
        break;
      default:
        F2 += 1;
    }
  }
  return F2;
}
function rD() {
  const e2 = /* @__PURE__ */ new Map();
  for (const [u2, t] of Object.entries(r)) {
    for (const [F2, s] of Object.entries(t)) r[F2] = { open: `\x1B[${s[0]}m`, close: `\x1B[${s[1]}m` }, t[F2] = r[F2], e2.set(s[0], s[1]);
    Object.defineProperty(r, u2, { value: t, enumerable: false });
  }
  return Object.defineProperty(r, "codes", { value: e2, enumerable: false }), r.color.close = "\x1B[39m", r.bgColor.close = "\x1B[49m", r.color.ansi = N(), r.color.ansi256 = I(), r.color.ansi16m = R(), r.bgColor.ansi = N(w), r.bgColor.ansi256 = I(w), r.bgColor.ansi16m = R(w), Object.defineProperties(r, { rgbToAnsi256: { value: (u2, t, F2) => u2 === t && t === F2 ? u2 < 8 ? 16 : u2 > 248 ? 231 : Math.round((u2 - 8) / 247 * 24) + 232 : 16 + 36 * Math.round(u2 / 255 * 5) + 6 * Math.round(t / 255 * 5) + Math.round(F2 / 255 * 5), enumerable: false }, hexToRgb: { value: (u2) => {
    const t = /[a-f\d]{6}|[a-f\d]{3}/i.exec(u2.toString(16));
    if (!t) return [0, 0, 0];
    let [F2] = t;
    F2.length === 3 && (F2 = [...F2].map((i) => i + i).join(""));
    const s = Number.parseInt(F2, 16);
    return [s >> 16 & 255, s >> 8 & 255, s & 255];
  }, enumerable: false }, hexToAnsi256: { value: (u2) => r.rgbToAnsi256(...r.hexToRgb(u2)), enumerable: false }, ansi256ToAnsi: { value: (u2) => {
    if (u2 < 8) return 30 + u2;
    if (u2 < 16) return 90 + (u2 - 8);
    let t, F2, s;
    if (u2 >= 232) t = ((u2 - 232) * 10 + 8) / 255, F2 = t, s = t;
    else {
      u2 -= 16;
      const C2 = u2 % 36;
      t = Math.floor(u2 / 36) / 5, F2 = Math.floor(C2 / 6) / 5, s = C2 % 6 / 5;
    }
    const i = Math.max(t, F2, s) * 2;
    if (i === 0) return 30;
    let D2 = 30 + (Math.round(s) << 2 | Math.round(F2) << 1 | Math.round(t));
    return i === 2 && (D2 += 60), D2;
  }, enumerable: false }, rgbToAnsi: { value: (u2, t, F2) => r.ansi256ToAnsi(r.rgbToAnsi256(u2, t, F2)), enumerable: false }, hexToAnsi: { value: (u2) => r.ansi256ToAnsi(r.hexToAnsi256(u2)), enumerable: false } }), r;
}
function Y(e2, u2, t) {
  return String(e2).normalize().replace(/\r\n/g, `
`).split(`
`).map((F2) => lD(F2, u2, t)).join(`
`);
}
function $(e2, u2) {
  if (typeof e2 == "string") return B.aliases.get(e2) === u2;
  for (const t of e2) if (t !== void 0 && $(t, u2)) return true;
  return false;
}
function BD(e2, u2) {
  if (e2 === u2) return;
  const t = e2.split(`
`), F2 = u2.split(`
`), s = [];
  for (let i = 0; i < Math.max(t.length, F2.length); i++) t[i] !== F2[i] && s.push(i);
  return s;
}
function pD(e2) {
  return e2 === S;
}
function m(e2, u2) {
  const t = e2;
  t.isTTY && t.setRawMode(u2);
}
function fD({ input: e2 = j, output: u2 = M, overwrite: t = true, hideCursor: F2 = true } = {}) {
  const s = g.createInterface({ input: e2, output: u2, prompt: "", tabSize: 1 });
  g.emitKeypressEvents(e2, s), e2.isTTY && e2.setRawMode(true);
  const i = (D2, { name: C2, sequence: n }) => {
    const E = String(D2);
    if ($([E, C2, n], "cancel")) {
      F2 && u2.write(import_sisteransi.cursor.show), process.exit(0);
      return;
    }
    if (!t) return;
    const a = C2 === "return" ? 0 : -1, o2 = C2 === "return" ? -1 : 0;
    g.moveCursor(u2, a, o2, () => {
      g.clearLine(u2, 1, () => {
        e2.once("keypress", i);
      });
    });
  };
  return F2 && u2.write(import_sisteransi.cursor.hide), e2.once("keypress", i), () => {
    e2.off("keypress", i), F2 && u2.write(import_sisteransi.cursor.show), e2.isTTY && !AD && e2.setRawMode(false), s.terminal = false, s.close();
  };
}
var import_sisteransi, import_picocolors, uD, W, tD, eD, FD, sD, w, N, I, R, r, iD, CD, ED, d, oD, y, V, nD, G, _, z, K, aD, k, hD, lD, xD, B, AD, S, gD, vD, h, x, dD, mD, bD, Z, q, T, wD, yD, A, _D, TD, jD, U, MD, OD, PD, J, LD, RD;
var init_dist = __esm({
  "node_modules/@clack/core/dist/index.mjs"() {
    import_sisteransi = __toESM(require_src(), 1);
    import_picocolors = __toESM(require_picocolors(), 1);
    uD = DD();
    W = { exports: {} };
    (function(e2) {
      var u2 = {};
      e2.exports = u2, u2.eastAsianWidth = function(F2) {
        var s = F2.charCodeAt(0), i = F2.length == 2 ? F2.charCodeAt(1) : 0, D2 = s;
        return 55296 <= s && s <= 56319 && 56320 <= i && i <= 57343 && (s &= 1023, i &= 1023, D2 = s << 10 | i, D2 += 65536), D2 == 12288 || 65281 <= D2 && D2 <= 65376 || 65504 <= D2 && D2 <= 65510 ? "F" : D2 == 8361 || 65377 <= D2 && D2 <= 65470 || 65474 <= D2 && D2 <= 65479 || 65482 <= D2 && D2 <= 65487 || 65490 <= D2 && D2 <= 65495 || 65498 <= D2 && D2 <= 65500 || 65512 <= D2 && D2 <= 65518 ? "H" : 4352 <= D2 && D2 <= 4447 || 4515 <= D2 && D2 <= 4519 || 4602 <= D2 && D2 <= 4607 || 9001 <= D2 && D2 <= 9002 || 11904 <= D2 && D2 <= 11929 || 11931 <= D2 && D2 <= 12019 || 12032 <= D2 && D2 <= 12245 || 12272 <= D2 && D2 <= 12283 || 12289 <= D2 && D2 <= 12350 || 12353 <= D2 && D2 <= 12438 || 12441 <= D2 && D2 <= 12543 || 12549 <= D2 && D2 <= 12589 || 12593 <= D2 && D2 <= 12686 || 12688 <= D2 && D2 <= 12730 || 12736 <= D2 && D2 <= 12771 || 12784 <= D2 && D2 <= 12830 || 12832 <= D2 && D2 <= 12871 || 12880 <= D2 && D2 <= 13054 || 13056 <= D2 && D2 <= 19903 || 19968 <= D2 && D2 <= 42124 || 42128 <= D2 && D2 <= 42182 || 43360 <= D2 && D2 <= 43388 || 44032 <= D2 && D2 <= 55203 || 55216 <= D2 && D2 <= 55238 || 55243 <= D2 && D2 <= 55291 || 63744 <= D2 && D2 <= 64255 || 65040 <= D2 && D2 <= 65049 || 65072 <= D2 && D2 <= 65106 || 65108 <= D2 && D2 <= 65126 || 65128 <= D2 && D2 <= 65131 || 110592 <= D2 && D2 <= 110593 || 127488 <= D2 && D2 <= 127490 || 127504 <= D2 && D2 <= 127546 || 127552 <= D2 && D2 <= 127560 || 127568 <= D2 && D2 <= 127569 || 131072 <= D2 && D2 <= 194367 || 177984 <= D2 && D2 <= 196605 || 196608 <= D2 && D2 <= 262141 ? "W" : 32 <= D2 && D2 <= 126 || 162 <= D2 && D2 <= 163 || 165 <= D2 && D2 <= 166 || D2 == 172 || D2 == 175 || 10214 <= D2 && D2 <= 10221 || 10629 <= D2 && D2 <= 10630 ? "Na" : D2 == 161 || D2 == 164 || 167 <= D2 && D2 <= 168 || D2 == 170 || 173 <= D2 && D2 <= 174 || 176 <= D2 && D2 <= 180 || 182 <= D2 && D2 <= 186 || 188 <= D2 && D2 <= 191 || D2 == 198 || D2 == 208 || 215 <= D2 && D2 <= 216 || 222 <= D2 && D2 <= 225 || D2 == 230 || 232 <= D2 && D2 <= 234 || 236 <= D2 && D2 <= 237 || D2 == 240 || 242 <= D2 && D2 <= 243 || 247 <= D2 && D2 <= 250 || D2 == 252 || D2 == 254 || D2 == 257 || D2 == 273 || D2 == 275 || D2 == 283 || 294 <= D2 && D2 <= 295 || D2 == 299 || 305 <= D2 && D2 <= 307 || D2 == 312 || 319 <= D2 && D2 <= 322 || D2 == 324 || 328 <= D2 && D2 <= 331 || D2 == 333 || 338 <= D2 && D2 <= 339 || 358 <= D2 && D2 <= 359 || D2 == 363 || D2 == 462 || D2 == 464 || D2 == 466 || D2 == 468 || D2 == 470 || D2 == 472 || D2 == 474 || D2 == 476 || D2 == 593 || D2 == 609 || D2 == 708 || D2 == 711 || 713 <= D2 && D2 <= 715 || D2 == 717 || D2 == 720 || 728 <= D2 && D2 <= 731 || D2 == 733 || D2 == 735 || 768 <= D2 && D2 <= 879 || 913 <= D2 && D2 <= 929 || 931 <= D2 && D2 <= 937 || 945 <= D2 && D2 <= 961 || 963 <= D2 && D2 <= 969 || D2 == 1025 || 1040 <= D2 && D2 <= 1103 || D2 == 1105 || D2 == 8208 || 8211 <= D2 && D2 <= 8214 || 8216 <= D2 && D2 <= 8217 || 8220 <= D2 && D2 <= 8221 || 8224 <= D2 && D2 <= 8226 || 8228 <= D2 && D2 <= 8231 || D2 == 8240 || 8242 <= D2 && D2 <= 8243 || D2 == 8245 || D2 == 8251 || D2 == 8254 || D2 == 8308 || D2 == 8319 || 8321 <= D2 && D2 <= 8324 || D2 == 8364 || D2 == 8451 || D2 == 8453 || D2 == 8457 || D2 == 8467 || D2 == 8470 || 8481 <= D2 && D2 <= 8482 || D2 == 8486 || D2 == 8491 || 8531 <= D2 && D2 <= 8532 || 8539 <= D2 && D2 <= 8542 || 8544 <= D2 && D2 <= 8555 || 8560 <= D2 && D2 <= 8569 || D2 == 8585 || 8592 <= D2 && D2 <= 8601 || 8632 <= D2 && D2 <= 8633 || D2 == 8658 || D2 == 8660 || D2 == 8679 || D2 == 8704 || 8706 <= D2 && D2 <= 8707 || 8711 <= D2 && D2 <= 8712 || D2 == 8715 || D2 == 8719 || D2 == 8721 || D2 == 8725 || D2 == 8730 || 8733 <= D2 && D2 <= 8736 || D2 == 8739 || D2 == 8741 || 8743 <= D2 && D2 <= 8748 || D2 == 8750 || 8756 <= D2 && D2 <= 8759 || 8764 <= D2 && D2 <= 8765 || D2 == 8776 || D2 == 8780 || D2 == 8786 || 8800 <= D2 && D2 <= 8801 || 8804 <= D2 && D2 <= 8807 || 8810 <= D2 && D2 <= 8811 || 8814 <= D2 && D2 <= 8815 || 8834 <= D2 && D2 <= 8835 || 8838 <= D2 && D2 <= 8839 || D2 == 8853 || D2 == 8857 || D2 == 8869 || D2 == 8895 || D2 == 8978 || 9312 <= D2 && D2 <= 9449 || 9451 <= D2 && D2 <= 9547 || 9552 <= D2 && D2 <= 9587 || 9600 <= D2 && D2 <= 9615 || 9618 <= D2 && D2 <= 9621 || 9632 <= D2 && D2 <= 9633 || 9635 <= D2 && D2 <= 9641 || 9650 <= D2 && D2 <= 9651 || 9654 <= D2 && D2 <= 9655 || 9660 <= D2 && D2 <= 9661 || 9664 <= D2 && D2 <= 9665 || 9670 <= D2 && D2 <= 9672 || D2 == 9675 || 9678 <= D2 && D2 <= 9681 || 9698 <= D2 && D2 <= 9701 || D2 == 9711 || 9733 <= D2 && D2 <= 9734 || D2 == 9737 || 9742 <= D2 && D2 <= 9743 || 9748 <= D2 && D2 <= 9749 || D2 == 9756 || D2 == 9758 || D2 == 9792 || D2 == 9794 || 9824 <= D2 && D2 <= 9825 || 9827 <= D2 && D2 <= 9829 || 9831 <= D2 && D2 <= 9834 || 9836 <= D2 && D2 <= 9837 || D2 == 9839 || 9886 <= D2 && D2 <= 9887 || 9918 <= D2 && D2 <= 9919 || 9924 <= D2 && D2 <= 9933 || 9935 <= D2 && D2 <= 9953 || D2 == 9955 || 9960 <= D2 && D2 <= 9983 || D2 == 10045 || D2 == 10071 || 10102 <= D2 && D2 <= 10111 || 11093 <= D2 && D2 <= 11097 || 12872 <= D2 && D2 <= 12879 || 57344 <= D2 && D2 <= 63743 || 65024 <= D2 && D2 <= 65039 || D2 == 65533 || 127232 <= D2 && D2 <= 127242 || 127248 <= D2 && D2 <= 127277 || 127280 <= D2 && D2 <= 127337 || 127344 <= D2 && D2 <= 127386 || 917760 <= D2 && D2 <= 917999 || 983040 <= D2 && D2 <= 1048573 || 1048576 <= D2 && D2 <= 1114109 ? "A" : "N";
      }, u2.characterLength = function(F2) {
        var s = this.eastAsianWidth(F2);
        return s == "F" || s == "W" || s == "A" ? 2 : 1;
      };
      function t(F2) {
        return F2.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
      }
      u2.length = function(F2) {
        for (var s = t(F2), i = 0, D2 = 0; D2 < s.length; D2++) i = i + this.characterLength(s[D2]);
        return i;
      }, u2.slice = function(F2, s, i) {
        textLen = u2.length(F2), s = s || 0, i = i || 1, s < 0 && (s = textLen + s), i < 0 && (i = textLen + i);
        for (var D2 = "", C2 = 0, n = t(F2), E = 0; E < n.length; E++) {
          var a = n[E], o2 = u2.length(a);
          if (C2 >= s - (o2 == 2 ? 1 : 0)) if (C2 + o2 <= i) D2 += a;
          else break;
          C2 += o2;
        }
        return D2;
      };
    })(W);
    tD = W.exports;
    eD = L(tD);
    FD = function() {
      return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
    };
    sD = L(FD);
    w = 10;
    N = (e2 = 0) => (u2) => `\x1B[${u2 + e2}m`;
    I = (e2 = 0) => (u2) => `\x1B[${38 + e2};5;${u2}m`;
    R = (e2 = 0) => (u2, t, F2) => `\x1B[${38 + e2};2;${u2};${t};${F2}m`;
    r = { modifier: { reset: [0, 0], bold: [1, 22], dim: [2, 22], italic: [3, 23], underline: [4, 24], overline: [53, 55], inverse: [7, 27], hidden: [8, 28], strikethrough: [9, 29] }, color: { black: [30, 39], red: [31, 39], green: [32, 39], yellow: [33, 39], blue: [34, 39], magenta: [35, 39], cyan: [36, 39], white: [37, 39], blackBright: [90, 39], gray: [90, 39], grey: [90, 39], redBright: [91, 39], greenBright: [92, 39], yellowBright: [93, 39], blueBright: [94, 39], magentaBright: [95, 39], cyanBright: [96, 39], whiteBright: [97, 39] }, bgColor: { bgBlack: [40, 49], bgRed: [41, 49], bgGreen: [42, 49], bgYellow: [43, 49], bgBlue: [44, 49], bgMagenta: [45, 49], bgCyan: [46, 49], bgWhite: [47, 49], bgBlackBright: [100, 49], bgGray: [100, 49], bgGrey: [100, 49], bgRedBright: [101, 49], bgGreenBright: [102, 49], bgYellowBright: [103, 49], bgBlueBright: [104, 49], bgMagentaBright: [105, 49], bgCyanBright: [106, 49], bgWhiteBright: [107, 49] } };
    Object.keys(r.modifier);
    iD = Object.keys(r.color);
    CD = Object.keys(r.bgColor);
    [...iD, ...CD];
    ED = rD();
    d = /* @__PURE__ */ new Set(["\x1B", "\x9B"]);
    oD = 39;
    y = "\x07";
    V = "[";
    nD = "]";
    G = "m";
    _ = `${nD}8;;`;
    z = (e2) => `${d.values().next().value}${V}${e2}${G}`;
    K = (e2) => `${d.values().next().value}${_}${e2}${y}`;
    aD = (e2) => e2.split(" ").map((u2) => p(u2));
    k = (e2, u2, t) => {
      const F2 = [...u2];
      let s = false, i = false, D2 = p(P(e2[e2.length - 1]));
      for (const [C2, n] of F2.entries()) {
        const E = p(n);
        if (D2 + E <= t ? e2[e2.length - 1] += n : (e2.push(n), D2 = 0), d.has(n) && (s = true, i = F2.slice(C2 + 1).join("").startsWith(_)), s) {
          i ? n === y && (s = false, i = false) : n === G && (s = false);
          continue;
        }
        D2 += E, D2 === t && C2 < F2.length - 1 && (e2.push(""), D2 = 0);
      }
      !D2 && e2[e2.length - 1].length > 0 && e2.length > 1 && (e2[e2.length - 2] += e2.pop());
    };
    hD = (e2) => {
      const u2 = e2.split(" ");
      let t = u2.length;
      for (; t > 0 && !(p(u2[t - 1]) > 0); ) t--;
      return t === u2.length ? e2 : u2.slice(0, t).join(" ") + u2.slice(t).join("");
    };
    lD = (e2, u2, t = {}) => {
      if (t.trim !== false && e2.trim() === "") return "";
      let F2 = "", s, i;
      const D2 = aD(e2);
      let C2 = [""];
      for (const [E, a] of e2.split(" ").entries()) {
        t.trim !== false && (C2[C2.length - 1] = C2[C2.length - 1].trimStart());
        let o2 = p(C2[C2.length - 1]);
        if (E !== 0 && (o2 >= u2 && (t.wordWrap === false || t.trim === false) && (C2.push(""), o2 = 0), (o2 > 0 || t.trim === false) && (C2[C2.length - 1] += " ", o2++)), t.hard && D2[E] > u2) {
          const c = u2 - o2, f = 1 + Math.floor((D2[E] - c - 1) / u2);
          Math.floor((D2[E] - 1) / u2) < f && C2.push(""), k(C2, a, u2);
          continue;
        }
        if (o2 + D2[E] > u2 && o2 > 0 && D2[E] > 0) {
          if (t.wordWrap === false && o2 < u2) {
            k(C2, a, u2);
            continue;
          }
          C2.push("");
        }
        if (o2 + D2[E] > u2 && t.wordWrap === false) {
          k(C2, a, u2);
          continue;
        }
        C2[C2.length - 1] += a;
      }
      t.trim !== false && (C2 = C2.map((E) => hD(E)));
      const n = [...C2.join(`
`)];
      for (const [E, a] of n.entries()) {
        if (F2 += a, d.has(a)) {
          const { groups: c } = new RegExp(`(?:\\${V}(?<code>\\d+)m|\\${_}(?<uri>.*)${y})`).exec(n.slice(E).join("")) || { groups: {} };
          if (c.code !== void 0) {
            const f = Number.parseFloat(c.code);
            s = f === oD ? void 0 : f;
          } else c.uri !== void 0 && (i = c.uri.length === 0 ? void 0 : c.uri);
        }
        const o2 = ED.codes.get(Number(s));
        n[E + 1] === `
` ? (i && (F2 += K("")), s && o2 && (F2 += z(o2))) : a === `
` && (s && o2 && (F2 += z(s)), i && (F2 += K(i)));
      }
      return F2;
    };
    xD = ["up", "down", "left", "right", "space", "enter", "cancel"];
    B = { actions: new Set(xD), aliases: /* @__PURE__ */ new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"], ["", "cancel"], ["escape", "cancel"]]) };
    AD = globalThis.process.platform.startsWith("win");
    S = Symbol("clack:cancel");
    gD = Object.defineProperty;
    vD = (e2, u2, t) => u2 in e2 ? gD(e2, u2, { enumerable: true, configurable: true, writable: true, value: t }) : e2[u2] = t;
    h = (e2, u2, t) => (vD(e2, typeof u2 != "symbol" ? u2 + "" : u2, t), t);
    x = class {
      constructor(u2, t = true) {
        h(this, "input"), h(this, "output"), h(this, "_abortSignal"), h(this, "rl"), h(this, "opts"), h(this, "_render"), h(this, "_track", false), h(this, "_prevFrame", ""), h(this, "_subscribers", /* @__PURE__ */ new Map()), h(this, "_cursor", 0), h(this, "state", "initial"), h(this, "error", ""), h(this, "value");
        const { input: F2 = j, output: s = M, render: i, signal: D2, ...C2 } = u2;
        this.opts = C2, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = i.bind(this), this._track = t, this._abortSignal = D2, this.input = F2, this.output = s;
      }
      unsubscribe() {
        this._subscribers.clear();
      }
      setSubscriber(u2, t) {
        const F2 = this._subscribers.get(u2) ?? [];
        F2.push(t), this._subscribers.set(u2, F2);
      }
      on(u2, t) {
        this.setSubscriber(u2, { cb: t });
      }
      once(u2, t) {
        this.setSubscriber(u2, { cb: t, once: true });
      }
      emit(u2, ...t) {
        const F2 = this._subscribers.get(u2) ?? [], s = [];
        for (const i of F2) i.cb(...t), i.once && s.push(() => F2.splice(F2.indexOf(i), 1));
        for (const i of s) i();
      }
      prompt() {
        return new Promise((u2, t) => {
          if (this._abortSignal) {
            if (this._abortSignal.aborted) return this.state = "cancel", this.close(), u2(S);
            this._abortSignal.addEventListener("abort", () => {
              this.state = "cancel", this.close();
            }, { once: true });
          }
          const F2 = new X();
          F2._write = (s, i, D2) => {
            this._track && (this.value = this.rl?.line.replace(/\t/g, ""), this._cursor = this.rl?.cursor ?? 0, this.emit("value", this.value)), D2();
          }, this.input.pipe(F2), this.rl = O.createInterface({ input: this.input, output: F2, tabSize: 2, prompt: "", escapeCodeTimeout: 50, terminal: true }), O.emitKeypressEvents(this.input, this.rl), this.rl.prompt(), this.opts.initialValue !== void 0 && this._track && this.rl.write(this.opts.initialValue), this.input.on("keypress", this.onKeypress), m(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
            this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), m(this.input, false), u2(this.value);
          }), this.once("cancel", () => {
            this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), m(this.input, false), u2(S);
          });
        });
      }
      onKeypress(u2, t) {
        if (this.state === "error" && (this.state = "active"), t?.name && (!this._track && B.aliases.has(t.name) && this.emit("cursor", B.aliases.get(t.name)), B.actions.has(t.name) && this.emit("cursor", t.name)), u2 && (u2.toLowerCase() === "y" || u2.toLowerCase() === "n") && this.emit("confirm", u2.toLowerCase() === "y"), u2 === "	" && this.opts.placeholder && (this.value || (this.rl?.write(this.opts.placeholder), this.emit("value", this.opts.placeholder))), u2 && this.emit("key", u2.toLowerCase()), t?.name === "return") {
          if (this.opts.validate) {
            const F2 = this.opts.validate(this.value);
            F2 && (this.error = F2 instanceof Error ? F2.message : F2, this.state = "error", this.rl?.write(this.value));
          }
          this.state !== "error" && (this.state = "submit");
        }
        $([u2, t?.name, t?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
      }
      close() {
        this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), m(this.input, false), this.rl?.close(), this.rl = void 0, this.emit(`${this.state}`, this.value), this.unsubscribe();
      }
      restoreCursor() {
        const u2 = Y(this._prevFrame, process.stdout.columns, { hard: true }).split(`
`).length - 1;
        this.output.write(import_sisteransi.cursor.move(-999, u2 * -1));
      }
      render() {
        const u2 = Y(this._render(this) ?? "", process.stdout.columns, { hard: true });
        if (u2 !== this._prevFrame) {
          if (this.state === "initial") this.output.write(import_sisteransi.cursor.hide);
          else {
            const t = BD(this._prevFrame, u2);
            if (this.restoreCursor(), t && t?.length === 1) {
              const F2 = t[0];
              this.output.write(import_sisteransi.cursor.move(0, F2)), this.output.write(import_sisteransi.erase.lines(1));
              const s = u2.split(`
`);
              this.output.write(s[F2]), this._prevFrame = u2, this.output.write(import_sisteransi.cursor.move(0, s.length - F2 - 1));
              return;
            }
            if (t && t?.length > 1) {
              const F2 = t[0];
              this.output.write(import_sisteransi.cursor.move(0, F2)), this.output.write(import_sisteransi.erase.down());
              const s = u2.split(`
`).slice(F2);
              this.output.write(s.join(`
`)), this._prevFrame = u2;
              return;
            }
            this.output.write(import_sisteransi.erase.down());
          }
          this.output.write(u2), this.state === "initial" && (this.state = "active"), this._prevFrame = u2;
        }
      }
    };
    dD = class extends x {
      get cursor() {
        return this.value ? 0 : 1;
      }
      get _value() {
        return this.cursor === 0;
      }
      constructor(u2) {
        super(u2, false), this.value = !!u2.initialValue, this.on("value", () => {
          this.value = this._value;
        }), this.on("confirm", (t) => {
          this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = t, this.state = "submit", this.close();
        }), this.on("cursor", () => {
          this.value = !this.value;
        });
      }
    };
    mD = Object.defineProperty;
    bD = (e2, u2, t) => u2 in e2 ? mD(e2, u2, { enumerable: true, configurable: true, writable: true, value: t }) : e2[u2] = t;
    Z = (e2, u2, t) => (bD(e2, typeof u2 != "symbol" ? u2 + "" : u2, t), t);
    q = (e2, u2, t) => {
      if (!u2.has(e2)) throw TypeError("Cannot " + t);
    };
    T = (e2, u2, t) => (q(e2, u2, "read from private field"), t ? t.call(e2) : u2.get(e2));
    wD = (e2, u2, t) => {
      if (u2.has(e2)) throw TypeError("Cannot add the same private member more than once");
      u2 instanceof WeakSet ? u2.add(e2) : u2.set(e2, t);
    };
    yD = (e2, u2, t, F2) => (q(e2, u2, "write to private field"), F2 ? F2.call(e2, t) : u2.set(e2, t), t);
    _D = class extends x {
      constructor(u2) {
        super(u2, false), Z(this, "options"), Z(this, "cursor", 0), wD(this, A, void 0);
        const { options: t } = u2;
        yD(this, A, u2.selectableGroups !== false), this.options = Object.entries(t).flatMap(([F2, s]) => [{ value: F2, group: true, label: F2 }, ...s.map((i) => ({ ...i, group: F2 }))]), this.value = [...u2.initialValues ?? []], this.cursor = Math.max(this.options.findIndex(({ value: F2 }) => F2 === u2.cursorAt), T(this, A) ? 0 : 1), this.on("cursor", (F2) => {
          switch (F2) {
            case "left":
            case "up": {
              this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
              const s = this.options[this.cursor]?.group === true;
              !T(this, A) && s && (this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1);
              break;
            }
            case "down":
            case "right": {
              this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
              const s = this.options[this.cursor]?.group === true;
              !T(this, A) && s && (this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1);
              break;
            }
            case "space":
              this.toggleValue();
              break;
          }
        });
      }
      getGroupItems(u2) {
        return this.options.filter((t) => t.group === u2);
      }
      isGroupSelected(u2) {
        return this.getGroupItems(u2).every((t) => this.value.includes(t.value));
      }
      toggleValue() {
        const u2 = this.options[this.cursor];
        if (u2.group === true) {
          const t = u2.value, F2 = this.getGroupItems(t);
          this.isGroupSelected(t) ? this.value = this.value.filter((s) => F2.findIndex((i) => i.value === s) === -1) : this.value = [...this.value, ...F2.map((s) => s.value)], this.value = Array.from(new Set(this.value));
        } else {
          const t = this.value.includes(u2.value);
          this.value = t ? this.value.filter((F2) => F2 !== u2.value) : [...this.value, u2.value];
        }
      }
    };
    A = /* @__PURE__ */ new WeakMap();
    TD = Object.defineProperty;
    jD = (e2, u2, t) => u2 in e2 ? TD(e2, u2, { enumerable: true, configurable: true, writable: true, value: t }) : e2[u2] = t;
    U = (e2, u2, t) => (jD(e2, typeof u2 != "symbol" ? u2 + "" : u2, t), t);
    MD = class extends x {
      constructor({ mask: u2, ...t }) {
        super(t), U(this, "valueWithCursor", ""), U(this, "_mask", "\u2022"), this._mask = u2 ?? "\u2022", this.on("finalize", () => {
          this.valueWithCursor = this.masked;
        }), this.on("value", () => {
          if (this.cursor >= this.value.length) this.valueWithCursor = `${this.masked}${import_picocolors.default.inverse(import_picocolors.default.hidden("_"))}`;
          else {
            const F2 = this.masked.slice(0, this.cursor), s = this.masked.slice(this.cursor);
            this.valueWithCursor = `${F2}${import_picocolors.default.inverse(s[0])}${s.slice(1)}`;
          }
        });
      }
      get cursor() {
        return this._cursor;
      }
      get masked() {
        return this.value.replaceAll(/./g, this._mask);
      }
    };
    OD = Object.defineProperty;
    PD = (e2, u2, t) => u2 in e2 ? OD(e2, u2, { enumerable: true, configurable: true, writable: true, value: t }) : e2[u2] = t;
    J = (e2, u2, t) => (PD(e2, typeof u2 != "symbol" ? u2 + "" : u2, t), t);
    LD = class extends x {
      constructor(u2) {
        super(u2, false), J(this, "options"), J(this, "cursor", 0), this.options = u2.options, this.cursor = this.options.findIndex(({ value: t }) => t === u2.initialValue), this.cursor === -1 && (this.cursor = 0), this.changeValue(), this.on("cursor", (t) => {
          switch (t) {
            case "left":
            case "up":
              this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
              break;
            case "down":
            case "right":
              this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
              break;
          }
          this.changeValue();
        });
      }
      get _value() {
        return this.options[this.cursor];
      }
      changeValue() {
        this.value = this._value.value;
      }
    };
    RD = class extends x {
      get valueWithCursor() {
        if (this.state === "submit") return this.value;
        if (this.cursor >= this.value.length) return `${this.value}\u2588`;
        const u2 = this.value.slice(0, this.cursor), [t, ...F2] = this.value.slice(this.cursor);
        return `${u2}${import_picocolors.default.inverse(t)}${F2.join("")}`;
      }
      get cursor() {
        return this._cursor;
      }
      constructor(u2) {
        super(u2), this.on("finalize", () => {
          this.value || (this.value = u2.defaultValue);
        });
      }
    };
  }
});

// node_modules/@clack/prompts/dist/index.mjs
import { stripVTControlCharacters as S2 } from "node:util";
import y2 from "node:process";
function ce() {
  return y2.platform !== "win32" ? y2.env.TERM !== "linux" : !!y2.env.CI || !!y2.env.WT_SESSION || !!y2.env.TERMINUS_SUBLIME || y2.env.ConEmuTask === "{cmd::Cmder}" || y2.env.TERM_PROGRAM === "Terminus-Sublime" || y2.env.TERM_PROGRAM === "vscode" || y2.env.TERM === "xterm-256color" || y2.env.TERM === "alacritty" || y2.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var import_picocolors2, import_sisteransi2, V2, u, le, L2, W2, C, ue, o, d2, k2, P2, A2, T2, F, $e, _2, me, de, pe, q2, D, U2, K2, b2, G2, he, ge, ye, ve, be, Me, xe, Ie, Se, M2, J2, Y2;
var init_dist2 = __esm({
  "node_modules/@clack/prompts/dist/index.mjs"() {
    init_dist();
    init_dist();
    import_picocolors2 = __toESM(require_picocolors(), 1);
    import_sisteransi2 = __toESM(require_src(), 1);
    V2 = ce();
    u = (t, n) => V2 ? t : n;
    le = u("\u25C6", "*");
    L2 = u("\u25A0", "x");
    W2 = u("\u25B2", "x");
    C = u("\u25C7", "o");
    ue = u("\u250C", "T");
    o = u("\u2502", "|");
    d2 = u("\u2514", "\u2014");
    k2 = u("\u25CF", ">");
    P2 = u("\u25CB", " ");
    A2 = u("\u25FB", "[\u2022]");
    T2 = u("\u25FC", "[+]");
    F = u("\u25FB", "[ ]");
    $e = u("\u25AA", "\u2022");
    _2 = u("\u2500", "-");
    me = u("\u256E", "+");
    de = u("\u251C", "+");
    pe = u("\u256F", "+");
    q2 = u("\u25CF", "\u2022");
    D = u("\u25C6", "*");
    U2 = u("\u25B2", "!");
    K2 = u("\u25A0", "x");
    b2 = (t) => {
      switch (t) {
        case "initial":
        case "active":
          return import_picocolors2.default.cyan(le);
        case "cancel":
          return import_picocolors2.default.red(L2);
        case "error":
          return import_picocolors2.default.yellow(W2);
        case "submit":
          return import_picocolors2.default.green(C);
      }
    };
    G2 = (t) => {
      const { cursor: n, options: r2, style: i } = t, s = t.maxItems ?? Number.POSITIVE_INFINITY, c = Math.max(process.stdout.rows - 4, 0), a = Math.min(c, Math.max(s, 5));
      let l2 = 0;
      n >= l2 + a - 3 ? l2 = Math.max(Math.min(n - a + 3, r2.length - a), 0) : n < l2 + 2 && (l2 = Math.max(n - 2, 0));
      const $2 = a < r2.length && l2 > 0, g2 = a < r2.length && l2 + a < r2.length;
      return r2.slice(l2, l2 + a).map((p2, v2, f) => {
        const j2 = v2 === 0 && $2, E = v2 === f.length - 1 && g2;
        return j2 || E ? import_picocolors2.default.dim("...") : i(p2, v2 + l2 === n);
      });
    };
    he = (t) => new RD({ validate: t.validate, placeholder: t.placeholder, defaultValue: t.defaultValue, initialValue: t.initialValue, render() {
      const n = `${import_picocolors2.default.gray(o)}
${b2(this.state)}  ${t.message}
`, r2 = t.placeholder ? import_picocolors2.default.inverse(t.placeholder[0]) + import_picocolors2.default.dim(t.placeholder.slice(1)) : import_picocolors2.default.inverse(import_picocolors2.default.hidden("_")), i = this.value ? this.valueWithCursor : r2;
      switch (this.state) {
        case "error":
          return `${n.trim()}
${import_picocolors2.default.yellow(o)}  ${i}
${import_picocolors2.default.yellow(d2)}  ${import_picocolors2.default.yellow(this.error)}
`;
        case "submit":
          return `${n}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.dim(this.value || t.placeholder)}`;
        case "cancel":
          return `${n}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(this.value ?? ""))}${this.value?.trim() ? `
${import_picocolors2.default.gray(o)}` : ""}`;
        default:
          return `${n}${import_picocolors2.default.cyan(o)}  ${i}
${import_picocolors2.default.cyan(d2)}
`;
      }
    } }).prompt();
    ge = (t) => new MD({ validate: t.validate, mask: t.mask ?? $e, render() {
      const n = `${import_picocolors2.default.gray(o)}
${b2(this.state)}  ${t.message}
`, r2 = this.valueWithCursor, i = this.masked;
      switch (this.state) {
        case "error":
          return `${n.trim()}
${import_picocolors2.default.yellow(o)}  ${i}
${import_picocolors2.default.yellow(d2)}  ${import_picocolors2.default.yellow(this.error)}
`;
        case "submit":
          return `${n}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.dim(i)}`;
        case "cancel":
          return `${n}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(i ?? ""))}${i ? `
${import_picocolors2.default.gray(o)}` : ""}`;
        default:
          return `${n}${import_picocolors2.default.cyan(o)}  ${r2}
${import_picocolors2.default.cyan(d2)}
`;
      }
    } }).prompt();
    ye = (t) => {
      const n = t.active ?? "Yes", r2 = t.inactive ?? "No";
      return new dD({ active: n, inactive: r2, initialValue: t.initialValue ?? true, render() {
        const i = `${import_picocolors2.default.gray(o)}
${b2(this.state)}  ${t.message}
`, s = this.value ? n : r2;
        switch (this.state) {
          case "submit":
            return `${i}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.dim(s)}`;
          case "cancel":
            return `${i}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(s))}
${import_picocolors2.default.gray(o)}`;
          default:
            return `${i}${import_picocolors2.default.cyan(o)}  ${this.value ? `${import_picocolors2.default.green(k2)} ${n}` : `${import_picocolors2.default.dim(P2)} ${import_picocolors2.default.dim(n)}`} ${import_picocolors2.default.dim("/")} ${this.value ? `${import_picocolors2.default.dim(P2)} ${import_picocolors2.default.dim(r2)}` : `${import_picocolors2.default.green(k2)} ${r2}`}
${import_picocolors2.default.cyan(d2)}
`;
        }
      } }).prompt();
    };
    ve = (t) => {
      const n = (r2, i) => {
        const s = r2.label ?? String(r2.value);
        switch (i) {
          case "selected":
            return `${import_picocolors2.default.dim(s)}`;
          case "active":
            return `${import_picocolors2.default.green(k2)} ${s} ${r2.hint ? import_picocolors2.default.dim(`(${r2.hint})`) : ""}`;
          case "cancelled":
            return `${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(s))}`;
          default:
            return `${import_picocolors2.default.dim(P2)} ${import_picocolors2.default.dim(s)}`;
        }
      };
      return new LD({ options: t.options, initialValue: t.initialValue, render() {
        const r2 = `${import_picocolors2.default.gray(o)}
${b2(this.state)}  ${t.message}
`;
        switch (this.state) {
          case "submit":
            return `${r2}${import_picocolors2.default.gray(o)}  ${n(this.options[this.cursor], "selected")}`;
          case "cancel":
            return `${r2}${import_picocolors2.default.gray(o)}  ${n(this.options[this.cursor], "cancelled")}
${import_picocolors2.default.gray(o)}`;
          default:
            return `${r2}${import_picocolors2.default.cyan(o)}  ${G2({ cursor: this.cursor, options: this.options, maxItems: t.maxItems, style: (i, s) => n(i, s ? "active" : "inactive") }).join(`
${import_picocolors2.default.cyan(o)}  `)}
${import_picocolors2.default.cyan(d2)}
`;
        }
      } }).prompt();
    };
    be = (t) => {
      const { selectableGroups: n = true } = t, r2 = (i, s, c = []) => {
        const a = i.label ?? String(i.value), l2 = typeof i.group == "string", $2 = l2 && (c[c.indexOf(i) + 1] ?? { group: true }), g2 = l2 && $2.group === true, p2 = l2 ? n ? `${g2 ? d2 : o} ` : "  " : "";
        if (s === "active") return `${import_picocolors2.default.dim(p2)}${import_picocolors2.default.cyan(A2)} ${a} ${i.hint ? import_picocolors2.default.dim(`(${i.hint})`) : ""}`;
        if (s === "group-active") return `${p2}${import_picocolors2.default.cyan(A2)} ${import_picocolors2.default.dim(a)}`;
        if (s === "group-active-selected") return `${p2}${import_picocolors2.default.green(T2)} ${import_picocolors2.default.dim(a)}`;
        if (s === "selected") {
          const f = l2 || n ? import_picocolors2.default.green(T2) : "";
          return `${import_picocolors2.default.dim(p2)}${f} ${import_picocolors2.default.dim(a)} ${i.hint ? import_picocolors2.default.dim(`(${i.hint})`) : ""}`;
        }
        if (s === "cancelled") return `${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(a))}`;
        if (s === "active-selected") return `${import_picocolors2.default.dim(p2)}${import_picocolors2.default.green(T2)} ${a} ${i.hint ? import_picocolors2.default.dim(`(${i.hint})`) : ""}`;
        if (s === "submitted") return `${import_picocolors2.default.dim(a)}`;
        const v2 = l2 || n ? import_picocolors2.default.dim(F) : "";
        return `${import_picocolors2.default.dim(p2)}${v2} ${import_picocolors2.default.dim(a)}`;
      };
      return new _D({ options: t.options, initialValues: t.initialValues, required: t.required ?? true, cursorAt: t.cursorAt, selectableGroups: n, validate(i) {
        if (this.required && i.length === 0) return `Please select at least one option.
${import_picocolors2.default.reset(import_picocolors2.default.dim(`Press ${import_picocolors2.default.gray(import_picocolors2.default.bgWhite(import_picocolors2.default.inverse(" space ")))} to select, ${import_picocolors2.default.gray(import_picocolors2.default.bgWhite(import_picocolors2.default.inverse(" enter ")))} to submit`))}`;
      }, render() {
        const i = `${import_picocolors2.default.gray(o)}
${b2(this.state)}  ${t.message}
`;
        switch (this.state) {
          case "submit":
            return `${i}${import_picocolors2.default.gray(o)}  ${this.options.filter(({ value: s }) => this.value.includes(s)).map((s) => r2(s, "submitted")).join(import_picocolors2.default.dim(", "))}`;
          case "cancel": {
            const s = this.options.filter(({ value: c }) => this.value.includes(c)).map((c) => r2(c, "cancelled")).join(import_picocolors2.default.dim(", "));
            return `${i}${import_picocolors2.default.gray(o)}  ${s.trim() ? `${s}
${import_picocolors2.default.gray(o)}` : ""}`;
          }
          case "error": {
            const s = this.error.split(`
`).map((c, a) => a === 0 ? `${import_picocolors2.default.yellow(d2)}  ${import_picocolors2.default.yellow(c)}` : `   ${c}`).join(`
`);
            return `${i}${import_picocolors2.default.yellow(o)}  ${this.options.map((c, a, l2) => {
              const $2 = this.value.includes(c.value) || c.group === true && this.isGroupSelected(`${c.value}`), g2 = a === this.cursor;
              return !g2 && typeof c.group == "string" && this.options[this.cursor].value === c.group ? r2(c, $2 ? "group-active-selected" : "group-active", l2) : g2 && $2 ? r2(c, "active-selected", l2) : $2 ? r2(c, "selected", l2) : r2(c, g2 ? "active" : "inactive", l2);
            }).join(`
${import_picocolors2.default.yellow(o)}  `)}
${s}
`;
          }
          default:
            return `${i}${import_picocolors2.default.cyan(o)}  ${this.options.map((s, c, a) => {
              const l2 = this.value.includes(s.value) || s.group === true && this.isGroupSelected(`${s.value}`), $2 = c === this.cursor;
              return !$2 && typeof s.group == "string" && this.options[this.cursor].value === s.group ? r2(s, l2 ? "group-active-selected" : "group-active", a) : $2 && l2 ? r2(s, "active-selected", a) : l2 ? r2(s, "selected", a) : r2(s, $2 ? "active" : "inactive", a);
            }).join(`
${import_picocolors2.default.cyan(o)}  `)}
${import_picocolors2.default.cyan(d2)}
`;
        }
      } }).prompt();
    };
    Me = (t = "", n = "") => {
      const r2 = `
${t}
`.split(`
`), i = S2(n).length, s = Math.max(r2.reduce((a, l2) => {
        const $2 = S2(l2);
        return $2.length > a ? $2.length : a;
      }, 0), i) + 2, c = r2.map((a) => `${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.dim(a)}${" ".repeat(s - S2(a).length)}${import_picocolors2.default.gray(o)}`).join(`
`);
      process.stdout.write(`${import_picocolors2.default.gray(o)}
${import_picocolors2.default.green(C)}  ${import_picocolors2.default.reset(n)} ${import_picocolors2.default.gray(_2.repeat(Math.max(s - i - 1, 1)) + me)}
${c}
${import_picocolors2.default.gray(de + _2.repeat(s + 2) + pe)}
`);
    };
    xe = (t = "") => {
      process.stdout.write(`${import_picocolors2.default.gray(d2)}  ${import_picocolors2.default.red(t)}

`);
    };
    Ie = (t = "") => {
      process.stdout.write(`${import_picocolors2.default.gray(ue)}  ${t}
`);
    };
    Se = (t = "") => {
      process.stdout.write(`${import_picocolors2.default.gray(o)}
${import_picocolors2.default.gray(d2)}  ${t}

`);
    };
    M2 = { message: (t = "", { symbol: n = import_picocolors2.default.gray(o) } = {}) => {
      const r2 = [`${import_picocolors2.default.gray(o)}`];
      if (t) {
        const [i, ...s] = t.split(`
`);
        r2.push(`${n}  ${i}`, ...s.map((c) => `${import_picocolors2.default.gray(o)}  ${c}`));
      }
      process.stdout.write(`${r2.join(`
`)}
`);
    }, info: (t) => {
      M2.message(t, { symbol: import_picocolors2.default.blue(q2) });
    }, success: (t) => {
      M2.message(t, { symbol: import_picocolors2.default.green(D) });
    }, step: (t) => {
      M2.message(t, { symbol: import_picocolors2.default.green(C) });
    }, warn: (t) => {
      M2.message(t, { symbol: import_picocolors2.default.yellow(U2) });
    }, warning: (t) => {
      M2.warn(t);
    }, error: (t) => {
      M2.message(t, { symbol: import_picocolors2.default.red(K2) });
    } };
    J2 = `${import_picocolors2.default.gray(o)}  `;
    Y2 = ({ indicator: t = "dots" } = {}) => {
      const n = V2 ? ["\u25D2", "\u25D0", "\u25D3", "\u25D1"] : ["\u2022", "o", "O", "0"], r2 = V2 ? 80 : 120, i = process.env.CI === "true";
      let s, c, a = false, l2 = "", $2, g2 = performance.now();
      const p2 = (m2) => {
        const h2 = m2 > 1 ? "Something went wrong" : "Canceled";
        a && N2(h2, m2);
      }, v2 = () => p2(2), f = () => p2(1), j2 = () => {
        process.on("uncaughtExceptionMonitor", v2), process.on("unhandledRejection", v2), process.on("SIGINT", f), process.on("SIGTERM", f), process.on("exit", p2);
      }, E = () => {
        process.removeListener("uncaughtExceptionMonitor", v2), process.removeListener("unhandledRejection", v2), process.removeListener("SIGINT", f), process.removeListener("SIGTERM", f), process.removeListener("exit", p2);
      }, B2 = () => {
        if ($2 === void 0) return;
        i && process.stdout.write(`
`);
        const m2 = $2.split(`
`);
        process.stdout.write(import_sisteransi2.cursor.move(-999, m2.length - 1)), process.stdout.write(import_sisteransi2.erase.down(m2.length));
      }, R2 = (m2) => m2.replace(/\.+$/, ""), O2 = (m2) => {
        const h2 = (performance.now() - m2) / 1e3, w2 = Math.floor(h2 / 60), I2 = Math.floor(h2 % 60);
        return w2 > 0 ? `[${w2}m ${I2}s]` : `[${I2}s]`;
      }, H = (m2 = "") => {
        a = true, s = fD(), l2 = R2(m2), g2 = performance.now(), process.stdout.write(`${import_picocolors2.default.gray(o)}
`);
        let h2 = 0, w2 = 0;
        j2(), c = setInterval(() => {
          if (i && l2 === $2) return;
          B2(), $2 = l2;
          const I2 = import_picocolors2.default.magenta(n[h2]);
          if (i) process.stdout.write(`${I2}  ${l2}...`);
          else if (t === "timer") process.stdout.write(`${I2}  ${l2} ${O2(g2)}`);
          else {
            const z2 = ".".repeat(Math.floor(w2)).slice(0, 3);
            process.stdout.write(`${I2}  ${l2}${z2}`);
          }
          h2 = h2 + 1 < n.length ? h2 + 1 : 0, w2 = w2 < n.length ? w2 + 0.125 : 0;
        }, r2);
      }, N2 = (m2 = "", h2 = 0) => {
        a = false, clearInterval(c), B2();
        const w2 = h2 === 0 ? import_picocolors2.default.green(C) : h2 === 1 ? import_picocolors2.default.red(L2) : import_picocolors2.default.red(W2);
        l2 = R2(m2 ?? l2), t === "timer" ? process.stdout.write(`${w2}  ${l2} ${O2(g2)}
`) : process.stdout.write(`${w2}  ${l2}
`), E(), s();
      };
      return { start: H, stop: N2, message: (m2 = "") => {
        l2 = R2(m2 ?? l2);
      } };
    };
  }
});

// src/ui.ts
import { createInterface as createInterface2 } from "node:readline";
function nextAnswer() {
  return scripted && scripted.length ? scripted.shift() : void 0;
}
function info(msg = "") {
  if (collecting) {
    if (msg) collecting.push(msg);
    return;
  }
  if (!quiet) M2.message(msg);
}
function ok(msg) {
  if (collecting) {
    collecting.push(msg);
    return;
  }
  if (!quiet) M2.success(msg);
}
function step(msg) {
  if (collecting) {
    collecting.push(msg);
    return;
  }
  if (!quiet) M2.step(msg);
}
function skip(msg) {
  if (collecting) return;
  if (!quiet) M2.message(import_picocolors3.default.dim("\u25CB " + msg));
}
async function group(title, fn, opts = {}) {
  const prev = collecting;
  const mine = [];
  collecting = mine;
  let result;
  try {
    result = await fn();
  } finally {
    collecting = prev;
  }
  if (quiet) return result;
  const items = mine.map((m2) => strip(m2).trim()).filter(Boolean);
  const max = opts.max ?? 8;
  const summary = items.length ? items.slice(0, max).join(import_picocolors3.default.dim(" \xB7 ")) + (items.length > max ? import_picocolors3.default.dim(` \xB7 +${items.length - max} more`) : "") : opts.done ?? "up to date";
  M2.success(import_picocolors3.default.bold(title) + "\n" + import_picocolors3.default.dim(summary));
  return result;
}
function warn(msg) {
  M2.warn(msg);
}
function fail(msg) {
  M2.error(msg);
}
function error(what, why = "", fix2 = "") {
  const lines = [import_picocolors3.default.bold(what)];
  if (why) lines.push(why);
  if (fix2) lines.push(import_picocolors3.default.cyan("\u2192 ") + fix2);
  M2.error(lines.join("\n"));
}
function section(title) {
  if (!quiet) M2.step(import_picocolors3.default.bold(title));
}
function intro(title) {
  if (!quiet) Ie(import_picocolors3.default.bold(title));
}
function outro(msg) {
  if (!quiet) Se(msg);
}
function note(lines, title) {
  if (!quiet) Me(lines.join("\n"), title);
}
function kv(key, value, width = 14) {
  info(`${import_picocolors3.default.dim(key.padEnd(width))} ${value}`);
}
function table(rows, header) {
  if (collecting) {
    for (const r2 of rows) collecting.push(r2.join("  "));
    return;
  }
  if (quiet || !rows.length) return;
  const all = header ? [header, ...rows] : rows;
  const ncol = Math.max(...all.map((r2) => r2.length));
  const vis = (s) => s.replace(/\x1b\[[0-9;]*m/g, "").length;
  const w2 = Array.from({ length: ncol }, (_3, i) => Math.max(...all.map((r2) => vis(r2[i] ?? ""))));
  const fmt = (r2) => r2.map((cell, i) => cell + " ".repeat(w2[i] - vis(cell))).join("  ").trimEnd();
  const lines = [...header ? [import_picocolors3.default.dim(fmt(header))] : [], ...rows.map(fmt)];
  M2.message(lines.join("\n"));
}
function cancelled(v2) {
  xe("cancelled");
  process.exit(130);
}
async function plainLine(q3) {
  const rl = createInterface2({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q3, (a) => {
    rl.close();
    res(a.trim());
  }));
}
async function text(message, opts = {}) {
  const a = nextAnswer();
  if (a !== void 0) {
    const v3 = a === "<default>" ? opts.default ?? "" : a;
    const err = opts.validate?.(v3);
    if (err) throw new Error(`scripted answer '${v3}' rejected for '${message}': ${err}`);
    return v3;
  }
  if (!isTTY()) {
    for (; ; ) {
      const v3 = await plainLine(`? ${message}${opts.default ? ` [${opts.default}]` : ""}: `) || (opts.default ?? "");
      const err = opts.validate?.(v3);
      if (!err) return v3;
      console.log("  ! " + err);
    }
  }
  const v2 = await he({
    message,
    placeholder: opts.placeholder,
    defaultValue: opts.default,
    initialValue: void 0,
    validate: (x2) => {
      const val = (x2 ?? "").trim() || (opts.default ?? "");
      return opts.validate?.(val);
    }
  });
  if (pD(v2)) cancelled(v2);
  return String(v2 ?? "").trim() || (opts.default ?? "");
}
async function password(message) {
  const a = nextAnswer();
  if (a !== void 0) return a;
  if (!isTTY()) return plainLine(`? ${message}: `);
  const v2 = await ge({ message });
  if (pD(v2)) cancelled(v2);
  return String(v2 ?? "");
}
async function confirm(message, initial = false) {
  const a = nextAnswer();
  if (a !== void 0) return a === "<default>" ? initial : a === "y" || a === "yes";
  if (!isTTY()) {
    const v3 = (await plainLine(`? ${message} [${initial ? "Y/n" : "y/N"}]: `)).toLowerCase();
    return v3 ? v3.startsWith("y") : initial;
  }
  const v2 = await ye({ message, initialValue: initial });
  if (pD(v2)) cancelled(v2);
  return Boolean(v2);
}
async function select(message, options, initial) {
  const a = nextAnswer();
  if (a !== void 0) {
    if (a === "<default>") return initial ?? options[0].value;
    const hit = options.find((o2) => o2.value === a || o2.label.toLowerCase().startsWith(a.toLowerCase()));
    if (!hit) throw new Error(`scripted answer '${a}' matches no option for '${message}'`);
    return hit.value;
  }
  if (!isTTY()) {
    console.log(`? ${message}`);
    options.forEach((o2, i2) => console.log(`  ${i2 + 1}) ${o2.label}`));
    const v3 = await plainLine(`  choose [${options.findIndex((o2) => o2.value === initial) + 1 || 1}]: `);
    const i = parseInt(v3, 10);
    return i >= 1 && i <= options.length ? options[i - 1].value : initial ?? options[0].value;
  }
  const v2 = await ve({ message, options, initialValue: initial });
  if (pD(v2)) cancelled(v2);
  return v2;
}
async function groupMultiselect(message, groups, initial = []) {
  const all = Object.values(groups).flat();
  const a = nextAnswer();
  if (a !== void 0) return a === "<default>" ? initial : a === "all" ? all.map((o2) => o2.value) : a.split(",").map((x2) => x2.trim()).filter(Boolean);
  if (!isTTY()) {
    console.log(`? ${message}`);
    for (const [g2, opts] of Object.entries(groups)) console.log(`  ${g2}: ${opts.map((o2) => o2.value).join(", ")}`);
    const v3 = await plainLine(`  comma list (Enter = ${initial.length === all.length ? "all" : initial.join(",")}): `);
    return v3 ? v3.split(",").map((x2) => x2.trim()) : initial;
  }
  const v2 = await be({ message, options: groups, initialValues: initial, required: false, selectableGroups: true });
  if (pD(v2)) cancelled(v2);
  return v2;
}
async function proceed(message, doneLabel = "Done \u2014 check again", skipLabel = "Skip for now") {
  return await select(message, [{ value: "done", label: doneLabel }, { value: "skip", label: skipLabel }]) === "done";
}
async function spin(label, fn) {
  if (quiet || !process.stdout.isTTY) return fn(() => {
  });
  const s = Y2();
  s.start(label);
  try {
    const r2 = await fn((l2) => s.message(l2));
    s.stop(label);
    return r2;
  } catch (e2) {
    s.stop(import_picocolors3.default.red(label + " failed"));
    throw e2;
  }
}
var import_picocolors3, quiet, collecting, setQuiet, strip, isTTY, scripted, isScripted, dim, bold, green, yellow, red, cyan, gray, magenta;
var init_ui = __esm({
  "src/ui.ts"() {
    "use strict";
    init_dist2();
    import_picocolors3 = __toESM(require_picocolors(), 1);
    quiet = false;
    collecting = null;
    setQuiet = (q3) => {
      quiet = q3;
    };
    strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
    isTTY = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);
    scripted = process.env.CS_ANSWERS ? JSON.parse(process.env.CS_ANSWERS) : null;
    isScripted = () => scripted !== null;
    dim = import_picocolors3.default.dim;
    bold = import_picocolors3.default.bold;
    green = import_picocolors3.default.green;
    yellow = import_picocolors3.default.yellow;
    red = import_picocolors3.default.red;
    cyan = import_picocolors3.default.cyan;
    gray = import_picocolors3.default.gray;
    magenta = import_picocolors3.default.magenta;
  }
});

// src/paths.ts
var paths_exports = {};
__export(paths_exports, {
  claudeDir: () => claudeDir,
  claudeJson: () => claudeJson,
  contract: () => contract,
  csConfigDir: () => csConfigDir,
  expand: () => expand,
  home: () => home,
  isUnder: () => isUnder,
  machineFile: () => machineFile,
  nodename: () => nodename,
  repoDirDefault: () => repoDirDefault,
  stateDir: () => stateDir,
  templatesDir: () => templatesDir,
  toolRoot: () => toolRoot
});
import { homedir, hostname } from "node:os";
import { join, resolve, isAbsolute, relative } from "node:path";
function expand(p2) {
  let s = p2.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_3, v2) => process.env[v2] ?? "");
  if (s === "~" || s.startsWith("~/")) s = home() + s.slice(1);
  return s;
}
function contract(p2) {
  const h2 = home();
  if (p2 === h2) return "~";
  if (p2.startsWith(h2 + "/")) return "~/" + p2.slice(h2.length + 1);
  return p2;
}
var home, claudeDir, claudeJson, csConfigDir, machineFile, repoDirDefault, stateDir, toolRoot, templatesDir, nodename, isUnder;
var init_paths = __esm({
  "src/paths.ts"() {
    "use strict";
    home = () => process.env.HOME || homedir();
    claudeDir = () => process.env.CLAUDE_CONFIG_DIR || join(home(), ".claude");
    claudeJson = () => join(process.env.CLAUDE_CONFIG_DIR || home(), ".claude.json");
    csConfigDir = () => process.env.CS_CONFIG_DIR || join(home(), ".config", "claude-share");
    machineFile = () => join(csConfigDir(), "machine.toml");
    repoDirDefault = () => join(csConfigDir(), "repo");
    stateDir = () => join(process.env.XDG_STATE_HOME || join(home(), ".local", "state"), "cs");
    toolRoot = () => resolve(new URL(".", import.meta.url).pathname, "..");
    templatesDir = () => join(toolRoot(), "templates");
    nodename = () => hostname();
    isUnder = (child, parent) => {
      const r2 = relative(parent, child);
      return !!r2 && !r2.startsWith("..") && !isAbsolute(r2);
    };
  }
});

// src/platform.ts
import { readFileSync } from "node:fs";
import { join as join2 } from "node:path";
function isWSL() {
  if (!isLinux()) return false;
  try {
    return readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");
  } catch {
    return false;
  }
}
function refuseUnsupported() {
  if (process.platform === "win32" || process.env.MSYSTEM) {
    console.error("cs: Windows-native shells are unsupported. Run inside WSL2 (`wsl --install -d Ubuntu-24.04`). See docs/WINDOWS.md.");
    process.exit(1);
  }
}
var isMac, isLinux, shellRc, describe;
var init_platform = __esm({
  "src/platform.ts"() {
    "use strict";
    init_paths();
    isMac = () => process.platform === "darwin";
    isLinux = () => process.platform === "linux";
    shellRc = () => join2(home(), isMac() ? ".zshrc" : ".bashrc");
    describe = () => isWSL() ? "wsl2" : isMac() ? "macos" : process.platform;
  }
});

// node_modules/smol-toml/dist/date.js
var DATE_TIME_RE, TomlDate;
var init_date = __esm({
  "node_modules/smol-toml/dist/date.js"() {
    DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i;
    TomlDate = class _TomlDate extends Date {
      #hasDate = false;
      #hasTime = false;
      #offset = null;
      constructor(date) {
        let hasDate = true;
        let hasTime = true;
        let offset = "Z";
        if (typeof date === "string") {
          let match = date.match(DATE_TIME_RE);
          if (match) {
            if (!match[1]) {
              hasDate = false;
              date = `0000-01-01T${date}`;
            }
            hasTime = !!match[2];
            hasTime && date[10] === " " && (date = date.replace(" ", "T"));
            if (match[2] && +match[2] > 23) {
              date = "";
            } else {
              offset = match[3] || null;
              date = date.toUpperCase();
              if (!offset && hasTime)
                date += "Z";
            }
          } else {
            date = "";
          }
        }
        super(date);
        if (!isNaN(this.getTime())) {
          this.#hasDate = hasDate;
          this.#hasTime = hasTime;
          this.#offset = offset;
        }
      }
      isDateTime() {
        return this.#hasDate && this.#hasTime;
      }
      isLocal() {
        return !this.#hasDate || !this.#hasTime || !this.#offset;
      }
      isDate() {
        return this.#hasDate && !this.#hasTime;
      }
      isTime() {
        return this.#hasTime && !this.#hasDate;
      }
      isValid() {
        return this.#hasDate || this.#hasTime;
      }
      toISOString() {
        let iso = super.toISOString();
        if (this.isDate())
          return iso.slice(0, 10);
        if (this.isTime())
          return iso.slice(11, 23);
        if (this.#offset === null)
          return iso.slice(0, -1);
        if (this.#offset === "Z")
          return iso;
        let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
        offset = this.#offset[0] === "-" ? offset : -offset;
        let offsetDate = new Date(this.getTime() - offset * 6e4);
        return offsetDate.toISOString().slice(0, -1) + this.#offset;
      }
      static wrapAsOffsetDateTime(jsDate, offset = "Z") {
        let date = new _TomlDate(jsDate);
        date.#offset = offset;
        return date;
      }
      static wrapAsLocalDateTime(jsDate) {
        let date = new _TomlDate(jsDate);
        date.#offset = null;
        return date;
      }
      static wrapAsLocalDate(jsDate) {
        let date = new _TomlDate(jsDate);
        date.#hasTime = false;
        date.#offset = null;
        return date;
      }
      static wrapAsLocalTime(jsDate) {
        let date = new _TomlDate(jsDate);
        date.#hasDate = false;
        date.#offset = null;
        return date;
      }
    };
  }
});

// node_modules/smol-toml/dist/error.js
function getLineColFromPtr(string, ptr) {
  let lines = string.slice(0, ptr).split(/\r\n|\n|\r/g);
  return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string, line, column) {
  let lines = string.split(/\r\n|\n|\r/g);
  let codeblock = "";
  let numberLen = (Math.log10(line + 1) | 0) + 1;
  for (let i = line - 1; i <= line + 1; i++) {
    let l2 = lines[i - 1];
    if (!l2)
      continue;
    codeblock += i.toString().padEnd(numberLen, " ");
    codeblock += ":  ";
    codeblock += l2;
    codeblock += "\n";
    if (i === line) {
      codeblock += " ".repeat(numberLen + column + 2);
      codeblock += "^\n";
    }
  }
  return codeblock;
}
var TomlError;
var init_error = __esm({
  "node_modules/smol-toml/dist/error.js"() {
    TomlError = class extends Error {
      line;
      column;
      codeblock;
      constructor(message, options) {
        const [line, column] = getLineColFromPtr(options.toml, options.ptr);
        const codeblock = makeCodeBlock(options.toml, line, column);
        super(`Invalid TOML document: ${message}

${codeblock}`, options);
        this.line = line;
        this.column = column;
        this.codeblock = codeblock;
      }
    };
  }
});

// node_modules/smol-toml/dist/util.js
function indexOfNewline(str, start = 0) {
  let idx = str.indexOf("\n", start);
  if (str.charCodeAt(idx - 1) === 13)
    idx--;
  return idx;
}
function skipComment(ctx2) {
  for (; ctx2.p < ctx2.s.length; ctx2.p++) {
    let c = ctx2.s.charCodeAt(ctx2.p);
    if (c === 10)
      break;
    if (c === 13 && ctx2.s.charCodeAt(ctx2.p + 1) === 10) {
      ctx2.p++;
      break;
    }
    if (c < 32 && c !== 9 || c === 127) {
      throw new TomlError("control characters are not allowed in comments", {
        toml: ctx2.s,
        ptr: ctx2.p
      });
    }
  }
}
function skipVoid(ctx2, banNewLines, banComments) {
  let c;
  while (1) {
    while ((c = ctx2.s.charCodeAt(ctx2.p)) === 32 || c === 9 || !banNewLines && (c === 10 || c === 13 && ctx2.s.charCodeAt(ctx2.p + 1) === 10))
      ctx2.p++;
    if (banComments || c !== 35)
      break;
    skipComment(ctx2);
  }
}
function skipUntil(ctx2, sep, end) {
  let ptr = ctx2.p;
  if (!end) {
    ptr = indexOfNewline(ctx2.s, ptr);
    ctx2.p = ptr < 0 ? ctx2.s.length : ptr;
    return;
  }
  for (; ctx2.p < ctx2.s.length; ctx2.p++) {
    let c = ctx2.s.charCodeAt(ctx2.p);
    if (c === 35) {
      skipComment(ctx2);
    } else if (c === end || c === sep) {
      return;
    }
  }
  throw new TomlError("cannot find end of structure", {
    toml: ctx2.s,
    ptr
  });
}
var init_util = __esm({
  "node_modules/smol-toml/dist/util.js"() {
    init_error();
  }
});

// node_modules/smol-toml/dist/primitive.js
function parseString(ctx2) {
  let start = ctx2.p;
  let c = ctx2.s.charCodeAt(ctx2.p++);
  let first = c;
  let isLiteral = c === 39;
  let isMultiline = c === ctx2.s.charCodeAt(ctx2.p) && c === ctx2.s.charCodeAt(ctx2.p + 1);
  if (isMultiline) {
    if ((c = ctx2.s.charCodeAt(ctx2.p += 2)) === 10)
      ctx2.p++;
    else if (c === 13 && ctx2.s.charCodeAt(ctx2.p + 1) === 10)
      ctx2.p += 2;
  }
  let parsed = "";
  let sliceStart = ctx2.p;
  let state = 0;
  for (; ctx2.p < ctx2.s.length; ctx2.p++) {
    c = ctx2.s.charCodeAt(ctx2.p);
    if (isMultiline && (c === 10 || c === 13 && ctx2.s.charCodeAt(ctx2.p + 1) === 10)) {
      state = state && 3;
    } else if (c < 32 && c !== 9 || c === 127) {
      throw new TomlError("control characters are not allowed in strings", {
        toml: ctx2.s,
        ptr: ctx2.p
      });
    } else if ((!state || state === 3) && c === first && (!isMultiline || ctx2.s.charCodeAt(ctx2.p + 1) === first && ctx2.s.charCodeAt(ctx2.p + 2) === first)) {
      if (isMultiline) {
        if (ctx2.s.charCodeAt(ctx2.p + 3) === first)
          ctx2.p++;
        if (ctx2.s.charCodeAt(ctx2.p + 3) === first)
          ctx2.p++;
      }
      if (!state)
        parsed += ctx2.s.slice(sliceStart, ctx2.p);
      ctx2.p += isMultiline ? 3 : 1;
      return parsed;
    } else if (!state) {
      if (!isLiteral && c === 92) {
        parsed += ctx2.s.slice(sliceStart, sliceStart = ctx2.p);
        state = 1;
      }
    } else if (state === 1) {
      if (c === 120 || c === 117 || c === 85) {
        let value = 0;
        let len = c === 120 ? 2 : c === 117 ? 4 : 8;
        for (let j2 = 0; j2 < len; j2++, ctx2.p++) {
          let hex = ctx2.s.charCodeAt(ctx2.p + 1);
          let digit = (
            /* 0-9 */
            hex >= 48 && hex <= 57 ? hex - 48 : (
              /* A-F */
              hex >= 65 && hex <= 70 ? hex - 65 + 10 : (
                /* a-f */
                hex >= 97 && hex <= 102 ? hex - 97 + 10 : -1
              )
            )
          );
          if (digit < 0)
            throw new TomlError("invalid non-hex character in unicode escape", { toml: ctx2.s, ptr: ctx2.p + 1 });
          value = value << 4 | digit;
        }
        if (value < 0 || value > 1114111 || value >= 55296 && value <= 57343) {
          throw new TomlError("invalid unicode escape", { toml: ctx2.s, ptr: ctx2.p });
        }
        parsed += String.fromCodePoint(value);
        sliceStart = ctx2.p + 1;
        state = 0;
      } else if (c === 32 || c === 9) {
        state = 2;
      } else {
        if (c === 98)
          parsed += "\b";
        else if (c === 116)
          parsed += "	";
        else if (c === 110)
          parsed += "\n";
        else if (c === 102)
          parsed += "\f";
        else if (c === 114)
          parsed += "\r";
        else if (c === 101)
          parsed += "\x1B";
        else if (c === 34)
          parsed += '"';
        else if (c === 92)
          parsed += "\\";
        else
          throw new TomlError("unrecognized escape sequence", { toml: ctx2.s, ptr: ctx2.p });
        sliceStart = ctx2.p + 1;
        state = 0;
      }
    } else if (c !== 32 && c !== 9) {
      if (state === 2) {
        throw new TomlError("invalid escape: only line-ending whitespace may be escaped", {
          toml: ctx2.s,
          ptr: sliceStart
        });
      }
      state = !isLiteral && c === 92 ? 1 : 0;
      sliceStart = ctx2.p;
    }
  }
  throw new TomlError("unfinished string", { toml: ctx2.s, ptr: start });
}
function sliceAndTrimEndOf(ctx2, start, end) {
  let value = ctx2.s.slice(start, end);
  let commentIdx = value.indexOf("#");
  if (commentIdx > 0) {
    skipComment({ s: value, p: commentIdx, d: 0 });
    value = value.slice(0, commentIdx);
  }
  return value.trimEnd();
}
function parseValue(ctx2, integersAsBigInt, end) {
  let ptr = ctx2.p;
  let err = { toml: ctx2.s, ptr };
  skipUntil(ctx2, 44, end);
  let value = sliceAndTrimEndOf(ctx2, ptr, ctx2.p);
  if (!value)
    throw new TomlError("incomplete declaration: value expected", err);
  if (value === "-inf")
    return -Infinity;
  if (value === "inf" || value === "+inf")
    return Infinity;
  if (value === "nan" || value === "+nan" || value === "-nan")
    return NaN;
  if (value === "-0")
    return integersAsBigInt ? 0n : 0;
  let isInt = INT_REGEX.test(value);
  if (isInt || FLOAT_REGEX.test(value)) {
    if (LEADING_ZERO.test(value)) {
      throw new TomlError("leading zeroes are not allowed", err);
    }
    value = value.replace(/_/g, "");
    let numeric = +value;
    if (isNaN(numeric)) {
      throw new TomlError("invalid number", err);
    }
    if (isInt) {
      if ((isInt = !Number.isSafeInteger(numeric)) && !integersAsBigInt) {
        throw new TomlError("integer value cannot be represented losslessly", err);
      }
      if (isInt || integersAsBigInt === true)
        numeric = BigInt(value);
    }
    return numeric;
  }
  const date = new TomlDate(value);
  if (!date.isValid())
    throw new TomlError("invalid value", err);
  return date;
}
var INT_REGEX, FLOAT_REGEX, LEADING_ZERO;
var init_primitive = __esm({
  "node_modules/smol-toml/dist/primitive.js"() {
    init_date();
    init_error();
    init_util();
    INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
    FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
    LEADING_ZERO = /^[+-]?0[0-9_]/;
  }
});

// node_modules/smol-toml/dist/extract.js
function extractValue(ctx2, end, integersAsBigInt) {
  let ptr = ctx2.p;
  let c = ctx2.s.charCodeAt(ptr);
  if (c === 91 || c === 123) {
    if (!ctx2.d--) {
      throw new TomlError("document contains excessively nested structures. aborting.", {
        toml: ctx2.s,
        ptr
      });
    }
    let value = c === 91 ? parseArray(ctx2, integersAsBigInt) : parseInlineTable(ctx2, integersAsBigInt);
    ctx2.d++;
    return value;
  }
  if (c === 34 || c === 39) {
    return parseString(ctx2);
  }
  if (c === 116) {
    if (ctx2.s.charCodeAt(++ctx2.p) !== 114 || ctx2.s.charCodeAt(++ctx2.p) !== 117 || ctx2.s.charCodeAt(++ctx2.p) !== 101)
      throw new TomlError("invalid value", { toml: ctx2.s, ptr });
    ctx2.p++;
    return true;
  }
  if (c === 102) {
    if (ctx2.s.charCodeAt(++ctx2.p) !== 97 || ctx2.s.charCodeAt(++ctx2.p) !== 108 || ctx2.s.charCodeAt(++ctx2.p) !== 115 || ctx2.s.charCodeAt(++ctx2.p) !== 101)
      throw new TomlError("invalid value", { toml: ctx2.s, ptr });
    ctx2.p++;
    return false;
  }
  return parseValue(ctx2, integersAsBigInt, end);
}
var init_extract = __esm({
  "node_modules/smol-toml/dist/extract.js"() {
    init_primitive();
    init_struct();
    init_error();
  }
});

// node_modules/smol-toml/dist/struct.js
function parseKey(ctx2, end = "=") {
  let start = ctx2.p;
  let dot = start - 1;
  let parsed = [];
  let endPtr = ctx2.s.indexOf(end, start);
  if (endPtr < 0) {
    throw new TomlError("incomplete key-value: cannot find end of key", {
      toml: ctx2.s,
      ptr: start
    });
  }
  do {
    let c = ctx2.s.charCodeAt(ctx2.p = ++dot);
    if (c !== 32 && c !== 9) {
      if (c === 34 || c === 39) {
        if (c === ctx2.s.charCodeAt(ctx2.p + 1) && c === ctx2.s.charCodeAt(ctx2.p + 2)) {
          throw new TomlError("multiline strings are not allowed in keys", {
            toml: ctx2.s,
            ptr: ctx2.p
          });
        }
        let part = parseString(ctx2);
        dot = ctx2.s.indexOf(".", ctx2.p);
        let strEnd = ctx2.s.slice(ctx2.p, dot < 0 || dot > endPtr ? endPtr : dot);
        let newLine = indexOfNewline(strEnd);
        if (newLine > -1) {
          throw new TomlError("newlines are not allowed in keys", {
            toml: ctx2.s,
            ptr: newLine
          });
        }
        if (strEnd.trimStart()) {
          throw new TomlError("found extra tokens after the string part", {
            toml: ctx2.s,
            ptr: ctx2.p
          });
        }
        if (endPtr < ctx2.p) {
          endPtr = ctx2.s.indexOf(end, ctx2.p);
          if (endPtr < 0) {
            throw new TomlError("incomplete key-value: cannot find end of key", {
              toml: ctx2.s,
              ptr: start
            });
          }
        }
        parsed.push(part);
      } else {
        dot = ctx2.s.indexOf(".", ctx2.p);
        let part = ctx2.s.slice(ctx2.p, dot < 0 || dot > endPtr ? endPtr : dot);
        if (!KEY_PART_RE.test(part)) {
          throw new TomlError("only letter, numbers, dashes and underscores are allowed in keys", {
            toml: ctx2.s,
            ptr: ctx2.p
          });
        }
        parsed.push(part.trimEnd());
      }
    }
  } while (dot + 1 && dot < endPtr);
  ctx2.p = endPtr + 1;
  skipVoid(ctx2, true, true);
  return parsed;
}
function parseInlineTable(ctx2, integersAsBigInt) {
  let res = {};
  let seen = /* @__PURE__ */ new Set();
  let c;
  ctx2.p++;
  while (ctx2.p < ctx2.s.length) {
    skipVoid(ctx2);
    if ((c = ctx2.s.charCodeAt(ctx2.p)) === 125) {
      ctx2.p++;
      return res;
    }
    let k3;
    let t = res;
    let hasOwn = false;
    let p2 = ctx2.p;
    let key = parseKey(ctx2);
    for (let i = 0; i < key.length; i++) {
      if (i)
        t = hasOwn ? t[k3] : t[k3] = {};
      k3 = key[i];
      if ((hasOwn = Object.hasOwn(t, k3)) && (typeof t[k3] !== "object" || seen.has(t[k3]))) {
        throw new TomlError("trying to redefine an already defined value", {
          toml: ctx2.s,
          ptr: p2
        });
      }
      if (!hasOwn && k3 === "__proto__") {
        Object.defineProperty(t, k3, { enumerable: true, configurable: true, writable: true });
      }
    }
    if (hasOwn) {
      throw new TomlError("trying to redefine an already defined value", {
        toml: ctx2.s,
        ptr: ctx2.p
      });
    }
    let value = extractValue(ctx2, 125, integersAsBigInt);
    seen.add(t[k3] = value);
    skipVoid(ctx2);
    if ((c = ctx2.s.charCodeAt(ctx2.p++)) === 125) {
      return res;
    }
    if (c !== 44) {
      throw new TomlError("expected comma or end of structure", { toml: ctx2.s, ptr: ctx2.p - 1 });
    }
  }
  throw new TomlError("unfinished table encountered", {
    toml: ctx2.s,
    ptr: ctx2.p
  });
}
function parseArray(ctx2, integersAsBigInt) {
  let res = [];
  let c;
  ctx2.p++;
  while (ctx2.p < ctx2.s.length) {
    skipVoid(ctx2);
    if ((c = ctx2.s.charCodeAt(ctx2.p)) === 93) {
      ctx2.p++;
      return res;
    }
    res.push(extractValue(ctx2, 93, integersAsBigInt));
    skipVoid(ctx2);
    if ((c = ctx2.s.charCodeAt(ctx2.p++)) === 93) {
      return res;
    }
    if (c !== 44) {
      throw new TomlError("expected comma or end of structure", { toml: ctx2.s, ptr: ctx2.p - 1 });
    }
  }
  throw new TomlError("unfinished array encountered", {
    toml: ctx2.s,
    ptr: ctx2.p
  });
}
var KEY_PART_RE;
var init_struct = __esm({
  "node_modules/smol-toml/dist/struct.js"() {
    init_primitive();
    init_extract();
    init_util();
    init_error();
    KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
  }
});

// node_modules/smol-toml/dist/parse.js
function peekTable(key, table2, meta, type) {
  let t = table2;
  let m2 = meta;
  let k3;
  let hasOwn = false;
  let state;
  for (let i = 0; i < key.length; i++) {
    if (i) {
      t = hasOwn ? t[k3] : t[k3] = {};
      m2 = (state = m2[k3]).c;
      if (type === 0 && (state.t === 1 || state.t === 2)) {
        return null;
      }
      if (state.t === 2) {
        let l2 = t.length - 1;
        t = t[l2];
        m2 = m2[l2].c;
      }
    }
    k3 = key[i];
    if ((hasOwn = Object.hasOwn(t, k3)) && m2[k3]?.t === 0 && m2[k3]?.d) {
      return null;
    }
    if (!hasOwn) {
      if (k3 === "__proto__") {
        Object.defineProperty(t, k3, { enumerable: true, configurable: true, writable: true });
        Object.defineProperty(m2, k3, { enumerable: true, configurable: true, writable: true });
      }
      m2[k3] = {
        t: i < key.length - 1 && type === 2 ? 3 : type,
        d: false,
        i: 0,
        c: {}
      };
    }
  }
  state = m2[k3];
  if (state.t !== type && !(type === 1 && state.t === 3)) {
    return null;
  }
  if (type === 2) {
    if (!state.d) {
      state.d = true;
      t[k3] = [];
    }
    t[k3].push(t = {});
    state.c[state.i++] = state = { t: 1, d: false, i: 0, c: {} };
  }
  if (state.d) {
    return null;
  }
  state.d = true;
  if (type === 1) {
    t = hasOwn ? t[k3] : t[k3] = {};
  } else if (type === 0 && hasOwn) {
    return null;
  }
  return [k3, t, state.c];
}
function parse(toml, { maxDepth = 1e3, integersAsBigInt } = {}) {
  let ctx2 = { s: toml, p: 0, d: maxDepth };
  let res = {};
  let meta = {};
  let tmp;
  let tbl = res;
  let m2 = meta;
  skipVoid(ctx2);
  while (ctx2.p < toml.length) {
    if (toml.charCodeAt(ctx2.p) === 91) {
      let isTableArray = toml.charCodeAt(++ctx2.p) === 91;
      tmp = ctx2.p += +isTableArray;
      let k3 = parseKey(ctx2, "]");
      if (isTableArray) {
        if (toml.charCodeAt(ctx2.p - 1) !== 93) {
          throw new TomlError("expected end of table declaration", {
            toml,
            ptr: ctx2.p - 1
          });
        }
        ctx2.p++;
      }
      let p2 = peekTable(
        k3,
        res,
        meta,
        isTableArray ? 2 : 1
        /* Type.EXPLICIT */
      );
      if (!p2) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr: tmp
        });
      }
      m2 = p2[2];
      tbl = p2[1];
    } else {
      tmp = ctx2.p;
      let k3 = parseKey(ctx2);
      let p2 = peekTable(
        k3,
        tbl,
        m2,
        0
        /* Type.DOTTED */
      );
      if (!p2) {
        throw new TomlError("trying to redefine an already defined table or value", {
          toml,
          ptr: tmp
        });
      }
      p2[1][p2[0]] = extractValue(ctx2, void 0, integersAsBigInt);
    }
    skipVoid(ctx2, true);
    if (ctx2.p < toml.length && (tmp = toml.charCodeAt(ctx2.p)) !== 10 && tmp !== 13) {
      throw new TomlError("each key-value declaration must be followed by an end-of-line", {
        toml,
        ptr: ctx2.p
      });
    }
    skipVoid(ctx2);
  }
  return res;
}
var init_parse = __esm({
  "node_modules/smol-toml/dist/parse.js"() {
    init_struct();
    init_extract();
    init_util();
    init_error();
  }
});

// node_modules/smol-toml/dist/stringify.js
function extendedTypeOf(obj) {
  let type = typeof obj;
  if (type === "object") {
    if (Array.isArray(obj))
      return "array";
    if (typeof obj?.getUTCDate === "function" && obj instanceof Date)
      return "date";
    if (globalThis.Temporal && // check for the 'since' property as an early bailout that avoids running all 5 instanceof checks
    typeof obj?.since === "function" && (obj instanceof Temporal.Instant || obj instanceof Temporal.PlainDate || obj instanceof Temporal.PlainDateTime || obj instanceof Temporal.PlainTime || obj instanceof Temporal.ZonedDateTime)) {
      return "temporal";
    }
  }
  return type;
}
function isArrayOfTables(obj) {
  for (let i = 0; i < obj.length; i++) {
    if (extendedTypeOf(obj[i]) !== "object")
      return false;
  }
  return obj.length != 0;
}
function formatString(s) {
  return JSON.stringify(s).replace(/\x7f/g, "\\u007f");
}
function stringifyTemporal(temporal) {
  return temporal.toString({
    calendarName: "never",
    timeZoneName: "never"
  });
}
function stringifyValue(val, type, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  switch (type) {
    // @ts-expect-error -- intentional fallthrough case
    case "number":
      if (isNaN(val))
        return "nan";
      if (val === Infinity)
        return "inf";
      if (val === -Infinity)
        return "-inf";
      if (Number.isInteger(val) && (numberAsFloat || !Number.isSafeInteger(val)))
        return val.toFixed(1);
    case "bigint":
    case "boolean":
      return val.toString();
    case "string":
      return formatString(val);
    case "date":
      if (isNaN(val.getTime()))
        throw new TypeError("cannot serialize invalid date");
      return val.toISOString();
    case "object":
      return stringifyInlineTable(val, depth, numberAsFloat);
    case "array":
      return stringifyArray(val, depth, numberAsFloat);
    case "temporal":
      return stringifyTemporal(val);
  }
}
function stringifyInlineTable(obj, depth, numberAsFloat) {
  let keys = Object.keys(obj);
  if (keys.length === 0)
    return "{}";
  let res = "{ ";
  for (let i = 0; i < keys.length; i++) {
    let k3 = keys[i];
    if (i)
      res += ", ";
    res += BARE_KEY.test(k3) ? k3 : formatString(k3);
    res += " = ";
    res += stringifyValue(obj[k3], extendedTypeOf(obj[k3]), depth - 1, numberAsFloat);
  }
  return res + " }";
}
function stringifyArray(array, depth, numberAsFloat) {
  if (array.length === 0)
    return "[]";
  let res = "[ ";
  for (let i = 0; i < array.length; i++) {
    if (i)
      res += ", ";
    if (array[i] === null || array[i] === void 0) {
      throw new TypeError("arrays cannot contain null or undefined values");
    }
    res += stringifyValue(array[i], extendedTypeOf(array[i]), depth - 1, numberAsFloat);
  }
  return res + " ]";
}
function stringifyArrayTable(array, key, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let res = "";
  for (let i = 0; i < array.length; i++) {
    res += `${res && "\n"}[[${key}]]
`;
    res += stringifyTable(0, array[i], key, depth, numberAsFloat);
  }
  return res;
}
function stringifyTable(tableKey, obj, prefix, depth, numberAsFloat) {
  if (depth === 0) {
    throw new Error("Could not stringify the object: maximum object depth exceeded");
  }
  let preamble = "";
  let tables = "";
  let keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    let k3 = keys[i];
    if (obj[k3] !== null && obj[k3] !== void 0) {
      let type = extendedTypeOf(obj[k3]);
      if (type === "symbol" || type === "function") {
        throw new TypeError(`cannot serialize values of type '${type}'`);
      }
      let key = BARE_KEY.test(k3) ? k3 : formatString(k3);
      if (type === "array" && isArrayOfTables(obj[k3])) {
        tables += (tables && "\n") + stringifyArrayTable(obj[k3], prefix ? `${prefix}.${key}` : key, depth - 1, numberAsFloat);
      } else if (type === "object") {
        let tblKey = prefix ? `${prefix}.${key}` : key;
        tables += (tables && "\n") + stringifyTable(tblKey, obj[k3], tblKey, depth - 1, numberAsFloat);
      } else {
        preamble += key;
        preamble += " = ";
        preamble += stringifyValue(obj[k3], type, depth, numberAsFloat);
        preamble += "\n";
      }
    }
  }
  if (tableKey && (preamble || !tables))
    preamble = preamble ? `[${tableKey}]
${preamble}` : `[${tableKey}]`;
  return preamble && tables ? `${preamble}
${tables}` : preamble || tables;
}
function stringify(obj, { maxDepth = 1e3, numbersAsFloat = false } = {}) {
  if (extendedTypeOf(obj) !== "object") {
    throw new TypeError("stringify can only be called with an object");
  }
  let str = stringifyTable(0, obj, "", maxDepth, numbersAsFloat);
  if (str[str.length - 1] !== "\n")
    return str + "\n";
  return str;
}
var BARE_KEY;
var init_stringify = __esm({
  "node_modules/smol-toml/dist/stringify.js"() {
    BARE_KEY = /^[a-z0-9-_]+$/i;
  }
});

// node_modules/smol-toml/dist/index.js
var init_dist3 = __esm({
  "node_modules/smol-toml/dist/index.js"() {
    init_parse();
    init_stringify();
    init_date();
    init_error();
  }
});

// src/config.ts
var config_exports = {};
__export(config_exports, {
  loadMachine: () => loadMachine,
  machineExists: () => machineExists,
  repoDir: () => repoDir,
  saveMachine: () => saveMachine
});
import { existsSync, mkdirSync, readFileSync as readFileSync2, writeFileSync } from "node:fs";
import { dirname } from "node:path";
function machineExists() {
  return existsSync(machineFile());
}
function loadMachine() {
  if (!machineExists()) throw new Error("cs: no machine config yet \u2014 run `cs init` first");
  const d3 = parse(readFileSync2(machineFile(), "utf8"));
  return {
    name: d3.name,
    profiles: d3.profiles ?? ["personal"],
    exclude: d3.exclude ?? [],
    workspace: d3.workspace,
    repo: d3.repo,
    secretsBackend: d3.secrets?.backend ?? "sops"
  };
}
function saveMachine(m2) {
  const obj = { name: m2.name, profiles: m2.profiles, exclude: m2.exclude };
  if (m2.workspace) obj.workspace = m2.workspace;
  if (m2.repo) obj.repo = m2.repo;
  obj.secrets = { backend: m2.secretsBackend };
  mkdirSync(dirname(machineFile()), { recursive: true });
  writeFileSync(machineFile(), "# claude-share machine config (not synced). Edit freely.\n" + stringify(obj) + "\n");
}
var repoDir;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    init_dist3();
    init_paths();
    repoDir = (m2) => m2.repo ? expand(m2.repo) : repoDirDefault();
  }
});

// src/manifest.ts
var manifest_exports = {};
__export(manifest_exports, {
  KINDS: () => KINDS,
  NAME_RE: () => NAME_RE,
  SUPPORTED_SCHEMA: () => SUPPORTED_SCHEMA,
  appendIdentity: () => appendIdentity,
  appendProject: () => appendProject,
  checkoutRoot: () => checkoutRoot,
  container: () => container,
  globMatch: () => globMatch,
  globs: () => globs,
  identityBlock: () => identityBlock,
  identityByFlag: () => identityByFlag,
  identityForUrl: () => identityForUrl,
  identityMatches: () => identityMatches,
  keyPath: () => keyPath,
  loadManifest: () => loadManifest,
  parseManifest: () => parseManifest,
  projectBlock: () => projectBlock,
  projectForPath: () => projectForPath,
  selected: () => selected,
  selectedProjects: () => selectedProjects,
  validate: () => validate,
  workspace: () => workspace
});
import { existsSync as existsSync2, readFileSync as readFileSync3, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join3, isAbsolute as isAbsolute2, resolve as resolve2 } from "node:path";
function globMatch(pattern, s) {
  const re = "^" + pattern.split("**").map((part) => part.split("*").map((x2) => x2.replace(/[.+^${}()|[\]\\?]/g, "\\$&")).join("[^/]*")).join(".*") + "$";
  return new RegExp(re).test(s);
}
function identityForUrl(m2, url) {
  return Object.values(m2.identities).find((i) => identityMatches(i, url));
}
function identityByFlag(m2, flag) {
  const f = flag.toLowerCase();
  return Object.values(m2.identities).find((i) => i.id.toLowerCase() === f || i.owner?.toLowerCase() === f);
}
function selected(p2, m2) {
  if (p2.machines.length && !p2.machines.includes(m2.name)) return false;
  if (m2.exclude.includes(p2.name)) return false;
  return p2.profiles.includes("all") || p2.profiles.some((x2) => m2.profiles.includes(x2));
}
function projectForPath(man, m2, path) {
  const ws = resolve2(workspace(man, m2));
  const r2 = resolve2(path);
  if (!(r2 === ws || r2.startsWith(ws + "/"))) return void 0;
  const first = r2.slice(ws.length + 1).split("/")[0];
  return first ? Object.values(man.projects).find((p2) => (p2.path || p2.name) === first) : void 0;
}
function parseManifest(text2, path) {
  const d3 = parse(text2);
  const identities = {};
  for (const [id, v2] of Object.entries(d3.identities ?? {}))
    identities[id] = { id, name: v2.name ?? "", email: v2.email ?? "", owner: v2.owner ?? v2.github_owner ?? "", sshKey: v2.ssh_key, urlGlobs: v2.url_globs };
  const projects = {};
  for (const [name2, v2] of Object.entries(d3.projects ?? {}))
    projects[name2] = {
      name: name2,
      kind: v2.kind ?? "git",
      path: v2.path,
      url: v2.url,
      identity: v2.identity,
      profiles: v2.profiles ?? ["all"],
      machines: v2.machines ?? [],
      branch: v2.branch,
      layout: v2.layout ?? "plain",
      postClone: v2.post_clone,
      description: v2.description,
      handoff: v2.handoff ?? {},
      sync: v2.sync ?? {}
    };
  return { workspaceRoot: d3.workspace?.root ?? "~/dev", defaultBranch: d3.workspace?.default_branch ?? "master", identities, projects, schemaVersion: d3.schema_version ?? 1, path };
}
function validate(m2) {
  const errs = [];
  if (m2.schemaVersion > SUPPORTED_SCHEMA) errs.push(`projects.toml schema_version ${m2.schemaVersion} > supported ${SUPPORTED_SCHEMA}; run cs self-update`);
  for (const i of Object.values(m2.identities)) if (!i.owner && !i.urlGlobs?.length) errs.push(`identity ${i.id}: needs owner (GitHub user/org)`);
  for (const p2 of Object.values(m2.projects)) {
    if (!NAME_RE.test(p2.name)) errs.push(`${p2.name}: invalid project name`);
    if (!KINDS.includes(p2.kind)) errs.push(`${p2.name}: kind must be one of ${KINDS.join("|")}`);
    if (p2.kind === "git") {
      if (!p2.url) errs.push(`${p2.name}: kind=git requires url`);
      if (!p2.identity) errs.push(`${p2.name}: kind=git requires identity`);
      else if (!m2.identities[p2.identity]) errs.push(`${p2.name}: unknown identity '${p2.identity}'`);
      else if (p2.url && !identityMatches(m2.identities[p2.identity], p2.url)) errs.push(`${p2.name}: url ${p2.url} does not match identity '${p2.identity}'`);
    }
    if (p2.path && (isAbsolute2(p2.path) || p2.path.split("/").includes(".."))) errs.push(`${p2.name}: path must be relative and inside the workspace`);
  }
  return errs;
}
function loadManifest(repo) {
  const f = join3(repo, "projects.toml");
  if (!existsSync2(f)) throw new Error(`cs: no projects.toml in ${repo}`);
  const m2 = parseManifest(readFileSync3(f, "utf8"), f);
  const errs = validate(m2);
  if (errs.length) throw new Error("cs: projects.toml invalid:\n  " + errs.join("\n  "));
  return m2;
}
function block(header, values) {
  const clean = {};
  for (const [k3, v2] of Object.entries(values)) if (v2 !== void 0 && v2 !== "" && !(Array.isArray(v2) && !v2.length)) clean[k3] = v2;
  return `[${header}]
` + stringify(clean).trimEnd() + "\n";
}
function projectBlock(p2) {
  return block(`projects.${p2.name}`, {
    kind: p2.kind,
    path: p2.path && p2.path !== p2.name ? p2.path : void 0,
    url: p2.kind === "git" ? p2.url : void 0,
    identity: p2.kind === "git" ? p2.identity : void 0,
    branch: p2.kind === "git" ? p2.branch : void 0,
    profiles: p2.profiles,
    machines: p2.machines,
    layout: p2.layout !== "plain" ? p2.layout : void 0,
    post_clone: p2.postClone,
    description: p2.description
  });
}
function identityBlock(i) {
  return block(`identities.${i.id}`, {
    owner: i.owner,
    name: i.name,
    email: i.email,
    ssh_key: i.sshKey && i.sshKey !== `~/.ssh/cs/${i.id}` ? i.sshKey : void 0,
    url_globs: i.urlGlobs && JSON.stringify(i.urlGlobs) !== JSON.stringify([`git@github.com:${i.owner}/**`]) ? i.urlGlobs : void 0
  });
}
function appendProject(repo, p2) {
  const f = join3(repo, "projects.toml");
  let t = readFileSync3(f, "utf8");
  if (new RegExp(`^\\[projects\\.${p2.name.replace(/[.]/g, "\\.")}\\]\\s*$`, "m").test(t)) throw new Error(`cs: project '${p2.name}' already registered (edit projects.toml to change it)`);
  writeFileSync2(f, t.replace(/\n*$/, "\n\n") + projectBlock(p2));
}
function appendIdentity(repo, i) {
  const f = join3(repo, "projects.toml");
  let t = readFileSync3(f, "utf8");
  if (new RegExp(`^\\[identities\\.${i.id.replace(/[.]/g, "\\.")}\\]\\s*$`, "m").test(t)) throw new Error(`cs: identity '${i.id}' already exists`);
  const marker2 = "# ---- Projects";
  const b3 = identityBlock(i);
  t = t.includes(marker2) ? t.slice(0, t.indexOf(marker2)).replace(/\n*$/, "\n\n") + b3 + "\n" + t.slice(t.indexOf(marker2)) : t.replace(/\n*$/, "\n\n") + b3;
  writeFileSync2(f, t);
}
var SUPPORTED_SCHEMA, NAME_RE, KINDS, keyPath, globs, identityMatches, workspace, container, checkoutRoot, selectedProjects;
var init_manifest = __esm({
  "src/manifest.ts"() {
    "use strict";
    init_dist3();
    init_paths();
    SUPPORTED_SCHEMA = 1;
    NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
    KINDS = ["git", "synced", "local"];
    keyPath = (i) => i.sshKey || `~/.ssh/cs/${i.id}`;
    globs = (i) => i.urlGlobs?.length ? i.urlGlobs : i.owner ? [`git@github.com:${i.owner}/**`] : [];
    identityMatches = (i, url) => globs(i).some((g2) => globMatch(g2, url));
    workspace = (man, m2) => expand(m2?.workspace || man.workspaceRoot);
    container = (p2, ws) => join3(ws, p2.path || p2.name);
    checkoutRoot = (p2, ws) => p2.layout === "worktrees" ? join3(container(p2, ws), "repo") : container(p2, ws);
    selectedProjects = (man, m2) => Object.values(man.projects).filter((p2) => selected(p2, m2));
  }
});

// src/git.ts
import { spawnSync } from "node:child_process";
import { existsSync as existsSync3, statSync } from "node:fs";
import { join as join4, resolve as resolve3, isAbsolute as isAbsolute3 } from "node:path";
function git(args, cwd, opts = {}) {
  const env2 = { ...process.env };
  if (opts.sshKey) env2.GIT_SSH_COMMAND = `ssh -i ${opts.sshKey} -o IdentitiesOnly=yes`;
  const p2 = spawnSync("git", args, { cwd, env: env2, encoding: "utf8", timeout: opts.timeout ? opts.timeout * 1e3 : void 0, input: opts.input, stdio: ["pipe", "pipe", "pipe"] });
  const r2 = { code: p2.status ?? 1, out: (p2.stdout ?? "").trim(), err: (p2.stderr ?? "").trim() };
  if (opts.check !== false && r2.code !== 0) {
    const last = r2.err.split("\n").filter(Boolean).pop() ?? "";
    throw new Error(`cs: git ${args.slice(0, 2).join(" ")} failed in ${cwd ?? "."}
  ${last}`);
  }
  return r2;
}
function version() {
  const v2 = out(["--version"]).split(" ").pop() ?? "0.0.0";
  const [a, b3, c] = v2.split(".").map((x2) => parseInt(x2, 10) || 0);
  return [a, b3, c];
}
function aheadBehind(p2) {
  const s = out(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"], p2);
  if (!s) return void 0;
  const [behind, ahead] = s.split(/\s+/).map((x2) => parseInt(x2, 10));
  return [ahead, behind];
}
function commonDir(p2) {
  const c = out(["rev-parse", "--git-common-dir"], p2);
  return isAbsolute3(c) ? c : resolve3(p2, c);
}
function commit(p2, message, fallbackName = "cs", fallbackEmail = "cs@localhost") {
  const pre = configGet(p2, "user.email") ? [] : ["-c", `user.name=${fallbackName}`, "-c", `user.email=${fallbackEmail}`];
  git([...pre, "commit", "-q", "-m", message], p2);
}
function canonicalGithub(url) {
  let u2 = url.trim();
  if (u2.startsWith("https://github.com/")) u2 = "git@github.com:" + u2.slice("https://github.com/".length);
  else if (u2.startsWith("ssh://git@github.com/")) u2 = "git@github.com:" + u2.slice("ssh://git@github.com/".length);
  else if (u2.startsWith("git@github-") && u2.includes(":")) u2 = "git@github.com:" + u2.split(":").slice(1).join(":");
  if (!u2.endsWith(".git")) u2 += ".git";
  return u2;
}
var out, isRepo, isBare, toplevel, remoteUrl, currentBranch, dirtyCount, isDirty, worktrees, infoExclude, configGet;
var init_git = __esm({
  "src/git.ts"() {
    "use strict";
    out = (args, cwd, dflt = "") => {
      const r2 = git(args, cwd, { check: false });
      return r2.code === 0 ? r2.out : dflt;
    };
    isRepo = (p2) => existsSync3(join4(p2, ".git"));
    isBare = (p2) => existsSync3(join4(p2, "HEAD")) && existsSync3(join4(p2, "objects"));
    toplevel = (p2) => out(["rev-parse", "--show-toplevel"], p2) || void 0;
    remoteUrl = (p2, name2 = "origin") => out(["remote", "get-url", name2], p2);
    currentBranch = (p2) => out(["symbolic-ref", "--short", "-q", "HEAD"], p2);
    dirtyCount = (p2) => {
      const s = out(["status", "--porcelain", "--untracked-files=normal"], p2);
      return s ? s.split("\n").length : 0;
    };
    isDirty = (p2) => dirtyCount(p2) > 0;
    worktrees = (p2) => out(["worktree", "list", "--porcelain"], p2).split("\n").filter((l2) => l2.startsWith("worktree ")).map((l2) => l2.slice(9));
    infoExclude = (p2) => join4(commonDir(p2), "info", "exclude");
    configGet = (p2, key) => out(["config", "--get", key], p2);
  }
});

// src/github.ts
var github_exports = {};
__export(github_exports, {
  GitHubError: () => GitHubError,
  api: () => api,
  createRepo: () => createRepo,
  ensureRepo: () => ensureRepo,
  ensureToken: () => ensureToken,
  getToken: () => getToken,
  ownerType: () => ownerType,
  repoExists: () => repoExists,
  rmToken: () => rmToken,
  setToken: () => setToken,
  tokenFile: () => tokenFile,
  whoami: () => whoami
});
import { chmodSync, existsSync as existsSync4, mkdirSync as mkdirSync2, readFileSync as readFileSync4, unlinkSync, writeFileSync as writeFileSync3 } from "node:fs";
import { join as join5 } from "node:path";
function getToken(owner2) {
  const env2 = process.env[`CS_GITHUB_TOKEN_${owner2.toUpperCase().replace(/-/g, "_")}`];
  if (env2) return env2.trim();
  const f = tokenFile(owner2);
  return existsSync4(f) ? readFileSync4(f, "utf8").trim() || void 0 : void 0;
}
async function setToken(owner2, token2) {
  token2 ||= await password(`GitHub fine-grained token for '${owner2}' (Administration r/w on all repos)`);
  if (!token2) throw new Error("cs: empty token");
  const f = tokenFile(owner2);
  mkdirSync2(join5(csConfigDir(), "tokens"), { recursive: true, mode: 448 });
  writeFileSync3(f, token2 + "\n");
  chmodSync(f, 384);
  return f;
}
function rmToken(owner2) {
  const f = tokenFile(owner2);
  if (existsSync4(f)) unlinkSync(f);
}
async function api(method, path, token2, body) {
  let r2;
  try {
    r2 = await fetch("https://api.github.com" + path, {
      method,
      headers: {
        Authorization: `Bearer ${token2}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "claude-share",
        ...body ? { "Content-Type": "application/json" } : {}
      },
      body: body ? JSON.stringify(body) : void 0,
      signal: AbortSignal.timeout(2e4)
    });
  } catch (e2) {
    throw new GitHubError(`GitHub unreachable: ${e2?.message ?? e2}`);
  }
  const text2 = await r2.text();
  if (!r2.ok) {
    let msg = "";
    try {
      msg = JSON.parse(text2).message ?? "";
    } catch {
    }
    throw new GitHubError(`GitHub ${method} ${path}: ${r2.status} ${msg}`.trim());
  }
  return text2 ? JSON.parse(text2) : {};
}
async function repoExists(o2, n, t) {
  try {
    await api("GET", `/repos/${o2}/${n}`, t);
    return true;
  } catch (e2) {
    if (String(e2).includes(" 404")) return false;
    throw e2;
  }
}
async function createRepo(o2, n, t, priv = true, description = "") {
  const body = { name: n, private: priv, description, auto_init: false };
  if (await ownerType(o2, t) === "Organization") return api("POST", `/orgs/${o2}/repos`, t, body);
  const me2 = await whoami(t);
  if (me2.toLowerCase() !== o2.toLowerCase()) throw new GitHubError(`token belongs to '${me2}', cannot create repos for user '${o2}'`);
  return api("POST", "/user/repos", t, body);
}
async function ensureToken(owner2, interactive = true) {
  const t = getToken(owner2);
  if (t) return t;
  if (!interactive) throw new GitHubError(`no GitHub token for '${owner2}' \u2014 run cs token set ${owner2}`);
  await setToken(owner2);
  const tok = getToken(owner2);
  const me2 = await whoami(tok);
  if (await ownerType(owner2, tok) === "User" && me2.toLowerCase() !== owner2.toLowerCase()) throw new GitHubError(`token authenticates as '${me2}', not '${owner2}'`);
  return tok;
}
async function ensureRepo(o2, n, t, priv = true, description = "") {
  if (await repoExists(o2, n, t)) return false;
  await createRepo(o2, n, t, priv, description);
  return true;
}
var GitHubError, tokenFile, whoami, ownerType;
var init_github = __esm({
  "src/github.ts"() {
    "use strict";
    init_paths();
    init_ui();
    GitHubError = class extends Error {
    };
    tokenFile = (owner2) => join5(csConfigDir(), "tokens", owner2.toLowerCase());
    whoami = async (t) => (await api("GET", "/user", t)).login;
    ownerType = async (o2, t) => (await api("GET", `/users/${o2}`, t)).type;
  }
});

// src/master.ts
var master_exports = {};
__export(master_exports, {
  KEY: () => KEY,
  canAccess: () => canAccess,
  configureRepo: () => configureRepo,
  ensureKey: () => ensureKey,
  httpsUrl: () => httpsUrl,
  instructions: () => instructions,
  isPublic: () => isPublic,
  keyPath: () => keyPath2,
  parseRepoUrl: () => parseRepoUrl,
  registerDeployKey: () => registerDeployKey,
  setup: () => setup
});
import { chmodSync as chmodSync2, existsSync as existsSync5, mkdirSync as mkdirSync3, readFileSync as readFileSync5 } from "node:fs";
import { dirname as dirname2 } from "node:path";
import { spawnSync as spawnSync2 } from "node:child_process";
function ensureKey(machine = "") {
  const key = keyPath2(), pubf = key + ".pub";
  if (existsSync5(key) && existsSync5(pubf)) return { key, pub: readFileSync5(pubf, "utf8").trim(), created: false };
  mkdirSync3(dirname2(key), { recursive: true, mode: 448 });
  const p2 = spawnSync2("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", `cs:${machine || nodename()}:master`, "-f", key]);
  if (p2.status !== 0) throw new Error("cs: ssh-keygen failed");
  chmodSync2(key, 384);
  return { key, pub: readFileSync5(pubf, "utf8").trim(), created: true };
}
function parseRepoUrl(text2) {
  const t = text2.trim().replace(/\/+$/, "");
  const m2 = t.match(/^(?:https?:\/\/|ssh:\/\/git@|git@)?(?:www\.)?github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  return m2 ? [`git@github.com:${m2[1]}/${m2[2]}.git`, [m2[1], m2[2]]] : [t, void 0];
}
function isPublic(url) {
  if (!url.startsWith("https://") || process.env.CS_OFFLINE) return void 0;
  const p2 = spawnSync2("git", ["ls-remote", "--exit-code", url, "HEAD"], { encoding: "utf8", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }, timeout: 3e4, stdio: ["ignore", "pipe", "pipe"] });
  if (p2.status === 0) return true;
  return /Authentication failed|could not read Username|Repository not found/.test(p2.stderr ?? "") ? false : void 0;
}
function canAccess(sshUrl) {
  const p2 = spawnSync2("git", ["ls-remote", sshUrl, "HEAD"], {
    encoding: "utf8",
    timeout: 3e4,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_SSH_COMMAND: `ssh -i ${keyPath2()} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new` }
  });
  return [p2.status === 0, (p2.stderr ?? "").trim().split("\n").pop() ?? ""];
}
async function registerDeployKey(owner2, repo, pub, title) {
  const tok = getToken(owner2);
  if (!tok || process.env.CS_OFFLINE) return void 0;
  try {
    const keys = await api("GET", `/repos/${owner2}/${repo}/keys`, tok);
    if (keys.some((k3) => (k3.key ?? "").split(" ").slice(0, 2).join(" ") === pub.split(" ").slice(0, 2).join(" "))) return "already a deploy key";
    await api("POST", `/repos/${owner2}/${repo}/keys`, tok, { title, key: pub, read_only: false });
    return "registered as deploy key (write)";
  } catch (e2) {
    return `could not register via API: ${e2.message}`;
  }
}
function instructions(pub, gh, machine) {
  const lines = [];
  if (gh) lines.push(`${cyan(`https://github.com/${gh[0]}/${gh[1]}/settings/keys/new`)}  ${dim('\u2192 deploy key, tick "Allow write access"')}`, "");
  lines.push(`title  ${bold(`cs:${machine}:master`)}`, `key    ${bold(pub)}`, "", dim("this key only reaches the config repo; identities get their own keys"));
  note(lines, "Add this machine's master key to the config repo");
}
async function setup(repoDir2, interactive = true) {
  const url = remoteUrl(repoDir2);
  if (!url) {
    warn("config repo has no remote");
    return 1;
  }
  const [sshUrl, gh] = parseRepoUrl(url);
  const { pub, created } = ensureKey();
  kv("master key", KEY + (created ? "  (generated)" : ""));
  let [ok2] = canAccess(sshUrl);
  while (!ok2) {
    instructions(pub, gh, (await Promise.resolve().then(() => (init_config(), config_exports))).loadMachine().name);
    if (!interactive || !await proceed("added the key?")) return 1;
    [ok2] = canAccess(sshUrl);
  }
  if (sshUrl !== url) git(["remote", "set-url", "origin", sshUrl], repoDir2);
  configureRepo(repoDir2);
  ok(`config repo uses the master key (${sshUrl})`);
  return 0;
}
var KEY, keyPath2, httpsUrl, configureRepo;
var init_master = __esm({
  "src/master.ts"() {
    "use strict";
    init_git();
    init_github();
    init_paths();
    init_ui();
    KEY = "~/.ssh/cs/master";
    keyPath2 = () => expand(KEY);
    httpsUrl = (o2, r2) => `https://github.com/${o2}/${r2}.git`;
    configureRepo = (repoDir2) => git(["config", "core.sshCommand", `ssh -i ${KEY} -o IdentitiesOnly=yes`], repoDir2);
  }
});

// src/jsonmerge.ts
function deepMerge(base, over, path = "") {
  if (isObj(base) && isObj(over)) {
    const out2 = { ...base };
    for (const [k3, v2] of Object.entries(over)) out2[k3] = k3 in base ? deepMerge(base[k3], v2, path ? `${path}.${k3}` : k3) : v2;
    return out2;
  }
  if (Array.isArray(base) && Array.isArray(over) && UNION.has(path)) {
    const seen = new Set(base.map((x2) => JSON.stringify(x2)));
    const out2 = [...base];
    for (const x2 of over) {
      const k3 = JSON.stringify(x2);
      if (!seen.has(k3)) {
        seen.add(k3);
        out2.push(x2);
      }
    }
    return out2;
  }
  return over;
}
function diffKeys(a, b3, prefix = "") {
  const out2 = [];
  for (const k3 of [.../* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b3)])].sort()) {
    const p2 = prefix ? `${prefix}.${k3}` : k3;
    if (!(k3 in a) || !(k3 in b3)) out2.push(p2);
    else if (isObj(a[k3]) && isObj(b3[k3])) out2.push(...diffKeys(a[k3], b3[k3], p2));
    else if (JSON.stringify(a[k3]) !== JSON.stringify(b3[k3])) out2.push(p2);
  }
  return out2;
}
var UNION, isObj, mergeLayers, dumps, loads;
var init_jsonmerge = __esm({
  "src/jsonmerge.ts"() {
    "use strict";
    UNION = /* @__PURE__ */ new Set(["permissions.allow", "permissions.deny", "permissions.ask", "permissions.additionalDirectories", "enabledMcpjsonServers", "disabledMcpjsonServers"]);
    isObj = (x2) => !!x2 && typeof x2 === "object" && !Array.isArray(x2);
    mergeLayers = (...layers) => layers.reduce((acc, l2) => deepMerge(acc, l2), {});
    dumps = (o2) => JSON.stringify(o2, null, 2) + "\n";
    loads = (t) => t.trim() ? JSON.parse(t) : {};
  }
});

// src/apply.ts
var apply_exports = {};
__export(apply_exports, {
  applyGit: () => applyGit,
  applyLinks: () => applyLinks,
  applySettings: () => applySettings,
  applyShellRc: () => applyShellRc,
  renderGitIncludes: () => renderGitIncludes,
  renderSettings: () => renderSettings,
  runApply: () => runApply,
  settingsLayers: () => settingsLayers
});
import { existsSync as existsSync6, lstatSync, mkdirSync as mkdirSync4, readdirSync, readFileSync as readFileSync6, readlinkSync, renameSync, rmSync, statSync as statSync2, symlinkSync, unlinkSync as unlinkSync2, writeFileSync as writeFileSync4, copyFileSync } from "node:fs";
import { basename, dirname as dirname3, join as join6, resolve as resolve4 } from "node:path";
function backup(target) {
  const d3 = join6(stateDir(), "backups", stamp());
  mkdirSync4(d3, { recursive: true });
  const dest = join6(d3, basename(target));
  if (statSync2(target).isDirectory()) renameSync(target, dest);
  else {
    copyFileSync(target, dest);
    unlinkSync2(target);
  }
}
function mergeDirInto(src, dst) {
  const walk2 = (dir) => {
    for (const e2 of readdirSync(dir, { withFileTypes: true })) {
      const f = join6(dir, e2.name);
      if (e2.isDirectory()) walk2(f);
      else {
        const rel = f.slice(dst.length + 1);
        const t = join6(src, rel);
        if (!existsSync6(t)) {
          mkdirSync4(dirname3(t), { recursive: true });
          renameSync(f, t);
        }
      }
    }
  };
  walk2(dst);
  rmSync(dst, { recursive: true, force: true });
}
function link(src, dst, check, changes) {
  if (isLink(dst)) {
    if (resolve4(dirname3(dst), readlinkSync(dst)) === resolve4(src)) return;
    changes.push(`relink ${contract(dst)}`);
    if (!check) {
      unlinkSync2(dst);
      symlinkSync(src, dst);
    }
    return;
  }
  if (existsSync6(dst)) {
    if (statSync2(dst).isDirectory()) {
      changes.push(`adopt ${contract(dst)} \u2192 ${contract(src)} (merge)`);
      if (!check) {
        mkdirSync4(src, { recursive: true });
        mergeDirInto(src, dst);
        symlinkSync(src, dst);
      }
    } else if (!existsSync6(src)) {
      changes.push(`adopt ${contract(dst)} \u2192 ${contract(src)}`);
      if (!check) {
        mkdirSync4(dirname3(src), { recursive: true });
        renameSync(dst, src);
        symlinkSync(src, dst);
      }
    } else {
      changes.push(`replace ${contract(dst)} (backup kept)`);
      if (!check) {
        backup(dst);
        symlinkSync(src, dst);
      }
    }
    return;
  }
  if (!existsSync6(src)) return;
  changes.push(`link ${contract(dst)}`);
  if (!check) {
    mkdirSync4(dirname3(dst), { recursive: true });
    symlinkSync(src, dst);
  }
}
function settingsLayers(repo, m2) {
  const names = ["settings.base.json", ...m2.profiles.map((p2) => `settings.${p2}.json`), `settings.${m2.name}.json`];
  return names.filter((n) => existsSync6(join6(repo, "claude", n))).map((n) => [n, loads(readFileSync6(join6(repo, "claude", n), "utf8"))]);
}
function applySettings(repo, m2, check, changes) {
  if (!settingsLayers(repo, m2).length) return;
  const target = join6(claudeDir(), "settings.json");
  const desired = renderSettings(repo, m2);
  const current = existsSync6(target) ? loads(readFileSync6(target, "utf8")) : {};
  if (JSON.stringify(current) === JSON.stringify(desired)) return;
  const keys = diffKeys(current, desired);
  changes.push(`settings.json: ${keys.slice(0, 8).join(", ")}${keys.length > 8 ? " \u2026" : ""}`);
  if (!check) {
    mkdirSync4(claudeDir(), { recursive: true });
    if (existsSync6(target)) {
      const d3 = join6(stateDir(), "backups", stamp());
      mkdirSync4(d3, { recursive: true });
      copyFileSync(target, join6(d3, "settings.json"));
    }
    writeFileSync4(target, dumps(desired));
  }
}
function applyLinks(repo, check, changes) {
  const cdir = claudeDir();
  mkdirSync4(cdir, { recursive: true });
  for (const item of LINK_ITEMS) link(join6(repo, "claude", item), join6(cdir, item), check, changes);
  const skills = join6(repo, "claude", "skills");
  if (existsSync6(skills)) {
    mkdirSync4(join6(cdir, "skills"), { recursive: true });
    for (const e2 of readdirSync(skills, { withFileTypes: true })) if (e2.isDirectory()) link(join6(skills, e2.name), join6(cdir, "skills", e2.name), check, changes);
  }
  link(join6(repo, "plans"), join6(cdir, "plans"), check, changes);
}
function renderGitIncludes(man) {
  const gdir = join6(home(), ".config", "git");
  const files = {};
  const inc = ["# generated by `cs apply` \u2014 do not edit; edit projects.toml [identities] instead"];
  for (const i of Object.values(man.identities)) {
    files[join6(gdir, `identity-${i.id}.inc`)] = [
      `# identity '${i.id}' (generated by cs apply)`,
      "[user]",
      `	name = ${i.name}`,
      `	email = ${i.email}`,
      "[core]",
      `	sshCommand = ssh -i ${contract(expand(keyPath(i)))} -o IdentitiesOnly=yes`
    ].join("\n") + "\n";
    for (const g2 of globs(i)) inc.push(`[includeIf "hasconfig:remote.*.url:${g2}"]`, `	path = identity-${i.id}.inc`);
  }
  files[join6(gdir, "claude-share.inc")] = inc.join("\n") + "\n";
  return files;
}
function applyGit(man, check, changes) {
  const gdir = join6(home(), ".config", "git");
  const wanted = renderGitIncludes(man);
  if (existsSync6(gdir)) {
    for (const f of readdirSync(gdir)) if (/^identity-.*\.inc$/.test(f) && !(join6(gdir, f) in wanted)) {
      changes.push(`remove stale ${contract(join6(gdir, f))}`);
      if (!check) unlinkSync2(join6(gdir, f));
    }
  }
  for (const [f, content] of Object.entries(wanted)) {
    if (existsSync6(f) && readFileSync6(f, "utf8") === content) continue;
    changes.push(`write ${contract(f)}`);
    if (!check) {
      mkdirSync4(gdir, { recursive: true });
      writeFileSync4(f, content);
    }
  }
  const gc = join6(home(), ".gitconfig");
  const text2 = existsSync6(gc) ? readFileSync6(gc, "utf8") : "";
  const block2 = `${GIT_MARK}
[include]
	path = ~/.config/git/claude-share.inc
${GIT_END}
`;
  const next = text2.includes(GIT_MARK) ? text2.slice(0, text2.indexOf(GIT_MARK)) + block2 + text2.slice(text2.indexOf(GIT_END) + GIT_END.length + 1) : text2 + (text2 && !text2.endsWith("\n") ? "\n" : "") + block2;
  if (next !== text2) {
    changes.push("~/.gitconfig: include claude-share.inc");
    if (!check) writeFileSync4(gc, next);
  }
}
function applyShellRc(check, changes) {
  const rc = shellRc();
  const sh2 = contract(join6(toolRoot(), "shell", "cs.sh"));
  const block2 = `${GIT_MARK}
[ -f "${sh2}" ] && . "${sh2}"
${GIT_END}
`;
  const text2 = existsSync6(rc) ? readFileSync6(rc, "utf8") : "";
  const next = text2.includes(GIT_MARK) ? text2.slice(0, text2.indexOf(GIT_MARK)) + block2 + text2.slice(text2.indexOf(GIT_END) + GIT_END.length + 1) : text2 + (text2 && !text2.endsWith("\n") ? "\n" : "") + block2;
  if (next !== text2) {
    changes.push(`${contract(rc)}: source shell/cs.sh (claude() wrapper, PATH)`);
    if (!check) writeFileSync4(rc, next);
  }
}
function runApply(repo, m2, man, check = false) {
  const changes = [];
  applySettings(repo, m2, check, changes);
  applyLinks(repo, check, changes);
  applyGit(man, check, changes);
  applyShellRc(check, changes);
  for (const c of changes) check ? info(c) : step(c);
  if (!changes.length) ok("~/.claude up to date");
  return changes;
}
var LINK_ITEMS, GIT_MARK, GIT_END, stamp, isLink, renderSettings;
var init_apply = __esm({
  "src/apply.ts"() {
    "use strict";
    init_paths();
    init_platform();
    init_manifest();
    init_jsonmerge();
    init_ui();
    LINK_ITEMS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json"];
    GIT_MARK = "# >>> claude-share >>>";
    GIT_END = "# <<< claude-share <<<";
    stamp = () => (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").slice(0, 15);
    isLink = (p2) => {
      try {
        return lstatSync(p2).isSymbolicLink();
      } catch {
        return false;
      }
    };
    renderSettings = (repo, m2) => mergeLayers(...settingsLayers(repo, m2).map(([, d3]) => d3));
  }
});

// src/link.ts
var link_exports = {};
__export(link_exports, {
  checkouts: () => checkouts,
  ensureExclude: () => ensureExclude,
  memoryDir: () => memoryDir,
  runLink: () => runLink,
  sideStore: () => sideStore,
  syncProject: () => syncProject
});
import { existsSync as existsSync7, mkdirSync as mkdirSync5, readdirSync as readdirSync2, readFileSync as readFileSync7, renameSync as renameSync2, statSync as statSync3, unlinkSync as unlinkSync3, utimesSync, writeFileSync as writeFileSync5 } from "node:fs";
import { dirname as dirname4, join as join7, relative as relative2 } from "node:path";
function checkouts(p2, ws) {
  const root = checkoutRoot(p2, ws);
  if (!existsSync7(root)) return [];
  if (p2.kind !== "git" || !isRepo(root)) return [root];
  const w2 = worktrees(root);
  return w2.length ? w2 : [root];
}
function walk(dir, fn, skipDir, base = dir) {
  if (!existsSync7(dir)) return;
  for (const e2 of readdirSync2(dir, { withFileTypes: true })) {
    const f = join7(dir, e2.name);
    const rel = relative2(base, f);
    if (e2.isDirectory()) {
      if (!skipDir?.(rel)) walk(f, fn, skipDir, base);
    } else if (e2.isFile()) fn(rel);
  }
}
function managedRels(base) {
  const rels = /* @__PURE__ */ new Set();
  for (const f of ROOT_FILES) if (existsSync7(join7(base, f)) && statSync3(join7(base, f)).isFile()) rels.add(f);
  walk(join7(base, ".claude"), (rel) => {
    if (rel !== "settings.json") rels.add(".claude/" + rel);
  }, (rel) => SKIP_UNDER_CLAUDE.has(rel.split("/")[0]));
  return rels;
}
function sideRels(side) {
  const rels = /* @__PURE__ */ new Set();
  walk(side, (rel) => rels.add(rel), (rel) => NOT_SYNCED.has(rel.split("/")[0]));
  return rels;
}
function normalize(rel, data) {
  if (rel !== SETTINGS_LOCAL) return data;
  try {
    const d3 = JSON.parse(data.toString("utf8") || "{}");
    delete d3.autoMemoryDirectory;
    return Buffer.from(Object.keys(d3).length ? dumps(d3) : "");
  } catch {
    return data;
  }
}
function localize(rel, data, mem) {
  if (rel !== SETTINGS_LOCAL) return data;
  let d3 = {};
  try {
    d3 = data.toString("utf8").trim() ? JSON.parse(data.toString("utf8")) : {};
  } catch {
  }
  d3.autoMemoryDirectory = contract(mem);
  return Buffer.from(dumps(d3));
}
function write(path, data, mtime) {
  mkdirSync5(dirname4(path), { recursive: true });
  const tmp = path + ".cs-tmp";
  writeFileSync5(tmp, data);
  if (mtime) utimesSync(tmp, mtime, mtime);
  renameSync2(tmp, path);
}
function ensureExclude(checkout, check, changes) {
  if (!existsSync7(join7(checkout, ".git"))) return;
  const ex = infoExclude(checkout);
  const text2 = existsSync7(ex) ? readFileSync7(ex, "utf8") : "";
  const missing = EXCLUDE_LINES.filter((l2) => !text2.split("\n").includes(l2));
  if (!missing.length) return;
  changes.push(`exclude ${missing.join(", ")} in ${contract(checkout)}`);
  if (!check) {
    mkdirSync5(dirname4(ex), { recursive: true });
    writeFileSync5(ex, text2 + (!text2 || text2.endsWith("\n") ? "" : "\n") + "# claude-share managed files\n" + missing.join("\n") + "\n");
  }
}
function syncProject(repo, p2, ws, check = false) {
  const changes = [];
  const side = sideStore(repo, p2);
  const targets = checkouts(p2, ws);
  if (!targets.length) return changes;
  const mem = memoryDir(repo, p2);
  if (!existsSync7(mem) && !check) mkdirSync5(mem, { recursive: true });
  const previously = loadState(p2);
  const all = new Set(sideRels(side));
  for (const t of targets) for (const r2 of managedRels(t)) all.add(r2);
  all.add(SETTINGS_LOCAL);
  const final = /* @__PURE__ */ new Set();
  for (const rel of [...all].sort()) {
    const sp = join7(side, rel);
    const sideExists = existsSync7(sp) && statSync3(sp).isFile();
    const sideData = sideExists ? normalize(rel, readFileSync7(sp)) : void 0;
    const sideMtime = sideExists ? statSync3(sp).mtimeMs / 1e3 : -1;
    let best = sideData, bestM = sideMtime, from = "side-store";
    for (const t of targets) {
      const tp = join7(t, rel);
      if (existsSync7(tp) && statSync3(tp).isFile()) {
        const d3 = normalize(rel, readFileSync7(tp));
        const mt = statSync3(tp).mtimeMs / 1e3;
        if ((!best || !d3.equals(best)) && mt > bestM + 1e-6) {
          best = d3;
          bestM = mt;
          from = contract(t);
        }
      }
    }
    if (!sideExists && previously.has(rel) && rel !== SETTINGS_LOCAL) {
      for (const t of targets) {
        const tp = join7(t, rel);
        if (existsSync7(tp)) {
          changes.push(`remove ${rel} from ${contract(t)} (deleted in side-store)`);
          if (!check) unlinkSync3(tp);
        }
      }
      continue;
    }
    if (best === void 0) {
      if (rel === SETTINGS_LOCAL) {
        best = Buffer.alloc(0);
        bestM = sideMtime;
      } else continue;
    }
    if ((!sideData || !best.equals(sideData)) && (best.length || rel !== SETTINGS_LOCAL)) {
      changes.push(`side-store \u2190 ${rel} (from ${from})`);
      if (!check) write(sp, best, bestM > 0 ? bestM : void 0);
    }
    if (best.length || rel !== SETTINGS_LOCAL) final.add(rel);
    for (const t of targets) {
      const tp = join7(t, rel);
      const want = localize(rel, best, mem);
      const have = existsSync7(tp) && statSync3(tp).isFile() ? readFileSync7(tp) : void 0;
      if (!have || !have.equals(want)) {
        changes.push(`${contract(t)}/${rel} \u2190 side-store`);
        if (!check) write(tp, want, bestM > 0 ? bestM : void 0);
      }
    }
  }
  for (const t of targets) ensureExclude(t, check, changes);
  if (!check) saveState(p2, final);
  return changes;
}
function runLink(repo, m2, man, names = [], check = false) {
  const ws = workspace(man, m2);
  const unknown = names.filter((n) => !man.projects[n]);
  if (unknown.length) throw new Error(`cs: unknown project(s): ${unknown.join(", ")}`);
  let total = 0;
  for (const p2 of selectedProjects(man, m2)) {
    if (names.length && !names.includes(p2.name)) continue;
    if (!checkouts(p2, ws).length) continue;
    const ch = syncProject(repo, p2, ws, check);
    for (const c of ch) check ? info(`${p2.name}: ${c}`) : step(`${p2.name}: ${c}`);
    total += ch.length;
  }
  if (!total) ok("project files in sync");
  return total;
}
var ROOT_FILES, SKIP_UNDER_CLAUDE, EXCLUDE_LINES, SETTINGS_LOCAL, NOT_SYNCED, sideStore, memoryDir, stateFile, loadState, saveState;
var init_link = __esm({
  "src/link.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_manifest();
    init_jsonmerge();
    init_ui();
    ROOT_FILES = ["CLAUDE.md", "CLAUDE.local.md", ".mcp.json"];
    SKIP_UNDER_CLAUDE = /* @__PURE__ */ new Set(["worktrees", "plans", "settings.json"]);
    EXCLUDE_LINES = [".claude/", ".mcp.json", "CLAUDE.md", "CLAUDE.local.md"];
    SETTINGS_LOCAL = ".claude/settings.local.json";
    NOT_SYNCED = /* @__PURE__ */ new Set(["memory", "secrets"]);
    sideStore = (repo, p2) => join7(repo, "projects", p2.name);
    memoryDir = (repo, p2) => join7(sideStore(repo, p2), "memory");
    stateFile = (p2) => join7(stateDir(), "link", `${p2.name}.json`);
    loadState = (p2) => {
      try {
        return new Set(JSON.parse(readFileSync7(stateFile(p2), "utf8")).files);
      } catch {
        return /* @__PURE__ */ new Set();
      }
    };
    saveState = (p2, files) => {
      mkdirSync5(dirname4(stateFile(p2)), { recursive: true });
      writeFileSync5(stateFile(p2), JSON.stringify({ files: [...files].sort() }, null, 2));
    };
  }
});

// src/deps.ts
var deps_exports = {};
__export(deps_exports, {
  runDeps: () => runDeps,
  which: () => which
});
import { chmodSync as chmodSync3, copyFileSync as copyFileSync2, existsSync as existsSync8, mkdirSync as mkdirSync6, rmSync as rmSync2 } from "node:fs";
import { join as join8 } from "node:path";
import { spawnSync as spawnSync3 } from "node:child_process";
import { arch } from "node:os";
function which(cmd) {
  for (const d3 of [...(process.env.PATH ?? "").split(":"), BIN()]) if (d3 && existsSync8(join8(d3, cmd))) return join8(d3, cmd);
  return void 0;
}
async function latest(repo) {
  const r2 = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { "User-Agent": "claude-share" } });
  return (await r2.json()).tag_name;
}
async function download(url, dest) {
  const r2 = await fetch(url, { headers: { "User-Agent": "claude-share" } });
  if (!r2.ok) throw new Error(`download failed: ${url}`);
  const { writeFileSync: writeFileSync15 } = await import("node:fs");
  writeFileSync15(dest, Buffer.from(await r2.arrayBuffer()));
}
async function sopsLinux() {
  const t = await latest("getsops/sops");
  mkdirSync6(BIN(), { recursive: true });
  await download(`https://github.com/getsops/sops/releases/download/${t}/sops-${t}.linux.${a64()}`, join8(BIN(), "sops"));
  chmodSync3(join8(BIN(), "sops"), 493);
}
async function ageLinux() {
  const t = await latest("FiloSottile/age");
  const tmp = join8(home(), ".cache", "cs-age");
  mkdirSync6(tmp, { recursive: true });
  const tgz = join8(tmp, "age.tgz");
  await download(`https://github.com/FiloSottile/age/releases/download/${t}/age-${t}-linux-${a64()}.tar.gz`, tgz);
  sh(`tar -xzf ${tgz} -C ${tmp}`);
  mkdirSync6(BIN(), { recursive: true });
  for (const n of ["age", "age-keygen"]) {
    copyFileSync2(join8(tmp, "age", n), join8(BIN(), n));
    chmodSync3(join8(BIN(), n), 493);
  }
  rmSync2(tmp, { recursive: true, force: true });
}
async function runDeps(install = false, compact = false) {
  const rows = [];
  let missingRequired = false;
  const apt = [];
  const present = [];
  const installed = [];
  const optional = [];
  for (const [name2, it] of Object.entries(CATALOG)) {
    let path = which(it.cmd);
    if (path) {
      rows.push([green("\u2713"), name2, dim(ver(it.ver).slice(0, 40))]);
      present.push(name2);
      continue;
    }
    const inst = isMac() ? it.mac : it.linux;
    if (install && inst) {
      try {
        await spin(`installing ${name2}\u2026`, async () => inst());
        path = which(it.cmd);
      } catch (e2) {
        warn(`${name2}: install failed: ${e2.message}`);
      }
    }
    if (path) {
      rows.push([green("\u2713"), name2, dim("installed")]);
      installed.push(name2);
      continue;
    }
    if (it.required) missingRequired = true;
    if (!isMac() && it.apt) apt.push(it.apt);
    if (!it.required) optional.push(name2 + (it.apt && !isMac() ? ` (sudo apt install -y ${it.apt})` : it.mac ? ` (brew install ${name2})` : ""));
    rows.push([it.required ? red("\u2717") : yellow("!"), name2, dim("missing")]);
  }
  if (compact) {
    step(`${present.length + installed.length} tools ready${installed.length ? ` (installed ${installed.join(", ")})` : ""}`);
    if (optional.length) step(`optional: ${optional.join(", ")}`);
    for (const r2 of rows) if (r2[0].includes("\u2717")) step(`missing: ${r2[1]}`);
  } else {
    table(rows);
    if (optional.length) info(dim("optional: " + optional.join(", ")));
  }
  if (missingRequired && apt.length) info(bold("sudo apt install -y " + apt.join(" ")));
  if (!install && !compact && rows.some((r2) => !r2[0].includes("\u2713"))) info(dim("cs deps --install  installs the user-local ones (age, sops, claude)"));
  if (!(process.env.PATH ?? "").split(":").includes(BIN())) warn(`${contract(BIN())} is not on PATH (cs apply adds it to your shell rc)`);
  return missingRequired ? 1 : 0;
}
var BIN, ver, a64, sh, brew, CATALOG;
var init_deps = __esm({
  "src/deps.ts"() {
    "use strict";
    init_paths();
    init_platform();
    init_ui();
    BIN = () => join8(home(), ".local", "bin");
    ver = (args) => {
      const p2 = spawnSync3(args[0], args.slice(1), { encoding: "utf8", timeout: 1e4 });
      return ((p2.stdout || p2.stderr || "").split("\n")[0] ?? "").trim();
    };
    a64 = () => ["arm64", "aarch64"].includes(arch()) ? "arm64" : "amd64";
    sh = (cmd) => {
      const p2 = spawnSync3("bash", ["-lc", cmd], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      if (p2.status !== 0) throw new Error(`command failed: ${cmd}
${(p2.stderr || p2.stdout || "").trim().split("\n").slice(-5).join("\n")}`);
    };
    brew = (pkg2) => async () => sh(`brew install ${pkg2}`);
    CATALOG = {
      git: { cmd: "git", ver: ["git", "--version"], mac: brew("git"), required: true, apt: "git" },
      curl: { cmd: "curl", ver: ["curl", "--version"], required: true, apt: "curl" },
      ssh: { cmd: "ssh", ver: ["ssh", "-V"], required: true, apt: "openssh-client" },
      age: { cmd: "age", ver: ["age", "--version"], linux: ageLinux, mac: brew("age"), required: true },
      sops: { cmd: "sops", ver: ["sops", "--version"], linux: sopsLinux, mac: brew("sops"), required: true },
      node: { cmd: "node", ver: ["node", "--version"], required: true },
      gh: { cmd: "gh", ver: ["gh", "--version"], mac: brew("gh"), required: false, apt: "gh" },
      claude: { cmd: "claude", ver: ["claude", "--version"], linux: async () => sh("curl -fsSL https://claude.ai/install.sh | bash"), mac: async () => sh("curl -fsSL https://claude.ai/install.sh | bash"), required: true }
    };
  }
});

// src/doctor.ts
var doctor_exports = {};
__export(doctor_exports, {
  fix: () => fix,
  runDoctor: () => runDoctor
});
import { existsSync as existsSync9, lstatSync as lstatSync2, readFileSync as readFileSync8 } from "node:fs";
import { join as join9 } from "node:path";
function fix(repo, m2, man) {
  const ws = workspace(man, m2);
  for (const p2 of selectedProjects(man, m2)) {
    const root = checkoutRoot(p2, ws);
    if (p2.kind !== "git" || !existsSync9(root) || !isRepo(root) || !p2.url) continue;
    const url = remoteUrl(root);
    if (url === p2.url) continue;
    const cur = canonicalGithub(url), want = canonicalGithub(p2.url);
    let same = cur === want;
    const ident2 = p2.identity ? man.identities[p2.identity] : void 0;
    if (!same && ident2 && identityMatches(ident2, cur) && cur.split("/").pop() === want.split("/").pop()) same = true;
    if (same) {
      git(["remote", "set-url", "origin", p2.url], root);
      ok(`${p2.name}: remote url ${url} \u2192 ${p2.url}`);
    } else warn(`${p2.name}: remote ${url} is a different repo than manifest ${p2.url}; not changing it`);
  }
}
function runDoctor(repo, m2, man, doFix = false, compact = false) {
  if (doFix) fix(repo, m2, man);
  const res = [];
  refuseUnsupported();
  res.push(["ok", describe()]);
  res.push(["ok", `node ${process.versions.node}`]);
  const v2 = version();
  res.push(v2[0] > 2 || v2[0] === 2 && v2[1] >= 36 ? ["ok", `git ${v2.join(".")}`] : ["warn", `git ${v2.join(".")} < 2.36: identities fall back to per-repo config`]);
  res.push(which("claude") ? ["ok", `claude at ${which("claude")}`] : ["warn", "claude not on PATH (curl -fsSL https://claude.ai/install.sh | bash)"]);
  const ws = workspace(man, m2);
  res.push(isWSL() && ws.startsWith("/mnt/") ? ["fail", `workspace ${ws} is on the Windows filesystem; use the WSL home`] : ["ok", `workspace ${contract(ws)}`]);
  const broken = LINKS.filter((i) => {
    try {
      return lstatSync2(join9(claudeDir(), i)).isSymbolicLink() && !existsSync9(join9(claudeDir(), i));
    } catch {
      return false;
    }
  });
  res.push(broken.length ? ["fail", "broken links in ~/.claude: " + broken.join(", ") + "  (cs apply)"] : ["ok", "~/.claude links healthy"]);
  const ch = [];
  applySettings(repo, m2, true, ch);
  res.push(ch.length ? ["warn", "settings.json drift: " + ch.join("; ") + "  (cs apply)"] : ["ok", "settings.json rendered"]);
  if (existsSync9(claudeJson())) {
    try {
      const d3 = JSON.parse(readFileSync8(claudeJson(), "utf8"));
      const hits = [];
      for (const [path, e2] of Object.entries(d3.projects ?? {})) for (const [n, c] of Object.entries(e2.mcpServers ?? {})) if (c.env || c.headers) hits.push(`${n}@${contract(path)}`);
      res.push(hits.length ? ["warn", `local-scope MCP servers with secrets in ~/.claude.json (machine-only): ${hits.join(", ")} \u2014 keep until cs secrets provides the \${VAR}s, then \`claude mcp remove <name> -s local\``] : ["ok", "no secret-bearing local-scope MCP servers"]);
    } catch {
      res.push(["warn", "~/.claude.json unparsable"]);
    }
  }
  res.push(process.env.GH_TOKEN || process.env.GITHUB_TOKEN ? ["warn", "GH_TOKEN/GITHUB_TOKEN is exported in this shell; gh ignores its stored logins while set"] : ["ok", "no GH_TOKEN override in env"]);
  const idr = [];
  for (const p2 of selectedProjects(man, m2)) {
    const root = checkoutRoot(p2, ws);
    if (p2.kind !== "git" || !existsSync9(root) || !isRepo(root)) continue;
    const ident2 = p2.identity ? man.identities[p2.identity] : void 0;
    const email2 = configGet(root, "user.email");
    const url = remoteUrl(root);
    if (p2.url && canonicalGithub(url) !== canonicalGithub(p2.url)) idr.push(["warn", `${p2.name}: remote ${url} \u2260 manifest ${p2.url}  (cs doctor --fix)`]);
    else if (url && p2.url && url !== p2.url) idr.push(["warn", `${p2.name}: remote uses alias/other form ${url}; manifest ${p2.url}  (cs doctor --fix)`]);
    if (ident2 && email2 !== ident2.email) idr.push(["fail", `${p2.name}: user.email resolves to '${email2 || "UNSET"}', expected ${ident2.email}`]);
  }
  res.push(...idr.length ? idr : [["ok", "git identities resolve per manifest"]]);
  const sym = { ok: green("\u2713"), warn: yellow("!"), fail: red("\u2717") };
  if (compact) {
    const bad = res.filter(([l2]) => l2 !== "ok");
    if (bad.length) table(bad.map(([l2, msg]) => [sym[l2], msg]));
    step(`${res.length - bad.length} of ${res.length} checks passed`);
  } else table(res.map(([l2, msg]) => [sym[l2], msg]));
  return res.some(([l2]) => l2 === "fail") ? 1 : 0;
}
var LINKS;
var init_doctor = __esm({
  "src/doctor.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_platform();
    init_manifest();
    init_apply();
    init_ui();
    init_deps();
    LINKS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json", "plans"];
  }
});

// src/identity.ts
var identity_exports = {};
__export(identity_exports, {
  add: () => add,
  ls: () => ls,
  rename: () => rename
});
import { existsSync as existsSync10, renameSync as renameSync3, readFileSync as readFileSync9, writeFileSync as writeFileSync6 } from "node:fs";
import { join as join10 } from "node:path";
async function add(repo, m2, man, id, o2) {
  if (!NAME_RE.test(id)) throw new Error(`cs: '${id}' is not a valid identity id`);
  const ident2 = { id, name: o2.name, email: o2.email, owner: o2.owner, sshKey: o2.key };
  appendIdentity(repo, ident2);
  git(["add", "projects.toml"], repo);
  commit(repo, `identities: add ${id}`, "cs", `cs@${m2.name}`);
  step(`identity ${bold(id)}  ${dim(`${o2.name} <${o2.email}> \xB7 github.com/${o2.owner} \xB7 key ${keyPath(ident2)}`)}`);
  const ch = [];
  applyGit(loadManifest(repo), false, ch);
  if (ch.length) step("git identity includes updated");
  if (!existsSync10(expand(keyPath(ident2)))) info(`no key at ${keyPath(ident2)} yet \u2014 cs ssh setup generates and registers it`);
  if (!o2.noToken && !getToken(o2.owner)) {
    info(`a GitHub token for ${o2.owner} lets cs new --${id} create repos:`);
    try {
      await ensureToken(o2.owner);
      ok(`token for ${o2.owner} stored`);
    } catch (e2) {
      warn(`no token stored (${e2.message}); run cs token set ${o2.owner} later`);
    }
  }
  return 0;
}
function rename(repo, m2, man, oldId, newId) {
  if (!man.identities[oldId]) throw new Error(`cs: unknown identity '${oldId}'`);
  if (man.identities[newId] || !NAME_RE.test(newId)) throw new Error(`cs: '${newId}' is taken or invalid`);
  const ident2 = man.identities[oldId];
  const f = join10(repo, "projects.toml");
  let t = readFileSync9(f, "utf8");
  t = t.replace(new RegExp(`^\\[identities\\.${oldId}\\]`, "m"), `[identities.${newId}]`).replace(new RegExp(`^(identity\\s*=\\s*)"${oldId}"`, "mg"), `$1"${newId}"`);
  writeFileSync6(f, t);
  if (!ident2.sshKey) {
    for (const s of ["", ".pub"]) {
      const a = expand(`~/.ssh/cs/${oldId}${s}`), b3 = expand(`~/.ssh/cs/${newId}${s}`);
      if (existsSync10(a)) renameSync3(a, b3);
    }
    step(`~/.ssh/cs/${oldId} \u2192 ~/.ssh/cs/${newId}`);
  }
  for (const d3 of out(["ls-files", `machines/*/ssh/${oldId}.pub`], repo).split("\n").filter(Boolean)) git(["mv", d3, d3.replace(`${oldId}.pub`, `${newId}.pub`)], repo);
  git(["add", "projects.toml"], repo);
  commit(repo, `identities: rename ${oldId} \u2192 ${newId}`, "cs", `cs@${m2.name}`);
  const n = Object.values(man.projects).filter((p2) => p2.identity === oldId).length;
  ok(`identity ${oldId} \u2192 ${newId} (${n} projects updated)`);
  const ch = [];
  applyGit(loadManifest(repo), false, ch);
  for (const c of ch) step(c);
  return 0;
}
function ls(man) {
  const ids = Object.values(man.identities);
  if (!ids.length) {
    info('no identities \u2014 add one: cs identity add personal --owner <github-user> --name ".." --email ..');
    return;
  }
  table(
    ids.map((i) => {
      const n = Object.values(man.projects).filter((p2) => p2.identity === i.id).length;
      const key = expand(keyPath(i));
      return [bold(i.id), `${i.name} <${i.email}>`, i.owner || dim("-"), existsSync10(key) ? keyPath(i) : red(keyPath(i) + " (missing)"), getToken(i.owner) ? green("token \u2713") : dim("no token"), dim(`${n} project${n === 1 ? "" : "s"}`)];
    }),
    ["id", "commits as", "github owner", "ssh key", "", ""]
  );
  info(dim("use as: cs new <name> --<id>   (or --<github owner>)"));
}
var init_identity = __esm({
  "src/identity.ts"() {
    "use strict";
    init_git();
    init_github();
    init_paths();
    init_manifest();
    init_apply();
    init_ui();
  }
});

// src/ssh.ts
var ssh_exports = {};
__export(ssh_exports, {
  githubUserForKey: () => githubUserForKey,
  setup: () => setup2,
  writeSshConfig: () => writeSshConfig
});
import { chmodSync as chmodSync4, existsSync as existsSync11, mkdirSync as mkdirSync7, readFileSync as readFileSync10, writeFileSync as writeFileSync7 } from "node:fs";
import { dirname as dirname5, join as join11 } from "node:path";
import { spawnSync as spawnSync4 } from "node:child_process";
function keygen(key, comment) {
  mkdirSync7(dirname5(key), { recursive: true, mode: 448 });
  const p2 = spawnSync4("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", comment, "-f", key]);
  if (p2.status !== 0) throw new Error("cs: ssh-keygen failed");
  chmodSync4(key, 384);
}
function githubUserForKey(key) {
  if (process.env.CS_OFFLINE) return void 0;
  const p2 = spawnSync4("ssh", ["-T", "-i", key, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new", "-o", "BatchMode=yes", "git@github.com"], { encoding: "utf8", timeout: 2e4, stdio: ["ignore", "pipe", "pipe"] });
  return ((p2.stdout ?? "") + (p2.stderr ?? "")).match(/Hi ([^!]+)!/)?.[1];
}
function writeSshConfig() {
  const cfg = join11(home(), ".ssh", "config");
  const text2 = existsSync11(cfg) ? readFileSync10(cfg, "utf8") : "";
  const block2 = [MARK, "Host github.com", "    IdentitiesOnly yes", "    AddKeysToAgent yes", ...isMac() ? ["    UseKeychain yes"] : [], END].join("\n") + "\n";
  const next = text2.includes(MARK) ? text2.slice(0, text2.indexOf(MARK)) + block2 + text2.slice(text2.indexOf(END) + END.length + 1) : block2 + (text2 && !text2.startsWith("\n") ? "\n" : "") + text2;
  if (next === text2) return false;
  mkdirSync7(dirname5(cfg), { recursive: true, mode: 448 });
  writeFileSync7(cfg, next);
  chmodSync4(cfg, 384);
  return true;
}
async function register(i, pub, title) {
  if (process.env.CS_OFFLINE) return "offline";
  if (!i.owner) return "no owner; add the key manually";
  const tok = getToken(i.owner);
  if (!tok) return `no token for ${i.owner}; add manually: https://github.com/settings/ssh/new`;
  try {
    if (await ownerType(i.owner, tok) !== "User") return `${i.owner} is an organization \u2014 add the key to the user account that belongs to it: https://github.com/settings/ssh/new`;
    const keys = await api("GET", "/user/keys", tok);
    if (keys.some((k3) => (k3.key ?? "").split(" ").slice(0, 2).join(" ") === pub.split(" ").slice(0, 2).join(" "))) return "already registered on GitHub";
    await api("POST", "/user/keys", tok, { title, key: pub });
    return "registered on GitHub";
  } catch (e2) {
    return /403|404/.test(e2.message) ? "token lacks 'Git SSH keys: write' \u2014 add manually: https://github.com/settings/ssh/new" : e2.message;
  }
}
async function setup2(repo, m2, man, checkOnly = false) {
  const ids = Object.values(man.identities);
  if (!ids.length) {
    warn("no identities yet (cs identity add \u2026)");
    return 0;
  }
  const rows = [];
  let published = false;
  const unregistered = [];
  for (const i of ids) {
    const key = expand(keyPath(i)), pubf = key + ".pub";
    const state = [];
    if (!existsSync11(key)) {
      if (checkOnly) {
        rows.push([i.id, keyPath(i), red("missing")]);
        unregistered.push(i);
        continue;
      }
      keygen(key, `cs:${m2.name}:${i.id}`);
      state.push(green("generated"));
    }
    const pub = readFileSync10(pubf, "utf8").trim();
    const dest = join11(repo, "machines", m2.name, "ssh", `${i.id}.pub`);
    if (!checkOnly && (!existsSync11(dest) || readFileSync10(dest, "utf8").trim() !== pub)) {
      mkdirSync7(dirname5(dest), { recursive: true });
      writeFileSync7(dest, pub + "\n");
      git(["add", dest], repo);
      published = true;
    }
    let user = githubUserForKey(key);
    if (user) state.push(green(`github: ${user}`));
    else if (!checkOnly) {
      const r2 = await register(i, pub, `cs:${m2.name}:${i.id}`);
      user = githubUserForKey(key);
      if (user) state.push(green(`github: ${user}`));
      else {
        state.push(yellow(r2.startsWith("registered") ? "registered, not verified yet" : "needs registering"));
        unregistered.push(i);
      }
    } else {
      state.push(yellow("not accepted by GitHub yet"));
      unregistered.push(i);
    }
    rows.push([i.id, keyPath(i), state.join("  ")]);
  }
  if (published) commit(repo, `machines: ${m2.name} ssh public keys`, "cs", `cs@${m2.name}`);
  if (!checkOnly && writeSshConfig()) step("~/.ssh/config: managed block (IdentitiesOnly, AddKeysToAgent)");
  table(rows, ["identity", "key", "state"]);
  for (const i of unregistered) {
    const pubf = expand(keyPath(i)) + ".pub";
    if (!existsSync11(pubf)) continue;
    const who = i.owner && i.owner.toLowerCase() !== i.id.toLowerCase() ? `the ${i.owner} account` : `your GitHub account that is a member of ${i.owner || "the org"}`;
    note([`${cyan("https://github.com/settings/ssh/new")}  ${dim(`\u2192 logged in as ${who}`)}`, "", `title  ${bold(`cs:${m2.name}:${i.id}`)}`, `key    ${bold(readFileSync10(pubf, "utf8").trim())}`], `Add the ${i.id} key`);
  }
  return unregistered.length ? 1 : 0;
}
var MARK, END;
var init_ssh = __esm({
  "src/ssh.ts"() {
    "use strict";
    init_git();
    init_github();
    init_paths();
    init_platform();
    init_manifest();
    init_ui();
    MARK = "# >>> claude-share >>>";
    END = "# <<< claude-share <<<";
  }
});

// src/secrets/sops.ts
var sops_exports = {};
__export(sops_exports, {
  SopsBackend: () => SopsBackend,
  keyFile: () => keyFile,
  machinePubFile: () => machinePubFile,
  publicKey: () => publicKey,
  recipients: () => recipients,
  updatekeys: () => updatekeys,
  writeRecipients: () => writeRecipients
});
import { chmodSync as chmodSync5, copyFileSync as copyFileSync3, existsSync as existsSync12, mkdirSync as mkdirSync8, readdirSync as readdirSync4, readFileSync as readFileSync11, rmSync as rmSync3, writeFileSync as writeFileSync8 } from "node:fs";
import { dirname as dirname6, join as join12, relative as relative3 } from "node:path";
import { spawnSync as spawnSync5 } from "node:child_process";
function sops(args, repo, input, check = true) {
  const p2 = spawnSync5(exe("sops"), args, { cwd: repo, env: env(), encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] });
  if (check && p2.status !== 0) throw new Error(`cs: sops ${args.join(" ")} failed: ${(p2.stderr ?? "").trim()}`);
  return p2;
}
function publicKey() {
  if (!existsSync12(keyFile())) return "";
  const line = readFileSync11(keyFile(), "utf8").split("\n").find((l2) => l2.startsWith("# public key:"));
  if (line) return line.split(":")[1].trim();
  return (spawnSync5(exe("age-keygen"), ["-y", keyFile()], { encoding: "utf8" }).stdout ?? "").trim();
}
function keygen2() {
  mkdirSync8(dirname6(keyFile()), { recursive: true, mode: 448 });
  const p2 = spawnSync5(exe("age-keygen"), ["-o", keyFile()], { encoding: "utf8" });
  if (p2.status !== 0) throw new Error(`cs: age-keygen failed: ${p2.stderr}`);
  chmodSync5(keyFile(), 384);
}
function recipients(repo) {
  const f = join12(repo, ".sops.yaml");
  if (!existsSync12(f)) return [];
  const t = readFileSync11(f, "utf8");
  const m2 = t.match(/age:\s*>-?\s*\n((?:\s+.+\n?)+)/);
  if (m2) return m2[1].replace(/\n/g, " ").split(",").map((x2) => x2.trim()).filter(Boolean);
  const m22 = t.match(/age:\s*(\S.*)/);
  return m22 ? m22[1].split(",").map((x2) => x2.trim()).filter(Boolean) : [];
}
function writeRecipients(repo, recs) {
  writeFileSync8(join12(repo, ".sops.yaml"), `# sops recipients \u2014 managed by cs secrets init / cs enroll / cs revoke
creation_rules:
  - path_regex: ${RULE}
    age: >-
` + recs.map((r2) => `      ${r2}`).join(",\n") + "\n");
}
function envFiles(repo) {
  const out2 = [];
  const rec = (d3) => {
    if (!existsSync12(d3)) return;
    for (const e2 of readdirSync4(d3, { withFileTypes: true })) {
      const f = join12(d3, e2.name);
      e2.isDirectory() ? rec(f) : f.endsWith(".env") && out2.push(f);
    }
  };
  rec(join12(repo, "secrets"));
  return out2.sort();
}
function updatekeys(repo) {
  let n = 0;
  for (const f of envFiles(repo)) if (isEncrypted(f)) {
    sops(["updatekeys", "-y", relative3(repo, f)], repo);
    n++;
  }
  return n;
}
var RULE, keyFile, env, exe, machinePubFile, isEncrypted, SopsBackend;
var init_sops = __esm({
  "src/secrets/sops.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_deps();
    init_secrets();
    init_ui();
    RULE = "^secrets/.*\\.env$";
    keyFile = () => process.env.SOPS_AGE_KEY_FILE || join12(home(), ".config", "sops", "age", "keys.txt");
    env = () => {
      const e2 = { ...process.env, SOPS_AGE_KEY_FILE: keyFile() };
      delete e2.SOPS_AGE_RECIPIENTS;
      return e2;
    };
    exe = (n) => which(n) || join12(home(), ".local", "bin", n);
    machinePubFile = (repo, machine) => join12(repo, "machines", machine, "age.pub");
    isEncrypted = (f) => {
      try {
        return readFileSync11(f, "utf8").includes("sops_version=");
      } catch {
        return false;
      }
    };
    SopsBackend = {
      name: "sops",
      async init(repo, m2) {
        if (existsSync12(keyFile())) skip(`age key present at ${contract(keyFile())}`);
        else {
          keygen2();
          ok(`generated age key ${contract(keyFile())} (0600, never synced)`);
        }
        const pub = publicKey();
        const pf = machinePubFile(repo, m2.name);
        if (!existsSync12(pf) || readFileSync11(pf, "utf8").trim() !== pub) {
          mkdirSync8(dirname6(pf), { recursive: true });
          writeFileSync8(pf, pub + "\n");
          git(["add", relative3(repo, pf)], repo);
          commit(repo, `machines: ${m2.name} age.pub`, "cs", `cs@${m2.name}`);
          ok(`published ${contract(pf)}`);
        }
        const recs = recipients(repo);
        if (!recs.length) {
          writeRecipients(repo, [pub]);
          git(["add", ".sops.yaml"], repo);
          commit(repo, "secrets: first recipient", "cs", `cs@${m2.name}`);
          ok("this is the first machine: registered as the only recipient");
          const hook = join12(repo, ".git", "hooks", "pre-commit"), src = join12(toolRoot(), "hooks", "pre-commit-secrets-guard.sh");
          if (existsSync12(src) && !existsSync12(hook)) {
            copyFileSync3(src, hook);
            chmodSync5(hook, 493);
            ok("installed pre-commit plaintext guard in the config repo");
          }
        } else if (recs.includes(pub)) ok("this machine can decrypt secrets");
        else warn(`this machine is not a recipient yet \u2014 on a machine that is, run: cs enroll ${m2.name}`);
        mkdirSync8(join12(repo, "secrets", "projects"), { recursive: true });
      },
      ready: (repo) => existsSync12(keyFile()) && recipients(repo).includes(publicKey()),
      loadEnv(repo, name2) {
        const f = envFile(repo, name2);
        if (!existsSync12(f)) return {};
        return parseDotenv(sops(["-d", "--input-type", "dotenv", "--output-type", "dotenv", relative3(repo, f)], repo).stdout);
      },
      writeEnv(repo, name2, values) {
        const f = envFile(repo, name2);
        mkdirSync8(dirname6(f), { recursive: true });
        const rel = relative3(repo, f);
        const tmp = join12(dirname6(f), `.${name2.replace(/\//g, "_")}.plain.${process.pid}.env`);
        writeFileSync8(tmp, dumpDotenv(values), { mode: 384 });
        try {
          const p2 = sops(["-e", "--input-type", "dotenv", "--output-type", "dotenv", "--filename-override", rel, relative3(repo, tmp)], repo);
          writeFileSync8(f, p2.stdout);
        } finally {
          rmSync3(tmp, { force: true });
        }
        return f;
      },
      edit(repo, name2) {
        const f = envFile(repo, name2);
        if (!existsSync12(f)) this.writeEnv(repo, name2, { EXAMPLE_KEY: "value" });
        spawnSync5(exe("sops"), ["--input-type", "dotenv", "--output-type", "dotenv", relative3(repo, f)], { cwd: repo, env: env(), stdio: "inherit" });
      },
      status(repo, m2) {
        const pub = publicKey(), recs = recipients(repo);
        kv("age key", contract(keyFile()) + (existsSync12(keyFile()) ? "" : red("  missing")));
        kv("recipient", pub && recs.includes(pub) ? green("yes") : red("no \u2014 cs enroll " + m2.name));
        const names = {};
        const md = join12(repo, "machines");
        if (existsSync12(md)) for (const d3 of readdirSync4(md)) {
          const pf = join12(md, d3, "age.pub");
          if (existsSync12(pf)) names[readFileSync11(pf, "utf8").trim()] = d3;
        }
        kv("recipients", recs.map((r2) => names[r2] ?? r2.slice(0, 14) + "\u2026").join(", ") || "-");
        kv("files", envFiles(repo).map((f) => relative3(repo, f)).join(", ") || "-");
      }
    };
  }
});

// src/secrets/none.ts
var none_exports = {};
__export(none_exports, {
  NoneBackend: () => NoneBackend
});
var no, NoneBackend;
var init_none = __esm({
  "src/secrets/none.ts"() {
    "use strict";
    init_ui();
    no = () => {
      throw new Error("cs: secrets backend 'none' cannot store secrets");
    };
    NoneBackend = {
      name: "none",
      async init() {
        info(`secrets backend is 'none' \u2014 set [secrets].backend = "sops" in machine.toml to enable`);
      },
      ready: () => true,
      loadEnv: () => ({}),
      writeEnv: no,
      edit: no,
      status: () => info("backend none")
    };
  }
});

// src/secrets/index.ts
import { join as join13 } from "node:path";
async function getBackend(m2) {
  if (m2.secretsBackend === "sops") return (await Promise.resolve().then(() => (init_sops(), sops_exports))).SopsBackend;
  if (m2.secretsBackend === "none") return (await Promise.resolve().then(() => (init_none(), none_exports))).NoneBackend;
  throw new Error(`cs: unknown secrets backend '${m2.secretsBackend}' (sops | none)`);
}
function parseDotenv(text2) {
  const out2 = {};
  for (let line of text2.split("\n")) {
    line = line.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    let [k3, ...rest] = line.split("=");
    let v2 = rest.join("=").trim();
    k3 = k3.trim().replace(/^export\s+/, "");
    if (v2.length >= 2 && v2[0] === '"' && v2[v2.length - 1] === '"') {
      try {
        v2 = JSON.parse(v2);
      } catch {
        v2 = v2.slice(1, -1);
      }
    } else if (v2.length >= 2 && v2[0] === "'" && v2[v2.length - 1] === "'") v2 = v2.slice(1, -1);
    out2[k3] = v2;
  }
  return out2;
}
var envFile, dumpDotenv;
var init_secrets = __esm({
  "src/secrets/index.ts"() {
    "use strict";
    envFile = (repo, name2) => name2 === "global" ? join13(repo, "secrets", "global.env") : join13(repo, "secrets", "projects", `${name2}.env`);
    dumpDotenv = (v2) => Object.entries(v2).map(([k3, val]) => `${k3}=${/[ #"'\\$`]/.test(val) || val === "" ? JSON.stringify(val) : val}`).join("\n") + (Object.keys(v2).length ? "\n" : "");
  }
});

// src/secretscmd.ts
var secretscmd_exports = {};
__export(secretscmd_exports, {
  diff: () => diff,
  edit: () => edit,
  enroll: () => enroll,
  environment: () => environment,
  exec: () => exec,
  get: () => get,
  init: () => init,
  pull: () => pull,
  push: () => push,
  recovery: () => recovery,
  revoke: () => revoke,
  setValues: () => setValues,
  status: () => status,
  unsetValues: () => unsetValues
});
import { chmodSync as chmodSync6, existsSync as existsSync13, mkdirSync as mkdirSync9, readdirSync as readdirSync5, readFileSync as readFileSync12, writeFileSync as writeFileSync9, rmSync as rmSync4 } from "node:fs";
import { join as join14, relative as relative4 } from "node:path";
import { spawnSync as spawnSync6 } from "node:child_process";
async function init(repo, m2, interactive = true) {
  await (await getBackend(m2)).init(repo, m2, interactive);
  return 0;
}
async function status(repo, m2) {
  info(bold(`secrets backend: ${m2.secretsBackend}`));
  (await getBackend(m2)).status(repo, m2);
  return 0;
}
async function edit(repo, m2, name2) {
  (await getBackend(m2)).edit(repo, name2);
  commitSecrets(repo, m2, `secrets: edit ${name2}`);
  return 0;
}
async function setValues(repo, m2, name2, pairs) {
  const b3 = await getBackend(m2);
  const v2 = b3.loadEnv(repo, name2);
  for (const p2 of pairs) {
    const i = p2.indexOf("=");
    if (i < 1) throw new Error(`cs: expected KEY=VALUE, got '${p2}'`);
    v2[p2.slice(0, i).trim()] = p2.slice(i + 1);
  }
  b3.writeEnv(repo, name2, v2);
  commitSecrets(repo, m2, `secrets: set ${pairs.length} value(s) in ${name2}`);
  ok(`${name2}: ${pairs.map((p2) => p2.split("=")[0]).join(", ")} stored (encrypted)`);
  return 0;
}
async function unsetValues(repo, m2, name2, keys) {
  const b3 = await getBackend(m2);
  const v2 = b3.loadEnv(repo, name2);
  for (const k3 of keys) delete v2[k3];
  b3.writeEnv(repo, name2, v2);
  commitSecrets(repo, m2, `secrets: unset ${keys.length} value(s) in ${name2}`);
  return 0;
}
async function get(repo, m2, name2, key, show) {
  const v2 = (await getBackend(m2)).loadEnv(repo, name2);
  if (key) {
    if (!(key in v2)) return 1;
    console.log(show ? v2[key] : mask(v2[key]));
    return 0;
  }
  for (const [k3, val] of Object.entries(v2)) console.log(`${k3}=${show ? val : mask(val)}`);
  return 0;
}
async function pull(repo, m2, man, project, force) {
  const p2 = man.projects[project];
  if (!p2) throw new Error(`cs: unknown project '${project}'`);
  const v2 = (await getBackend(m2)).loadEnv(repo, project);
  if (!Object.keys(v2).length) {
    warn(`no secrets stored for ${project} (cs secrets push ${project} / cs secrets set ${project} K=V)`);
    return 1;
  }
  const root = checkoutRoot(p2, workspace(man, m2)), target = join14(root, ".env"), text2 = dumpDotenv(v2);
  if (existsSync13(target) && readFileSync12(target, "utf8") !== text2 && !force) {
    fail(`${contract(target)} exists and differs \u2014 cs secrets diff ${project}; use --force to overwrite`);
    return 1;
  }
  writeFileSync9(target, text2);
  chmodSync6(target, 384);
  checkIgnored(root, target);
  ok(`wrote ${contract(target)} (${Object.keys(v2).length} keys)`);
  return 0;
}
async function push(repo, m2, man, project) {
  const p2 = man.projects[project];
  if (!p2) throw new Error(`cs: unknown project '${project}'`);
  const root = checkoutRoot(p2, workspace(man, m2)), src = join14(root, ".env");
  if (!existsSync13(src)) throw new Error(`cs: ${contract(src)} not found`);
  const v2 = parseDotenv(readFileSync12(src, "utf8"));
  (await getBackend(m2)).writeEnv(repo, project, v2);
  commitSecrets(repo, m2, `secrets: ${project} .env`);
  checkIgnored(root, src);
  ok(`${project}: ${Object.keys(v2).length} keys encrypted into ${contract(envFile(repo, project))}`);
  return 0;
}
async function diff(repo, m2, man, project) {
  const p2 = man.projects[project];
  if (!p2) throw new Error(`cs: unknown project '${project}'`);
  const stored = (await getBackend(m2)).loadEnv(repo, project);
  const lf = join14(checkoutRoot(p2, workspace(man, m2)), ".env");
  const local = existsSync13(lf) ? parseDotenv(readFileSync12(lf, "utf8")) : {};
  const rows = [.../* @__PURE__ */ new Set([...Object.keys(stored), ...Object.keys(local)])].sort().filter((k3) => stored[k3] !== local[k3]).map((k3) => [k3, k3 in stored ? mask(stored[k3]) : dim("-"), k3 in local ? mask(local[k3]) : dim("-")]);
  if (rows.length) {
    table(rows, ["key", "stored", "local .env"]);
    return 1;
  }
  ok("no differences");
  return 0;
}
async function environment(repo, m2, man, project, warnMissing = true) {
  const env2 = { ...process.env };
  if (env2.CS_SECRETS_LOADED === "1") return env2;
  const b3 = await getBackend(m2);
  if (b3.name !== "none" && !b3.ready(repo)) {
    if (warnMissing) warn("secrets not available on this machine (cs secrets init / cs enroll) \u2014 continuing without them");
    return env2;
  }
  Object.assign(env2, b3.loadEnv(repo, "global"));
  if (project) Object.assign(env2, b3.loadEnv(repo, project));
  env2.CS_SECRETS_LOADED = "1";
  return env2;
}
async function exec(repo, m2, man, project, cmd) {
  if (!cmd.length) throw new Error("cs: secrets exec needs a command after --");
  project ??= projectForPath(man, m2, process.cwd())?.name;
  const env2 = await environment(repo, m2, man, project);
  const p2 = spawnSync6(cmd[0], cmd.slice(1), { stdio: "inherit", env: env2 });
  return p2.status ?? 1;
}
function enroll(repo, m2, machine) {
  const pf = machinePubFile(repo, machine);
  if (!existsSync13(pf)) throw new Error(`cs: ${contract(pf)} not found \u2014 run cs secrets init on ${machine} and cs sync on both sides first`);
  const pub = readFileSync12(pf, "utf8").trim();
  const recs = recipients(repo);
  if (recs.includes(pub)) {
    ok(`${machine} is already a recipient`);
    return 0;
  }
  writeRecipients(repo, [...recs, pub]);
  const n = updatekeys(repo);
  git(["add", "-A", ".sops.yaml", "secrets"], repo);
  commit(repo, `secrets: enroll ${machine}`, "cs", `cs@${m2.name}`);
  ok(`enrolled ${machine}; re-encrypted ${n} file(s). Run cs sync here, then cs sync on ${machine}.`);
  return 0;
}
async function revoke(repo, m2, machine) {
  const pf = machinePubFile(repo, machine);
  const pub = existsSync13(pf) ? readFileSync12(pf, "utf8").trim() : "";
  const recs = recipients(repo);
  if (pub && recs.includes(pub)) {
    writeRecipients(repo, recs.filter((r2) => r2 !== pub));
    const n = updatekeys(repo);
    rmSync4(join14(repo, "machines", machine), { recursive: true, force: true });
    git(["add", "-A", ".sops.yaml", "secrets", "machines"], repo);
    commit(repo, `secrets: revoke ${machine}`, "cs", `cs@${m2.name}`);
    ok(`revoked ${machine}; re-encrypted ${n} file(s)`);
  } else warn(`${machine} was not a recipient`);
  const b3 = await getBackend(m2);
  const keys = /* @__PURE__ */ new Set();
  for (const name2 of ["global", ...Object.keys(man_projects(repo))]) for (const k3 of Object.keys(b3.loadEnv(repo, name2))) keys.add(k3);
  if (keys.size) warn("that machine could read these \u2014 rotate them at the source: " + [...keys].sort().join(", "));
  return 0;
}
function man_projects(repo) {
  const d3 = join14(repo, "secrets", "projects");
  const out2 = {};
  if (existsSync13(d3)) {
    for (const f of readdirSync5(d3)) if (f.endsWith(".env")) out2[f.slice(0, -4)] = true;
  }
  return out2;
}
function recovery(repo, m2) {
  const tmp = join14(home(), ".cache", `cs-recovery-${process.pid}.txt`);
  const exe2 = which("age-keygen") || join14(home(), ".local", "bin", "age-keygen");
  const p2 = spawnSync6(exe2, ["-o", tmp], { encoding: "utf8" });
  if (p2.status !== 0) throw new Error("cs: age-keygen failed");
  const text2 = readFileSync12(tmp, "utf8");
  rmSync4(tmp, { force: true });
  const pub = text2.split("\n").find((l2) => l2.startsWith("# public key:")).split(":")[1].trim();
  const priv = text2.split("\n").find((l2) => l2.startsWith("AGE-SECRET-KEY-"));
  const pf = machinePubFile(repo, "recovery");
  mkdirSync9(join14(repo, "machines", "recovery"), { recursive: true });
  writeFileSync9(pf, pub + "\n");
  writeRecipients(repo, [...recipients(repo), pub]);
  const n = updatekeys(repo);
  git(["add", "-A", ".sops.yaml", "secrets", "machines/recovery"], repo);
  commit(repo, "secrets: recovery recipient", "cs", `cs@${m2.name}`);
  ok(`recovery recipient added; re-encrypted ${n} file(s)`);
  note([priv, "", dim("On a bare machine: write it to ~/.config/sops/age/keys.txt, run cs secrets init, enroll the machine's own key, delete it.")], "Store this in your password manager now \u2014 it is not saved anywhere else");
  return 0;
}
var mask, commitSecrets, checkIgnored;
var init_secretscmd = __esm({
  "src/secretscmd.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_deps();
    init_manifest();
    init_secrets();
    init_sops();
    init_ui();
    mask = (v2) => v2.length > 8 ? v2.slice(0, 3) + "\u2026" + v2.slice(-2) : "\u2026";
    commitSecrets = (repo, m2, msg) => {
      if (isRepo(repo) && isDirty(repo)) {
        git(["add", "-A", "secrets"], repo);
        commit(repo, msg, "cs", `cs@${m2.name}`);
      }
    };
    checkIgnored = (root, f) => {
      if (isRepo(root) && git(["check-ignore", "-q", f], root, { check: false }).code !== 0) warn(`${relative4(root, f)} is NOT gitignored in ${contract(root)} \u2014 add it to .gitignore`);
    };
  }
});

// src/hooks.ts
var hooks_exports = {};
__export(hooks_exports, {
  installHooks: () => installHooks,
  installTimer: () => installTimer,
  runHooks: () => runHooks
});
import { existsSync as existsSync14, mkdirSync as mkdirSync10, readFileSync as readFileSync13, unlinkSync as unlinkSync4, writeFileSync as writeFileSync10 } from "node:fs";
import { join as join15 } from "node:path";
import { spawnSync as spawnSync7 } from "node:child_process";
function installHooks(repo, m2, remove = false) {
  const f = join15(repo, "claude", "settings.base.json");
  const data = existsSync14(f) ? loads(readFileSync13(f, "utf8")) : {};
  data.hooks ??= {};
  let changed = false;
  for (const [ev, es] of Object.entries(entries())) {
    const cur = (data.hooks[ev] ?? []).filter((e2) => !ours(e2));
    const next = remove ? cur : [...cur, ...es];
    if (JSON.stringify(next) !== JSON.stringify(data.hooks[ev] ?? [])) {
      data.hooks[ev] = next;
      changed = true;
    }
    if (!data.hooks[ev]?.length) delete data.hooks[ev];
  }
  if (!Object.keys(data.hooks).length) delete data.hooks;
  if (changed) {
    writeFileSync10(f, dumps(data));
    git(["add", f], repo);
    commit(repo, `claude: ${remove ? "remove" : "install"} cs sync hooks`, "cs", `cs@${m2.name}`);
  }
  return changed;
}
function installTimer(remove = false) {
  mkdirSync10(stateDir(), { recursive: true });
  const log = join15(stateDir(), "timer.log");
  if (isMac()) {
    const plist = join15(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist");
    if (remove) {
      spawnSync7("launchctl", ["unload", plist]);
      if (existsSync14(plist)) unlinkSync4(plist);
      return "launchd agent removed";
    }
    mkdirSync10(join15(home(), "Library", "LaunchAgents"), { recursive: true });
    writeFileSync10(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>dev.claude-share.sync</string>
<key>ProgramArguments</key><array><string>/bin/sh</string><string>-lc</string><string>cs sync --quiet</string></array>
<key>StartInterval</key><integer>900</integer>
<key>StandardOutPath</key><string>${log}</string>
<key>StandardErrorPath</key><string>${log}</string>
</dict></plist>
`);
    spawnSync7("launchctl", ["unload", plist]);
    const p2 = spawnSync7("launchctl", ["load", plist], { encoding: "utf8" });
    return "launchd agent every 15 min" + (p2.status === 0 ? "" : ` (load failed: ${p2.stderr?.trim()})`);
  }
  const d3 = join15(home(), ".config", "systemd", "user");
  const svc = join15(d3, "cs-sync.service"), tmr = join15(d3, "cs-sync.timer");
  if (remove) {
    spawnSync7("systemctl", ["--user", "disable", "--now", "cs-sync.timer"]);
    for (const f of [svc, tmr]) if (existsSync14(f)) unlinkSync4(f);
    return "systemd timer removed";
  }
  mkdirSync10(d3, { recursive: true });
  writeFileSync10(svc, `[Unit]
Description=claude-share sync

[Service]
Type=oneshot
ExecStart=/bin/sh -lc 'cs sync --quiet'
StandardOutput=append:${log}
StandardError=append:${log}
`);
  writeFileSync10(tmr, "[Unit]\nDescription=claude-share sync every 15 min\n\n[Timer]\nOnBootSec=2min\nOnUnitActiveSec=15min\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n");
  const r2 = spawnSync7("systemctl", ["--user", "daemon-reload"], { encoding: "utf8" });
  if (r2.status !== 0) return `systemd --user unavailable (${r2.stderr?.trim()}); timer files written, not enabled`;
  const e2 = spawnSync7("systemctl", ["--user", "enable", "--now", "cs-sync.timer"], { encoding: "utf8" });
  return "systemd user timer every 15 min" + (e2.status === 0 ? "" : ` (enable failed: ${e2.stderr?.trim()})`);
}
function runHooks(repo, m2, action, timer = true) {
  if (action === "status") {
    const f = join15(repo, "claude", "settings.base.json");
    const data = existsSync14(f) ? loads(readFileSync13(f, "utf8")) : {};
    const have = Object.entries(data.hooks ?? {}).filter(([, es]) => es.some(ours)).map(([ev]) => ev);
    kv("hooks", have.length ? have.join(", ") : dim("not installed"));
    const active = isMac() ? existsSync14(join15(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist")) : spawnSync7("systemctl", ["--user", "is-active", "cs-sync.timer"], { encoding: "utf8" }).stdout?.trim() === "active";
    kv("timer", active ? green("active") : dim("not active"));
    const last = join15(stateDir(), "last-config");
    kv("last sync", existsSync14(last) ? readFileSync13(last, "utf8").trim() : dim("never"));
    return 0;
  }
  const remove = action === "remove";
  installHooks(repo, m2, remove) ? ok(`${remove ? "removed" : "installed"} Claude Code hooks in claude/settings.base.json (run cs apply)`) : skip(`hooks already ${remove ? "absent" : "present"}`);
  if (timer) ok(installTimer(remove));
  return 0;
}
var STOP, START, entries, ours;
var init_hooks = __esm({
  "src/hooks.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_platform();
    init_jsonmerge();
    init_ui();
    STOP = "command -v cs >/dev/null 2>&1 && cs sync --push-only --quiet --debounce 120 || true";
    START = "command -v cs >/dev/null 2>&1 && cs sync --pull-only --quiet --timeout 5 || true";
    entries = () => ({
      Stop: [{ hooks: [{ type: "command", command: STOP, async: true, timeout: 120 }] }],
      SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: START, timeout: 15 }] }]
    });
    ours = (e2) => (e2.hooks ?? []).some((h2) => String(h2.command ?? "").includes("cs sync"));
  }
});

// src/projects.ts
var projects_exports = {};
__export(projects_exports, {
  add: () => add2,
  clone: () => clone,
  create: () => create
});
import { existsSync as existsSync15, mkdirSync as mkdirSync11, writeFileSync as writeFileSync11 } from "node:fs";
import { basename as basename2, dirname as dirname7, join as join16, relative as relative5, resolve as resolve5 } from "node:path";
import { spawnSync as spawnSync8 } from "node:child_process";
function add2(repo, m2, man, path, o2) {
  const ws = workspace(man, m2);
  let target = resolve5(path ?? process.cwd());
  let layout = "plain";
  const top = o2.kind !== "local" ? toplevel(target) : void 0;
  if (top) {
    target = top;
    if (basename2(top) === "repo" && dirname7(top) !== ws) {
      target = dirname7(top);
      layout = "worktrees";
    }
  }
  const rel = relative5(ws, target);
  if (!rel || rel.startsWith("..") || rel.includes("/")) throw new Error(`cs: project must be a direct child of the workspace ${contract(ws)} (got ${target})`);
  const name2 = o2.name ?? rel;
  const checkout = layout === "worktrees" ? join16(target, "repo") : target;
  let kind = o2.kind ?? (isRepo(checkout) && remoteUrl(checkout) ? "git" : isRepo(checkout) ? "git" : "synced");
  let url = "", branch = "", identity = o2.identity ?? "";
  if (kind === "git") {
    url = remoteUrl(checkout);
    if (!url) throw new Error(`cs: ${checkout} has no origin remote; use --kind synced or push it first`);
    if (url.includes("github")) url = canonicalGithub(url);
    branch = currentBranch(checkout);
    if (!identity) {
      const i = identityForUrl(man, url);
      if (!i) throw new Error(`cs: no identity matches ${url}; pass --identity or add url_globs in projects.toml`);
      identity = i.id;
    }
  }
  const p2 = { name: name2, kind, path: rel !== name2 ? rel : void 0, url, identity, profiles: o2.profiles.length ? o2.profiles : ["all"], machines: [], branch, layout, description: o2.description, handoff: {}, sync: {} };
  const errs = validate({ ...man, projects: { [name2]: p2 } });
  if (errs.length) throw new Error("cs: " + errs.join("; "));
  appendProject(repo, p2);
  ok(`registered ${name2} (${kind}${url ? ", " + url : ""}) profiles=${p2.profiles.join(",")}`);
  if (!o2.noCommit && isRepo(repo)) {
    git(["add", "projects.toml"], repo);
    commit(repo, `projects: add ${name2}`, "cs", `cs@${m2.name}`);
  }
  return p2;
}
function clone(repo, m2, man, names, dryRun = false) {
  const ws = workspace(man, m2);
  let rc = 0;
  const cloned = [];
  for (const p2 of selectedProjects(man, m2)) {
    if (names.length && !names.includes(p2.name)) continue;
    const root = checkoutRoot(p2, ws), cont = container(p2, ws);
    if (existsSync15(root)) {
      if (p2.kind === "git" && isRepo(root) && p2.url && canonicalGithub(remoteUrl(root)) !== canonicalGithub(p2.url)) {
        fail(`${p2.name}: exists with a different remote (${remoteUrl(root)}); not touching it`);
        rc = 1;
      }
      continue;
    }
    if (p2.kind === "local") {
      info(`${p2.name}: local-only, skipped`);
      continue;
    }
    if (p2.kind === "synced") {
      step(`${p2.name}: ${p2.url ? "clone " + p2.url : "mkdir"} \u2192 ${contract(root)}`);
      if (!dryRun) {
        if (p2.url) git(["clone", "-q", p2.url, root]);
        else mkdirSync11(root, { recursive: true });
        cloned.push(p2.name);
      }
      continue;
    }
    step(`${p2.name}: git clone ${p2.url} \u2192 ${contract(root)}`);
    if (dryRun) continue;
    mkdirSync11(cont, { recursive: true });
    let r2 = git(["clone", "-q", ...p2.branch ? ["-b", p2.branch] : [], p2.url, root], void 0, { check: false });
    if (r2.code !== 0 && p2.branch && /Remote branch .* not found/.test(r2.err)) {
      r2 = git(["clone", "-q", p2.url, root], void 0, { check: false });
      if (r2.code === 0) warn(`${p2.name}: branch '${p2.branch}' does not exist on the remote; cloned its default '${currentBranch(root)}' \u2014 fix projects.toml`);
    }
    if (r2.code !== 0) {
      fail(`${p2.name}: ${r2.err.split("\n").pop()}`);
      rc = 1;
      continue;
    }
    const ident2 = p2.identity ? man.identities[p2.identity] : void 0;
    const email2 = configGet(root, "user.email");
    if (ident2 && email2 !== ident2.email) {
      warn(`${p2.name}: user.email resolved to '${email2 || "UNSET"}' \u2014 setting per-repo identity as fallback`);
      git(["config", "user.name", ident2.name], root);
      git(["config", "user.email", ident2.email], root);
    }
    if (p2.postClone) spawnSync8("bash", ["-lc", p2.postClone], { cwd: cont, stdio: "inherit" });
    cloned.push(p2.name);
  }
  if (cloned.length) runLink(repo, m2, man, cloned);
  return rc;
}
async function create(repo, m2, man, name2, ident2, o2) {
  if (!NAME_RE.test(name2)) throw new Error(`cs: '${name2}' is not a valid project name`);
  if (man.projects[name2]) throw new Error(`cs: project '${name2}' is already registered`);
  const ws = workspace(man, m2), root = join16(ws, name2), branch = man.defaultBranch, owner2 = ident2.owner, kind = o2.kind ?? "git";
  if (kind === "git" && !owner2 && !o2.noGithub) throw new Error(`cs: identity '${ident2.id}' has no owner in projects.toml`);
  const url = owner2 ? `git@github.com:${owner2}/${name2}.git` : "";
  intro(`new project ${bold(name2)}`);
  kv("identity", `${ident2.id}  ${dim(`${ident2.name} <${ident2.email}>`)}`);
  kv("path", contract(root));
  if (kind === "git") {
    kv("remote", url || dim("(none)"));
    kv("branch", branch);
  }
  kv("profiles", o2.profiles.join(", "));
  mkdirSync11(root, { recursive: true });
  if (!isRepo(root)) {
    git(["init", "-q", "-b", branch], root);
    step(`git init -b ${branch}`);
  }
  if (kind === "git" && !o2.noGithub && url) {
    try {
      const token2 = await ensureToken(owner2);
      const created = await spin(`creating ${owner2}/${name2} on GitHub\u2026`, async () => ensureRepo(owner2, name2, token2, o2.priv !== false, o2.description ?? ""));
      created ? step(`github: created ${owner2}/${name2}  ${dim(o2.priv !== false ? "private" : "public")}`) : skip(`github: ${owner2}/${name2} already exists`);
    } catch (e2) {
      fail(e2.message);
      if (String(e2.message).includes(" 403")) info("fine-grained token needs: Repository access = All repositories, Administration = Read and write (edit the token on GitHub)");
      return 1;
    }
  }
  if (kind === "git" && url) {
    const cur = remoteUrl(root);
    if (!cur) {
      git(["remote", "add", "origin", url], root);
      step(`remote origin  ${dim(url)}`);
    } else if (canonicalGithub(cur) !== canonicalGithub(url)) {
      fail(`${root} already has origin ${cur}`);
      return 1;
    }
  }
  const email2 = configGet(root, "user.email");
  if (email2 !== ident2.email) {
    if (url) warn(`git identity resolved to '${email2 || "UNSET"}' (expected ${ident2.email}); setting it per-repo. Run cs apply to fix globally.`);
    else info(`no remote: git identity set per-repo (${ident2.email})`);
    git(["config", "user.name", ident2.name], root);
    git(["config", "user.email", ident2.email], root);
    git(["config", "core.sshCommand", `ssh -i ${contract(expand(keyPath(ident2)))} -o IdentitiesOnly=yes`], root);
  }
  if (!out(["rev-parse", "--verify", "-q", "HEAD"], root)) {
    if (!existsSync15(join16(root, "README.md"))) writeFileSync11(join16(root, "README.md"), `# ${name2}

${o2.description ?? ""}`.trimEnd() + "\n");
    if (!existsSync15(join16(root, ".gitignore"))) writeFileSync11(join16(root, ".gitignore"), ".DS_Store\n*:Zone.Identifier\n.env\n");
    git(["add", "-A"], root);
    commit(root, "init", ident2.name, ident2.email);
    step(`first commit on ${branch}  ${dim(`${ident2.name} <${ident2.email}>`)}`);
  }
  if (kind === "git" && url && !o2.noGithub && !aheadBehind(root)) {
    const r2 = await spin("pushing\u2026", async () => git(["push", "-q", "-u", "origin", branch], root, { check: false, timeout: 60 }));
    if (r2.code !== 0) {
      fail(r2.err.split("\n").pop() ?? "push failed");
      return 1;
    }
    step(`pushed ${branch} to ${owner2}/${name2}`);
  }
  const p2 = { name: name2, kind: kind === "git" && !url ? "local" : kind, url: kind === "git" ? url : "", identity: kind === "git" ? ident2.id : "", profiles: o2.profiles, machines: [], branch: kind === "git" ? branch : "", layout: "plain", description: o2.description, handoff: {}, sync: {} };
  appendProject(repo, p2);
  if (isRepo(repo)) {
    git(["add", "projects.toml"], repo);
    commit(repo, `projects: add ${name2}`, "cs", `cs@${m2.name}`);
  }
  step(`registered in projects.toml  ${dim(`${p2.kind}, profiles ${o2.profiles.join(",")}`)}`);
  setQuiet(true);
  runLink(repo, m2, loadManifest(repo), [name2]);
  setQuiet(false);
  step("Claude files linked (memory \u2192 config repo)");
  outro(bold(`cd ${contract(root)} && claude`));
  return 0;
}
var init_projects = __esm({
  "src/projects.ts"() {
    "use strict";
    init_git();
    init_github();
    init_paths();
    init_manifest();
    init_link();
    init_ui();
    init_paths();
  }
});

// src/init.ts
var init_exports = {};
__export(init_exports, {
  CONFIG_REPO_NAME: () => CONFIG_REPO_NAME,
  PHASES: () => PHASES,
  init: () => init2,
  newConfigRepo: () => newConfigRepo
});
import { copyFileSync as copyFileSync4, existsSync as existsSync16, mkdirSync as mkdirSync12, readdirSync as readdirSync6, writeFileSync as writeFileSync12 } from "node:fs";
import { dirname as dirname8, join as join17, relative as relative6 } from "node:path";
function newConfigRepo(dest, branch = "master") {
  const src = templatesDir() + "/config-repo";
  mkdirSync12(dest, { recursive: true });
  const copy = (d3) => {
    for (const e2 of readdirSync6(d3, { withFileTypes: true })) {
      const f = join17(d3, e2.name), t = join17(dest, relative6(src, f));
      if (e2.isDirectory()) {
        mkdirSync12(t, { recursive: true });
        copy(f);
      } else if (!existsSync16(t)) {
        mkdirSync12(dirname8(t), { recursive: true });
        copyFileSync4(f, t);
      }
    }
  };
  copy(src);
  for (const d3 of ["plans", "projects", "secrets", "claude/skills", "claude/rules", "claude/agents", "machines"]) {
    mkdirSync12(join17(dest, d3), { recursive: true });
    if (!readdirSync6(join17(dest, d3)).length) writeFileSync12(join17(dest, d3, ".gitkeep"), "");
  }
  if (!isRepo(dest)) git(["init", "-q", "-b", branch], dest);
  git(["add", "-A"], dest);
  if (isDirty(dest) || !out(["rev-parse", "--verify", "-q", "HEAD"], dest)) commit(dest, "claude-share config skeleton");
  return dest;
}
async function accessLoop(sshUrl, gh, interactive, machine) {
  const { pub, created } = ensureKey(machine);
  if (created) step(`master key generated  ${dim(KEY)}`);
  let [ok2, err] = await spin("checking access to the config repo\u2026", async () => canAccess(sshUrl));
  let tries = 0;
  while (!ok2) {
    instructions(pub, gh, machine);
    if (!interactive) throw new Error("cs: config repo not reachable with the master key (see instructions above)");
    if (!await proceed("added the key?", "Done \u2014 check access", "Abort") || tries++ >= 10) throw new Error("cs: aborted \u2014 config repo not reachable");
    [ok2, err] = await spin("checking access\u2026", async () => canAccess(sshUrl));
    if (!ok2) warn(`still no access \u2014 ${err}`);
  }
  step("config repo reachable with the master key");
}
async function cloneConfig(sshUrl, target) {
  mkdirSync12(dirname8(target), { recursive: true });
  await spin("cloning the config repo\u2026", async () => git(["clone", "-q", sshUrl, target], void 0, { sshKey: keyPath2() }));
  configureRepo(target);
  step(`config repo cloned to ${dim(contract(target))}`);
}
async function askUrl(prompt) {
  for (; ; ) {
    const raw = await text(prompt, { placeholder: "https://github.com/<owner>/claude-share-config", validate: (v2) => v2.trim() ? void 0 : "a URL is required" });
    const [sshUrl, gh] = parseRepoUrl(raw);
    if (gh) {
      const vis = await spin("looking up the repository\u2026", async () => isPublic(httpsUrl(...gh)));
      if (vis === true) step(`${gh[0]}/${gh[1]} found (public)`);
      else if (vis === false) step(`${gh[0]}/${gh[1]} found (private) \u2014 access via the master key`);
      else {
        warn(`${gh[0]}/${gh[1]} not found or unreachable`);
        if (!await confirm("use this URL anyway?", false)) continue;
      }
    }
    return [sshUrl, gh];
  }
}
async function join_(target, interactive, machine, repoUrl = "") {
  if (existsSync16(target) && isRepo(target)) {
    skip(`config repo already at ${contract(target)}`);
    configureRepo(target);
    return;
  }
  const [sshUrl, gh] = repoUrl ? parseRepoUrl(repoUrl) : await askUrl("config repo URL");
  await accessLoop(sshUrl, gh, interactive, machine);
  await cloneConfig(sshUrl, target);
}
async function create2(target, interactive, machine) {
  const n = await text("name for your new config repo", { default: CONFIG_REPO_NAME, validate: name });
  note([cyan("https://github.com/new"), dim("no README, no .gitignore, no license \u2014 completely empty")], `Create an empty PRIVATE repository named '${n}' on GitHub`);
  const [sshUrl, gh] = await askUrl("paste the new repo's URL");
  await accessLoop(sshUrl, gh, interactive, machine);
  newConfigRepo(target);
  if (!remoteUrl(target)) git(["remote", "add", "origin", sshUrl], target);
  configureRepo(target);
  await spin("pushing the initial config repo\u2026", async () => git(["push", "-q", "-u", "origin", currentBranch(target)], target));
  step(`config repo initialized and pushed  ${dim(sshUrl)}`);
}
async function machineName(existingName, interactive) {
  if (machineExists()) return existingName || loadMachine().name;
  if (existingName) return existingName;
  if (!interactive) throw new Error("cs: --name <machine-name> is required");
  const dflt = { wsl2: "desktop", macos: "laptop" }[describe()] ?? "machine";
  return text("What should this machine be called?", { default: dflt, placeholder: "desktop-work, laptop, \u2026", validate: name });
}
async function machinePhase(repo, nm, profiles, ws, interactive) {
  if (machineExists()) {
    const m3 = loadMachine();
    let changed = false;
    if (nm && m3.name !== nm) {
      m3.name = nm;
      changed = true;
    }
    if (profiles.length && JSON.stringify(m3.profiles) !== JSON.stringify(profiles)) {
      m3.profiles = profiles;
      changed = true;
    }
    if (ws && m3.workspace !== ws) {
      m3.workspace = ws;
      changed = true;
    }
    if (changed) {
      saveMachine(m3);
      step("machine settings updated");
    } else skip(`machine ${m3.name}  ${m3.profiles.join(", ")}`);
    return m3;
  }
  const md = join17(repo, "machines");
  const existing = existsSync16(md) ? readdirSync6(md, { withFileTypes: true }).filter((d3) => d3.isDirectory() && d3.name !== "recovery").map((d3) => d3.name).sort() : [];
  if (existing.length) step(`machines already in this share: ${existing.map((x2) => bold(x2)).join(", ")}`);
  while (existing.includes(nm)) {
    if (!interactive) throw new Error(`cs: machine '${nm}' already exists in the share`);
    if (await confirm(`'${nm}' already exists \u2014 re-use it (its published keys will be replaced)?`, false)) break;
    nm = await text("name for this machine", { validate: name });
  }
  let exclude = [];
  if (!profiles.length) {
    let projects = [];
    try {
      projects = Object.values(loadManifest(repo).projects);
    } catch {
    }
    if (interactive && projects.length) {
      const groups = {};
      for (const p2 of projects) {
        const g2 = p2.profiles.includes("all") ? "every machine" : p2.profiles.join(", ");
        (groups[g2] ??= []).push({ value: p2.name, label: p2.name, hint: p2.kind === "git" ? `${p2.identity} \xB7 ${p2.url?.replace(/^git@github\.com:/, "").replace(/\.git$/, "")}` : p2.kind });
      }
      const names = new Set(projects.map((p2) => p2.name));
      const picked = new Set((await groupMultiselect("Which projects should this machine clone and sync?", groups, projects.map((p2) => p2.name))).filter((v2) => names.has(v2)));
      profiles = [...new Set(projects.filter((p2) => picked.has(p2.name)).flatMap((p2) => p2.profiles).filter((x2) => x2 !== "all"))].sort();
      if (!profiles.length) profiles = ["personal"];
      exclude = projects.filter((p2) => !picked.has(p2.name) && (p2.profiles.includes("all") || p2.profiles.some((x2) => profiles.includes(x2)))).map((p2) => p2.name);
      step(`${picked.size} of ${projects.length} projects selected  ${dim("profiles " + profiles.join(", ") + (exclude.length ? " \xB7 not here: " + exclude.join(", ") : ""))}`);
    } else if (interactive) profiles = (await text("profiles for this machine (comma list \u2014 project groups it should get)", { default: "personal" })).split(",").map((x2) => x2.trim()).filter(Boolean);
    else profiles = ["personal"];
  }
  let workspaceOverride = ws;
  if (ws === void 0 && interactive) {
    let dws = "~/dev";
    try {
      dws = loadManifest(repo).workspaceRoot;
    } catch {
    }
    const choice = await select("Where should your projects live on this machine?", [
      { value: "default", label: `${dws}  (recommended)`, hint: existsSync16(expand(dws)) ? "exists" : "will be created" },
      { value: "custom", label: "Somewhere else\u2026", hint: "any absolute path or ~/\u2026" }
    ]);
    let w2 = dws;
    if (choice === "custom") {
      w2 = await text("project root", { default: dws, validate: (v2) => v2.startsWith("~") || v2.startsWith("/") ? void 0 : "use an absolute path or ~/\u2026" });
      if (w2.startsWith(home() + "/")) w2 = "~/" + w2.slice(home().length + 1);
      if (isWSL() && expand(w2).startsWith("/mnt/")) {
        warn("that is the Windows filesystem \u2014 git and Claude are far slower there; ~/dev inside WSL is recommended");
        if (!await confirm("use it anyway?", false)) w2 = dws;
      }
    }
    const existed = existsSync16(expand(w2));
    mkdirSync12(expand(w2), { recursive: true });
    step(`projects live in ${bold(w2)}${existed ? "" : dim("  (created)")}`);
    workspaceOverride = w2 === dws ? void 0 : w2;
  } else if (ws) mkdirSync12(expand(ws), { recursive: true });
  const m2 = { name: nm, profiles, exclude, workspace: workspaceOverride, secretsBackend: "sops" };
  saveMachine(m2);
  return m2;
}
async function firstIdentity(repo, m2, interactive) {
  const man = loadManifest(repo);
  if (Object.keys(man.identities).length) return;
  if (!interactive) {
    warn("no identities yet \u2014 add one with cs identity add <id> --owner <owner> --name .. --email ..");
    return;
  }
  section("first identity");
  info("an identity = a GitHub owner (your login or an org) + the name and email you commit with there");
  const id = await text("identity id", { default: "personal", validate: name });
  const own = await text("GitHub owner (your login or an org)", { validate: owner });
  const nm = await text("git user.name", { validate: (v2) => v2 ? void 0 : "required" });
  const em = await text("git user.email", { validate: email });
  await add(repo, m2, man, id, { owner: own, name: nm, email: em, noToken: true });
}
async function keysAndTokens(repo, m2, interactive, skip2) {
  const full = loadManifest(repo);
  if (!Object.keys(full.identities).length) return;
  const used = new Set(selectedProjects(full, m2).map((p2) => p2.identity).filter(Boolean));
  const man = used.size ? { ...full, identities: Object.fromEntries(Object.entries(full.identities).filter(([id]) => used.has(id))) } : full;
  const skipped = Object.keys(full.identities).filter((id) => !(id in man.identities));
  if (skipped.length) skip(`identities not needed by the selected projects: ${skipped.join(", ")}`);
  if (!skip2.includes("ssh")) {
    section("identity ssh keys");
    const ssh = await Promise.resolve().then(() => (init_ssh(), ssh_exports));
    let rc = await ssh.setup(repo, m2, man);
    let tries = 0;
    while (rc !== 0 && interactive && tries++ < 5) {
      if (!await proceed("added the key(s) on GitHub?", "Done \u2014 verify", "Skip for now")) break;
      rc = await ssh.setup(repo, m2, man, true);
    }
  }
  if (interactive) {
    const missing = Object.values(man.identities).filter((i) => i.owner && !getToken(i.owner));
    if (missing.length) {
      section("GitHub tokens");
      info("a token per owner lets cs new --<id> create repos \u2014 optional now, cs token set <owner> later");
      for (const i of missing) if (await confirm(`store a token for ${i.owner} (identity ${i.id}) now?`, false)) {
        try {
          await ensureToken(i.owner);
          ok(`token for ${i.owner} stored`);
        } catch (e2) {
          warn(e2.message);
        }
      }
    }
  }
}
function push2(repo) {
  if (!remoteUrl(repo)) return;
  const ab = aheadBehind(repo);
  if (ab === void 0 || ab[0]) {
    const r2 = git(["push", "-q", "-u", "origin", currentBranch(repo)], repo, { check: false, timeout: 60 });
    r2.code === 0 ? ok("config repo pushed") : fail(`push failed: ${r2.err}`);
  }
}
async function finish(repo, m2, interactive, skip2) {
  const man = loadManifest(repo);
  if (!skip2.includes("apply")) await group("~/.claude applied", () => runApply(repo, m2, man), { done: "already up to date" });
  if (!skip2.includes("link")) await group("project files linked", () => runLink(repo, m2, man), { done: "already in sync" });
  if (!skip2.includes("secrets") && m2.secretsBackend !== "none") await group("secrets", async () => (await Promise.resolve().then(() => (init_secretscmd(), secretscmd_exports))).init(repo, m2, interactive));
  if (!skip2.includes("hooks")) await group("automatic sync", async () => {
    (await Promise.resolve().then(() => (init_hooks(), hooks_exports))).runHooks(repo, m2, "install");
    runApply(repo, m2, loadManifest(repo));
  });
  await group("config repo", () => push2(repo), { done: "nothing to push" });
  let rc = 0;
  if (!skip2.includes("doctor")) rc = await group("doctor", () => runDoctor(repo, m2, man, false, true), { done: "all checks passed" });
  const ws = workspace(man, m2);
  const missing = selectedProjects(man, m2).filter((p2) => p2.kind !== "local" && !existsSync16(checkoutRoot(p2, ws)));
  if (missing.length && interactive && await confirm(`clone ${missing.length} project(s) now (${missing.slice(0, 6).map((p2) => p2.name).join(", ")}${missing.length > 6 ? "\u2026" : ""})?`, true)) await group(`${missing.length} project(s) cloned`, async () => (await Promise.resolve().then(() => (init_projects(), projects_exports))).clone(repo, m2, man, []));
  outro(bold("done") + "  " + dim("open a new terminal (claude() wrapper) \xB7 cs status \xB7 cs new <project> --<identity>"));
  return rc;
}
async function init2(o2) {
  const skip2 = o2.skip ?? [];
  for (const x2 of skip2) if (!PHASES.includes(x2)) throw new Error(`cs: unknown phase '${x2}' (phases: ${PHASES.join(", ")})`);
  const interactive = o2.interactive ?? (isTTY() || isScripted());
  const target = repoDirDefault();
  const localSrc = o2.repo && !/:\/\/|^git@/.test(o2.repo) ? expand(o2.repo) : void 0;
  intro("claude-share setup");
  if (!skip2.includes("deps")) await group("prerequisites", () => runDeps(o2.installDeps, true));
  const nm = await machineName(o2.name ?? "", interactive);
  const already = existsSync16(target) && isRepo(target);
  if (already) {
    skip(`config repo already at ${contract(target)}`);
    if (remoteUrl(target)) configureRepo(target);
  } else if (!skip2.includes("repo")) {
    if (localSrc) {
      if (!(isRepo(localSrc) || isBare(localSrc))) throw new Error(`cs: ${localSrc} is not a git repo`);
      mkdirSync12(dirname8(target), { recursive: true });
      git(["clone", "-q", localSrc, target]);
      ok(`config repo cloned from ${contract(localSrc)}`);
    } else if (o2.repo) {
      const [sshUrl, gh] = parseRepoUrl(o2.repo);
      if (o2.key) {
        mkdirSync12(dirname8(target), { recursive: true });
        git(["clone", "-q", sshUrl, target], void 0, { sshKey: expand(o2.key) });
        git(["config", "core.sshCommand", `ssh -i ${contract(expand(o2.key))} -o IdentitiesOnly=yes`], target);
      } else {
        await accessLoop(sshUrl, gh, interactive, nm);
        await cloneConfig(sshUrl, target);
      }
    } else if (o2.owner) {
      const token2 = await ensureToken(o2.owner, interactive);
      const url = `git@github.com:${o2.owner}/${CONFIG_REPO_NAME}.git`;
      if (await ensureRepo(o2.owner, CONFIG_REPO_NAME, token2, true, "claude-share config (private)")) {
        ok(`created private repo ${o2.owner}/${CONFIG_REPO_NAME}`);
        newConfigRepo(target);
        git(["remote", "add", "origin", url], target);
        await accessLoop(url, [o2.owner, CONFIG_REPO_NAME], interactive, nm);
        configureRepo(target);
      } else {
        await accessLoop(url, [o2.owner, CONFIG_REPO_NAME], interactive, nm);
        await cloneConfig(url, target);
      }
    } else if (interactive) {
      const choice = await select("What would you like to do?", [{ value: "join", label: "Join an existing share", hint: "you already have a config repo (from another machine)" }, { value: "create", label: "Create a new share", hint: "first machine, no config repo yet" }]);
      if (choice === "create") await create2(target, true, nm);
      else await join_(target, true, nm);
    } else throw new Error("cs: pass --repo <url|path> or --owner <github-owner>, or run cs init in a terminal");
  }
  const m2 = await machinePhase(target, nm, o2.profiles ?? [], o2.workspace, interactive);
  await firstIdentity(target, m2, interactive);
  await keysAndTokens(target, m2, interactive, skip2);
  return finish(target, m2, interactive, skip2);
}
var CONFIG_REPO_NAME, PHASES, owner, email, name;
var init_init = __esm({
  "src/init.ts"() {
    "use strict";
    init_git();
    init_github();
    init_master();
    init_paths();
    init_platform();
    init_config();
    init_manifest();
    init_apply();
    init_link();
    init_doctor();
    init_deps();
    init_identity();
    init_ui();
    CONFIG_REPO_NAME = "claude-share-config";
    PHASES = ["deps", "repo", "ssh", "apply", "link", "secrets", "hooks", "doctor"];
    owner = (v2) => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(v2) ? void 0 : "a GitHub login, e.g. octocat";
    email = (v2) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v2) ? void 0 : "not an email address";
    name = (v2) => NAME_RE.test(v2) ? void 0 : "letters, digits, . _ - only";
  }
});

// src/adopt.ts
var adopt_exports = {};
__export(adopt_exports, {
  adoptMcp: () => adoptMcp,
  adoptMemory: () => adoptMemory,
  adoptProjectFiles: () => adoptProjectFiles,
  candidatePaths: () => candidatePaths,
  claudeProjectKey: () => claudeProjectKey,
  envVarName: () => envVarName,
  runAdopt: () => runAdopt,
  unionLines: () => unionLines
});
import { copyFileSync as copyFileSync5, existsSync as existsSync17, mkdirSync as mkdirSync13, readdirSync as readdirSync7, readFileSync as readFileSync14, writeFileSync as writeFileSync13 } from "node:fs";
import { basename as basename3, dirname as dirname9, extname, join as join18, relative as relative7 } from "node:path";
function candidatePaths(p2, ws) {
  const c = [container(p2, ws), checkoutRoot(p2, ws), ...checkouts(p2, ws)];
  return [...new Set(c)];
}
function walkFiles(dir) {
  const out2 = [];
  const rec = (d3) => {
    for (const e2 of readdirSync7(d3, { withFileTypes: true })) {
      const f = join18(d3, e2.name);
      e2.isDirectory() ? rec(f) : out2.push(f);
    }
  };
  if (existsSync17(dir)) rec(dir);
  return out2.sort();
}
function adoptMemory(repo, p2, ws, machine, check = false) {
  const dest = memoryDir(repo, p2);
  let n = 0;
  for (const cand of candidatePaths(p2, ws)) {
    const src = join18(claudeDir(), "projects", claudeProjectKey(cand), "memory");
    if (!existsSync17(src)) continue;
    info(`${p2.name}: adopting memory from ${contract(src)}`);
    for (const f of walkFiles(src)) {
      const rel = relative7(src, f);
      const target = join18(dest, rel);
      if (!existsSync17(target)) {
        step(`+ ${rel}`);
        if (!check) {
          mkdirSync13(dirname9(target), { recursive: true });
          copyFileSync5(f, target);
        }
        n++;
      } else if (readFileSync14(target).equals(readFileSync14(f))) continue;
      else if (basename3(rel) === "MEMORY.md") {
        step(`~ ${rel} (union)`);
        if (!check) writeFileSync13(target, unionLines(readFileSync14(target, "utf8"), readFileSync14(f, "utf8")));
        n++;
      } else {
        const alt = join18(dirname9(target), `${basename3(rel, extname(rel))}.from-${machine}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}${extname(rel)}`);
        step(`? ${rel} differs \u2192 ${basename3(alt)}`);
        if (!check) copyFileSync5(f, alt);
        n++;
      }
    }
    if (!check) writeFileSync13(join18(dirname9(src), "memory.adopted-by-cs"), `adopted into ${contract(dest)} on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}
`);
  }
  if (!n) ok(`${p2.name}: no new memory to adopt`);
  return n;
}
function adoptProjectFiles(repo, p2, ws, check = false) {
  const ch = syncProject(repo, p2, ws, check);
  for (const c of ch) step(`${p2.name}: ${c}`);
  if (!ch.length) ok(`${p2.name}: nothing to adopt`);
  return ch.length;
}
function envVarName(server, key) {
  const st = server.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  let kt = key.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  if (st.length && kt.length && kt[0] === st[0]) kt = kt.slice(1);
  return [...st, ...kt].join("_");
}
function localScope(p2, ws) {
  if (!existsSync17(claudeJson())) return {};
  const data = JSON.parse(readFileSync14(claudeJson(), "utf8"));
  const found = {};
  for (const cand of candidatePaths(p2, ws)) for (const [n, cfg] of Object.entries(data.projects?.[cand]?.mcpServers ?? {})) found[n] ??= cfg;
  return found;
}
function adoptMcp(repo, p2, ws, check = false, show = false) {
  const found = localScope(p2, ws);
  if (show) {
    for (const [n, cfg] of Object.entries(found)) {
      for (const [k3, v2] of Object.entries(cfg.env ?? {})) console.log(`${envVarName(n, k3)}=${v2}`);
      for (const [k3, v2] of Object.entries(cfg.headers ?? {})) console.log(`${envVarName(n, k3)}=${v2}`);
    }
    return Object.keys(found).length;
  }
  if (!Object.keys(found).length) {
    ok(`${p2.name}: no local-scope MCP servers in ~/.claude.json`);
    return 0;
  }
  const side = sideStore(repo, p2);
  const f = join18(side, ".mcp.json");
  const existing = existsSync17(f) ? loads(readFileSync14(f, "utf8")) : { mcpServers: {} };
  existing.mcpServers ??= {};
  const secrets = {};
  for (const [name2, orig] of Object.entries(found)) {
    const cfg = JSON.parse(JSON.stringify(orig));
    for (const k3 of Object.keys(cfg.env ?? {})) {
      secrets[envVarName(name2, k3)] = cfg.env[k3];
      cfg.env[k3] = "${" + envVarName(name2, k3) + "}";
    }
    for (const k3 of Object.keys(cfg.headers ?? {})) {
      secrets[envVarName(name2, k3)] = cfg.headers[k3];
      cfg.headers[k3] = "${" + envVarName(name2, k3) + "}";
    }
    delete cfg.oauth;
    if (JSON.stringify(existing.mcpServers[name2]) === JSON.stringify(cfg)) continue;
    step(`${p2.name}: .mcp.json \u2190 ${name2} (${cfg.type ?? "stdio"})`);
    existing.mcpServers[name2] = cfg;
  }
  if (!check) {
    mkdirSync13(join18(side, ".claude"), { recursive: true });
    writeFileSync13(f, dumps(existing));
    const sl = join18(side, ".claude", "settings.local.json");
    const sd = existsSync17(sl) ? loads(readFileSync14(sl, "utf8")) : {};
    sd.enabledMcpjsonServers = [.../* @__PURE__ */ new Set([...sd.enabledMcpjsonServers ?? [], ...Object.keys(existing.mcpServers)])].sort();
    writeFileSync13(sl, dumps(sd));
  }
  if (Object.keys(secrets).length) {
    warn(`${p2.name}: values replaced by \${VAR} placeholders \u2014 store them: cs secrets set global ${Object.keys(secrets).map((k3) => `${k3}=\u2026`).join(" ")}  (full values: cs adopt mcp ${p2.name} --show)`);
  }
  return Object.keys(found).length;
}
function runAdopt(repo, m2, man, what, names, check, show) {
  const ws = workspace(man, m2);
  if (!names.length) throw new Error("cs: adopt needs a project name (or --all)");
  for (const n of names) {
    const p2 = man.projects[n];
    if (!p2) throw new Error(`cs: unknown project '${n}'`);
    if (what === "memory") adoptMemory(repo, p2, ws, m2.name, check);
    else if (what === "project") adoptProjectFiles(repo, p2, ws, check);
    else if (what === "mcp") adoptMcp(repo, p2, ws, check, show);
    else throw new Error(`cs: unknown adopt target '${what}'`);
  }
}
var claudeProjectKey, unionLines;
var init_adopt = __esm({
  "src/adopt.ts"() {
    "use strict";
    init_paths();
    init_manifest();
    init_link();
    init_jsonmerge();
    init_ui();
    claudeProjectKey = (p2) => p2.replace(/[^A-Za-z0-9]/g, "-");
    unionLines = (a, b3) => {
      const lines = a.split("\n").filter((x2, i, arr) => !(i === arr.length - 1 && x2 === ""));
      const seen = new Set(lines);
      for (const l2 of b3.split("\n")) if (l2 && !seen.has(l2)) {
        lines.push(l2);
        seen.add(l2);
      }
      return lines.join("\n") + "\n";
    };
  }
});

// src/sync.ts
var sync_exports = {};
__export(sync_exports, {
  gitSync: () => gitSync,
  runSync: () => runSync
});
import { closeSync, existsSync as existsSync18, mkdirSync as mkdirSync14, openSync, readFileSync as readFileSync15, statSync as statSync5, unlinkSync as unlinkSync5, writeFileSync as writeFileSync14 } from "node:fs";
import { join as join19 } from "node:path";
function tryLock(label) {
  mkdirSync14(stateDir(), { recursive: true });
  try {
    return openSync(lockFile(label), "wx");
  } catch {
    try {
      if (Date.now() - statSync5(lockFile(label)).mtimeMs > 10 * 60 * 1e3) {
        unlinkSync5(lockFile(label));
        return openSync(lockFile(label), "wx");
      }
    } catch {
    }
    return void 0;
  }
}
function gitSync(repo, label, machine, o2 = {}) {
  if (!isRepo(repo)) {
    warn(`${label}: not a git repo (${contract(repo)})`);
    return false;
  }
  const timeout = o2.timeout ?? 20;
  if (existsSync18(marker(label)) && !o2.resolve) {
    fail(`${label}: sync blocked by an earlier conflict \u2014 ${readFileSync15(marker(label), "utf8").trim()}`);
    return false;
  }
  const fd = tryLock(label);
  if (fd === void 0) {
    info(`${label}: another sync is running, skipping`);
    return true;
  }
  try {
    if (!o2.pullOnly && isDirty(repo)) {
      const n = dirtyCount(repo);
      git(["add", "-A"], repo);
      commit(repo, `sync(${machine}): ${n} file(s) ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ")}`, "cs", `cs@${machine}`);
      step(`${label}: committed ${n} change(s)`);
    }
    if (!remoteUrl(repo)) {
      ok(`${label}: no remote configured; local only`);
      return true;
    }
    const f = git(["fetch", "-q", "--prune", "origin"], repo, { check: false, timeout });
    if (f.code !== 0) {
      warn(`${label}: offline or fetch timed out; will push later`);
      writeFileSync14(join19(stateDir(), `last-${label}`), "offline\n");
      return true;
    }
    const branch = currentBranch(repo);
    if (!branch) {
      fail(`${label}: detached HEAD; refusing to sync`);
      return false;
    }
    if (!out(["rev-parse", "--abbrev-ref", "@{upstream}"], repo)) {
      if (out(["rev-parse", "--verify", "-q", `origin/${branch}`], repo)) git(["branch", "-q", `--set-upstream-to=origin/${branch}`, branch], repo);
      else if (!o2.pullOnly) {
        git(["push", "-q", "-u", "origin", branch], repo, { timeout });
        ok(`${label}: pushed new branch ${branch}`);
        return true;
      } else return true;
    }
    let [ahead, behind] = aheadBehind(repo) ?? [0, 0];
    if (behind && !o2.pushOnly) {
      if (!ahead) {
        git(["merge", "-q", "--ff-only", "@{upstream}"], repo);
        step(`${label}: fast-forwarded ${behind} commit(s)`);
      } else {
        const args = ["rebase", "-q", ...o2.resolve === "ours" ? ["-X", "theirs"] : o2.resolve === "theirs" ? ["-X", "ours"] : [], "@{upstream}"];
        const r2 = git(args, repo, { check: false });
        if (r2.code !== 0) {
          const conflicts = out(["diff", "--name-only", "--diff-filter=U"], repo).split("\n").filter(Boolean).join(", ");
          git(["rebase", "--abort"], repo, { check: false });
          writeFileSync14(marker(label), `conflict in: ${conflicts || "unknown"}
`);
          error(`${label}: conflict in ${conflicts}`, "", `keep mine: cs sync --resolve ours \xB7 keep theirs: cs sync --resolve theirs \xB7 manual: cd ${contract(repo)} && git rebase origin/${branch}`);
          return false;
        }
        step(`${label}: rebased ${ahead} local commit(s) onto ${behind} remote commit(s)`);
      }
    }
    if (existsSync18(marker(label))) unlinkSync5(marker(label));
    if (!o2.pullOnly) {
      const ab = aheadBehind(repo);
      if (ab && ab[0]) {
        const pr = git(["push", "-q", "origin", branch], repo, { check: false, timeout });
        if (pr.code !== 0) {
          warn(`${label}: push rejected, retrying once`);
          unlock(label, fd);
          return gitSync(repo, label, machine, o2);
        }
        ok(`${label}: pushed ${ab[0]} commit(s)`);
      }
    }
    writeFileSync14(join19(stateDir(), `last-${label}`), (/* @__PURE__ */ new Date()).toISOString() + "\n");
    return true;
  } finally {
    try {
      unlock(label, fd);
    } catch {
    }
  }
}
function runSync(repo, m2, man, o2 = {}) {
  const ws = workspace(man, m2);
  let rc = 0;
  if (o2.debounce) {
    const last = join19(stateDir(), "last-config");
    if (existsSync18(last) && Date.now() - statSync5(last).mtimeMs < o2.debounce * 1e3) return 0;
  }
  const before = out(["rev-parse", "HEAD"], repo);
  if (!o2.pullOnly) {
    for (const p2 of selectedProjects(man, m2)) if (checkouts(p2, ws).length) syncProject(repo, p2, ws);
  }
  if (!gitSync(repo, "config", m2.name, o2)) rc = 2;
  const after = out(["rev-parse", "HEAD"], repo);
  if (after !== before || o2.pullOnly) {
    const changed = before ? out(["diff", "--name-only", before, after], repo) : "";
    if (o2.pullOnly || changed.split("\n").some((x2) => x2.startsWith("claude/") || x2.startsWith("projects.toml") || x2.startsWith("plans/"))) runApply(repo, m2, man);
    runLink(repo, m2, loadManifest(repo));
  }
  if (o2.projects !== false && !o2.pullOnly) {
    for (const p2 of selectedProjects(man, m2)) if (p2.kind === "synced") {
      const root = checkoutRoot(p2, ws);
      if (existsSync18(root) && isRepo(root) && !gitSync(root, p2.name, m2.name, { timeout: o2.timeout })) rc = 2;
    }
  }
  return rc;
}
var marker, lockFile, unlock;
var init_sync = __esm({
  "src/sync.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_manifest();
    init_apply();
    init_link();
    init_ui();
    marker = (label) => join19(stateDir(), `blocked-${label}`);
    lockFile = (label) => join19(stateDir(), `sync-${label}.lock`);
    unlock = (label, fd) => {
      closeSync(fd);
      try {
        unlinkSync5(lockFile(label));
      } catch {
      }
    };
  }
});

// src/status.ts
var status_exports = {};
__export(status_exports, {
  runStatus: () => runStatus
});
import { existsSync as existsSync19, readdirSync as readdirSync8, readFileSync as readFileSync16 } from "node:fs";
import { join as join20 } from "node:path";
function repoState(path, fetch2) {
  if (!isRepo(path)) return ["", dim("not a git repo"), false];
  if (fetch2) git(["fetch", "-q", "--prune"], path, { check: false, timeout: 15 });
  const branch = currentBranch(path) || red("DETACHED");
  const dirty = dirtyCount(path);
  const ab = aheadBehind(path);
  const bits = [];
  let attention = false;
  if (dirty) {
    bits.push(yellow(`${dirty} dirty`));
    attention = true;
  }
  if (ab) {
    if (ab[0]) {
      bits.push(yellow(`\u2191${ab[0]} unpushed`));
      attention = true;
    }
    if (ab[1]) bits.push(cyan(`\u2193${ab[1]} behind`));
  } else if (!branch.includes("DETACHED")) bits.push(dim("no upstream"));
  if (!bits.length) bits.push(green("clean"));
  return [branch, bits.join("  "), attention];
}
function runStatus(repo, m2, man, fetch2 = false, showAll = false) {
  const ws = workspace(man, m2);
  info(`${bold(m2.name)}  ${dim("profiles")} ${m2.profiles.join(", ")}  ${dim("workspace")} ${contract(ws)}`);
  const [branch, state] = repoState(repo, fetch2);
  const mk = join20(stateDir(), "blocked-config");
  table([[bold("config repo"), branch, state + (existsSync19(mk) ? "  " + red("BLOCKED: " + readFileSync16(mk, "utf8").trim()) : "")]]);
  let rc = 0;
  const rows = [];
  const known = /* @__PURE__ */ new Set();
  for (const p2 of Object.values(man.projects)) {
    known.add(p2.path || p2.name);
    const sel = selected(p2, m2);
    if (!sel && !showAll) continue;
    const root = checkoutRoot(p2, ws);
    const kind = dim(p2.kind + (p2.layout === "worktrees" ? " \u2442" : ""));
    if (!sel) {
      rows.push([p2.name, kind, "", dim("skipped (profile)")]);
      continue;
    }
    if (!existsSync19(root)) {
      rows.push([p2.name, kind, "", red("missing") + dim("  cs clone")]);
      rc = 1;
      continue;
    }
    if (p2.kind === "git" && isRepo(root)) {
      let [b3, s, att] = repoState(root, fetch2);
      const url = remoteUrl(root);
      if (p2.url && canonicalGithub(url) !== canonicalGithub(p2.url)) {
        s += "  " + red(`remote\u2260manifest (${url})`);
        att = true;
      }
      const ident2 = p2.identity ? man.identities[p2.identity] : void 0;
      const email2 = configGet(root, "user.email");
      if (ident2 && email2 && email2 !== ident2.email) {
        s += "  " + red(`identity ${email2}`);
        att = true;
      } else if (ident2 && !email2) {
        s += "  " + red("identity unset");
        att = true;
      }
      if (p2.layout === "worktrees") s += "  " + dim(`${worktrees(root).length} worktrees`);
      if (att) rc = 1;
      rows.push([p2.name, kind, b3, s]);
    } else rows.push([p2.name, kind, "", green("present")]);
  }
  table(rows, ["project", "kind", "branch", "state"]);
  const unreg = existsSync19(ws) ? readdirSync8(ws, { withFileTypes: true }).filter((d3) => d3.isDirectory() && !d3.name.startsWith(".") && !known.has(d3.name)).map((d3) => d3.name).sort() : [];
  if (unreg.length) warn("unregistered under workspace: " + unreg.join(", ") + dim("   (cs add <path>)"));
  return rc;
}
var init_status = __esm({
  "src/status.ts"() {
    "use strict";
    init_git();
    init_paths();
    init_manifest();
    init_ui();
  }
});

// node_modules/commander/esm.mjs
var import_index = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  // deprecated old name
  Command,
  Argument,
  Option,
  Help
} = import_index.default;

// src/index.ts
init_ui();
init_platform();
init_config();
init_manifest();
init_paths();
init_git();
import { existsSync as existsSync20, readdirSync as readdirSync9 } from "node:fs";
import { join as join21 } from "node:path";
var pkg = JSON.parse((await import("node:fs")).readFileSync(join21(toolRoot(), "package.json"), "utf8"));
var csv = (s) => s ? s.split(",").map((x2) => x2.trim()).filter(Boolean) : [];
function ctx() {
  const m2 = loadMachine();
  const repo = repoDir(m2);
  return { repo, m: m2, man: loadManifest(repo) };
}
var program2 = new Command("cs").description("claude-share: projects + Claude Code setup in sync across machines").version(pkg.version, "-V, --version").option("-q, --quiet", "only warnings/errors").configureHelp({ sortSubcommands: false }).showSuggestionAfterError(true).enablePositionalOptions().addHelpText("after", `
examples:
  cs init                                  set this machine up (wizard: join or create a share)
  cs new billing-api --personal            new project: dir, git, GitHub repo, first push, Claude wired in
  cs                                       dashboard: config repo + every project
  cs sync                                  push/pull the config repo (memory, plans, settings)
  cs identity add acme --owner acme-org --name "Me" --email me@acme.com
  cs secrets set global API_TOKEN=\u2026        encrypted, available to Claude's MCP servers as \${API_TOKEN}`);
program2.hook("preAction", (_root, cmd) => setQuiet(Boolean(program2.opts().quiet || cmd.opts().quiet)));
program2.command("init").description("set this machine up (wizard) \u2014 or --repo <url> / --owner <owner> for scripts").option("--repo <url>", "existing config repo: git URL or local path").option("--owner <owner>", "GitHub user/org to create claude-share-config under").option("--key <path>", "ssh key for cloning --repo (instead of the master key)").option("--non-interactive").option("--name <name>", "machine name").option("--profiles <list>", "comma list").option("--workspace <path>").option("--skip <phases>", "comma list: deps,repo,ssh,apply,link,secrets,hooks,doctor").option("--install-deps").action(async (o2) => {
  const { init: init3 } = await Promise.resolve().then(() => (init_init(), init_exports));
  process.exitCode = await init3({ repo: o2.repo, owner: o2.owner, key: o2.key, name: o2.name, profiles: csv(o2.profiles), workspace: o2.workspace, skip: csv(o2.skip), installDeps: o2.installDeps, interactive: !o2.nonInteractive && (isTTY() || isScripted()) });
});
var config = program2.command("config").description("manage the config repo");
config.command("new <path>").description("create a config repo skeleton").action(async (p2) => {
  const { newConfigRepo: newConfigRepo2 } = await Promise.resolve().then(() => (init_init(), init_exports));
  const { expand: expand2, contract: contract3 } = await Promise.resolve().then(() => (init_paths(), paths_exports));
  const d3 = newConfigRepo2(expand2(p2));
  ok(`config repo created at ${contract3(d3)} \u2014 edit projects.toml, then cs init --repo ${contract3(d3)}`);
});
config.command("path").description("print the config repo path").action(() => console.log(repoDir(loadMachine())));
program2.command("apply").description("render ~/.claude + git identity includes from the config repo").option("--check", "report drift, change nothing").action(async (o2) => {
  const { repo, m: m2, man } = ctx();
  const { runApply: runApply2 } = await Promise.resolve().then(() => (init_apply(), apply_exports));
  process.exitCode = o2.check && runApply2(repo, m2, man, true).length ? 1 : 0;
});
program2.command("link [names...]").description("sync Claude files between side-store and project checkouts").option("--check").action(async (names, o2) => {
  const { repo, m: m2, man } = ctx();
  const { runLink: runLink2 } = await Promise.resolve().then(() => (init_link(), link_exports));
  process.exitCode = o2.check && runLink2(repo, m2, man, names, true) ? 1 : 0;
});
program2.command("adopt <what> [names...]").description("pull existing local state into the config repo (memory | project | mcp)").option("--all").option("--check").option("--show", "(mcp) print the secret values").action(async (what, names, o2) => {
  const { repo, m: m2, man } = ctx();
  const { runAdopt: runAdopt2 } = await Promise.resolve().then(() => (init_adopt(), adopt_exports));
  const { selectedProjects: selectedProjects2 } = await Promise.resolve().then(() => (init_manifest(), manifest_exports));
  runAdopt2(repo, m2, man, what, names.length ? names : o2.all ? selectedProjects2(man, m2).map((p2) => p2.name) : [], o2.check, o2.show);
});
program2.command("sync").description("commit / pull --rebase / push the config repo (+ synced projects)").option("--pull-only").option("--push-only").option("--timeout <s>", "", "20").option("--resolve <ours|theirs>").option("--no-projects").option("--debounce <s>", "skip if a sync ran less than N seconds ago", "0").option("-q, --quiet").action(async (o2) => {
  const { repo, m: m2, man } = ctx();
  const { runSync: runSync2 } = await Promise.resolve().then(() => (init_sync(), sync_exports));
  process.exitCode = runSync2(repo, m2, man, { pullOnly: o2.pullOnly, pushOnly: o2.pushOnly, timeout: +o2.timeout, resolve: o2.resolve, projects: o2.projects, debounce: +o2.debounce });
});
program2.command("status").description("config repo + projects overview").option("--fetch").option("--all").action(async (o2) => {
  const { repo, m: m2, man } = ctx();
  const { runStatus: runStatus2 } = await Promise.resolve().then(() => (init_status(), status_exports));
  process.exitCode = runStatus2(repo, m2, man, o2.fetch, o2.all);
});
program2.command("doctor").description("environment and consistency checks").option("--fix").action(async (o2) => {
  const { repo, m: m2, man } = ctx();
  const { runDoctor: runDoctor2 } = await Promise.resolve().then(() => (init_doctor(), doctor_exports));
  process.exitCode = runDoctor2(repo, m2, man, o2.fix);
});
program2.command("add [path]").description("register a project (default: cwd) in projects.toml").option("--kind <kind>").option("--profiles <list>").option("--identity <id>").option("--name <name>").option("--description <text>", "", "").option("--no-commit").action(async (p2, o2) => {
  const { repo, m: m2, man } = ctx();
  const { add: add3 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
  add3(repo, m2, man, p2, { kind: o2.kind, profiles: csv(o2.profiles), identity: o2.identity, name: o2.name, description: o2.description, noCommit: !o2.commit });
});
program2.command("clone [names...]").description("clone selected projects that are missing on this machine").option("--dry-run").action(async (names, o2) => {
  const { repo, m: m2, man } = ctx();
  const { clone: clone2 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
  process.exitCode = clone2(repo, m2, man, names, o2.dryRun);
});
program2.command("new <name>").description("create a brand-new project: dir, git, GitHub repo, first push, register, link").option("--identity <id>", "identity id (or --<id> / --<github-owner>, e.g. --personal)").option("--profiles <list>").option("-d, --description <text>", "", "").option("--public").option("--no-github").option("--synced").action(async (name2, o2) => {
  const { repo, m: m2, man } = ctx();
  let id = o2.identity;
  if (!id) throw new Error(`cs: which identity? use one of ${Object.keys(man.identities).map((i) => "--" + i).join(", ")} (or --identity <id>)`);
  const ident2 = man.identities[id] ?? identityByFlag(man, id);
  if (!ident2) throw new Error(`cs: unknown identity '${id}'`);
  const profiles = csv(o2.profiles).length ? csv(o2.profiles) : m2.profiles.includes(ident2.id) ? [ident2.id] : [...m2.profiles];
  const { create: create3 } = await Promise.resolve().then(() => (init_projects(), projects_exports));
  process.exitCode = await create3(repo, m2, man, name2, ident2, { profiles, description: o2.description, priv: !o2.public, noGithub: !o2.github, kind: o2.synced ? "synced" : "git" });
});
var token = program2.command("token").description("GitHub API tokens per owner (local, never synced)");
token.command("set <owner>").action(async (o2) => {
  const gh = await Promise.resolve().then(() => (init_github(), github_exports));
  const f = await gh.setToken(o2);
  ok(`token stored in ${(await Promise.resolve().then(() => (init_paths(), paths_exports))).contract(f)} (0600, not synced)`);
});
token.command("check <owner>").action(async (o2) => {
  const gh = await Promise.resolve().then(() => (init_github(), github_exports));
  const t = gh.getToken(o2);
  if (!t) {
    fail(`no token for '${o2}'`);
    process.exitCode = 1;
    return;
  }
  try {
    ok(`token for '${o2}' authenticates as ${await gh.whoami(t)}`);
  } catch (e2) {
    fail(e2.message);
    process.exitCode = 1;
  }
});
token.command("rm <owner>").action(async (o2) => {
  (await Promise.resolve().then(() => (init_github(), github_exports))).rmToken(o2);
  ok("removed");
});
token.command("ls").action(() => {
  const d3 = join21(csConfigDir(), "tokens");
  if (existsSync20(d3)) for (const f of readdirSync9(d3)) console.log(f);
});
var ident = program2.command("identity").description("git identities (who commits, which key, which GitHub owner)");
ident.command("ls", { isDefault: true }).description("list identities").action(async () => {
  const { man } = ctx();
  (await Promise.resolve().then(() => (init_identity(), identity_exports))).ls(man);
});
ident.command("add <id>").requiredOption("--owner <owner>", "GitHub user or org").requiredOption("--name <name>").requiredOption("--email <email>").option("--key <path>").option("--no-token").action(async (id, o2) => {
  const { repo, m: m2, man } = ctx();
  process.exitCode = await (await Promise.resolve().then(() => (init_identity(), identity_exports))).add(repo, m2, man, id, { owner: o2.owner, name: o2.name, email: o2.email, key: o2.key, noToken: !o2.token });
});
ident.command("rename <old> <new>").action(async (a, b3) => {
  const { repo, m: m2, man } = ctx();
  process.exitCode = (await Promise.resolve().then(() => (init_identity(), identity_exports))).rename(repo, m2, man, a, b3);
});
program2.command("ssh [action]").description("per-machine SSH keys: setup | check | master").action(async (action = "check") => {
  const { repo, m: m2, man } = ctx();
  if (action === "master") {
    process.exitCode = await (await Promise.resolve().then(() => (init_master(), master_exports))).setup(repo, isTTY());
    return;
  }
  process.exitCode = await (await Promise.resolve().then(() => (init_ssh(), ssh_exports))).setup(repo, m2, man, action === "check");
});
program2.command("deps").description("check (or install) prerequisites").option("--install").action(async (o2) => {
  process.exitCode = await (await Promise.resolve().then(() => (init_deps(), deps_exports))).runDeps(o2.install);
});
program2.command("hooks [action]").description("automatic sync: install | remove | status").option("--no-timer").action(async (action = "status", o2) => {
  const { repo, m: m2 } = ctx();
  process.exitCode = (await Promise.resolve().then(() => (init_hooks(), hooks_exports))).runHooks(repo, m2, action, o2.timer);
});
program2.command("self-update").description("git pull the cs tool itself").action(() => {
  const root = toolRoot();
  if (!isRepo(root)) {
    fail(`${root} is not a git checkout`);
    process.exitCode = 1;
    return;
  }
  const before = out(["rev-parse", "--short", "HEAD"], root);
  const r2 = git(["pull", "-q", "--ff-only"], root, { check: false, timeout: 60 });
  if (r2.code !== 0) {
    fail(`pull failed: ${r2.err}`);
    process.exitCode = 1;
    return;
  }
  const after = out(["rev-parse", "--short", "HEAD"], root);
  ok(`cs at ${after}${before === after ? "" : ` (was ${before})`}`);
});
var sec = program2.command("secrets").description("encrypted secrets in the config repo (sops + age)").enablePositionalOptions();
var S3 = () => Promise.resolve().then(() => (init_secretscmd(), secretscmd_exports));
sec.command("init").action(async () => {
  const { repo, m: m2 } = ctx();
  await (await S3()).init(repo, m2, isTTY());
});
sec.command("status").action(async () => {
  const { repo, m: m2 } = ctx();
  await (await S3()).status(repo, m2);
});
sec.command("edit <name>").description("global | <project>").action(async (n) => {
  const { repo, m: m2 } = ctx();
  await (await S3()).edit(repo, m2, n);
});
sec.command("set <name> <pairs...>").description("KEY=VALUE \u2026").action(async (n, pairs) => {
  const { repo, m: m2 } = ctx();
  await (await S3()).setValues(repo, m2, n, pairs);
});
sec.command("unset <name> <keys...>").action(async (n, keys) => {
  const { repo, m: m2 } = ctx();
  await (await S3()).unsetValues(repo, m2, n, keys);
});
sec.command("get <name> [key]").option("--show").action(async (n, k3, o2) => {
  const { repo, m: m2 } = ctx();
  process.exitCode = await (await S3()).get(repo, m2, n, k3, o2.show);
});
sec.command("pull <project>").option("--force").action(async (p2, o2) => {
  const { repo, m: m2, man } = ctx();
  process.exitCode = await (await S3()).pull(repo, m2, man, p2, o2.force);
});
sec.command("push <project>").action(async (p2) => {
  const { repo, m: m2, man } = ctx();
  process.exitCode = await (await S3()).push(repo, m2, man, p2);
});
sec.command("diff <project>").action(async (p2) => {
  const { repo, m: m2, man } = ctx();
  process.exitCode = await (await S3()).diff(repo, m2, man, p2);
});
sec.command("exec [command...]").description("run a command with global + project secrets in its environment").option("-p, --project <name>").passThroughOptions().allowUnknownOption().action(async (command, o2) => {
  const { repo, m: m2, man } = ctx();
  const cmd = command[0] === "--" ? command.slice(1) : command;
  process.exitCode = await (await S3()).exec(repo, m2, man, o2.project, cmd);
});
sec.command("recovery").action(async () => {
  const { repo, m: m2 } = ctx();
  (await S3()).recovery(repo, m2);
});
program2.command("enroll <machine>").description("grant another machine access to secrets").action(async (mc) => {
  const { repo, m: m2 } = ctx();
  (await S3()).enroll(repo, m2, mc);
});
program2.command("revoke <machine>").description("remove a machine's access to secrets").action(async (mc) => {
  const { repo, m: m2 } = ctx();
  await (await S3()).revoke(repo, m2, mc);
});
var proj = program2.command("project").description("project helpers");
proj.command("id").description("print the project name for the cwd").action(() => {
  const { m: m2, man } = ctx();
  const p2 = projectForPath(man, m2, process.cwd());
  if (p2) console.log(p2.name);
  else process.exitCode = 1;
});
async function main() {
  refuseUnsupported();
  process.stdout.on("error", (e2) => {
    if (e2?.code === "EPIPE") process.exit(0);
    throw e2;
  });
  const argv = process.argv.slice(2);
  if (argv[0] === "new" && machineExists()) {
    try {
      const { man } = ctx();
      for (let i = 1; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith("--") && !a.includes("=")) {
          const hit = identityByFlag(man, a.slice(2));
          if (hit) argv.splice(i, 1, "--identity", hit.id);
        }
      }
      process.argv = [...process.argv.slice(0, 2), ...argv];
    } catch {
    }
  }
  if (!argv.length) {
    if (machineExists()) {
      const { repo, m: m2, man } = ctx();
      const { runStatus: runStatus2 } = await Promise.resolve().then(() => (init_status(), status_exports));
      runStatus2(repo, m2, man);
      console.log(dim("\ncs --help for commands"));
      return;
    }
    program2.help();
  }
  try {
    await program2.parseAsync(process.argv);
  } catch (e2) {
    const msg = e2?.message ?? String(e2);
    if (msg.startsWith("cs: ")) {
      const [what, ...rest] = msg.slice(4).split("\n");
      error(what, rest.join("\n").trim());
      process.exitCode = 1;
    } else throw e2;
  }
}
main();
/*! Bundled license information:

smol-toml/dist/date.js:
smol-toml/dist/error.js:
smol-toml/dist/util.js:
smol-toml/dist/primitive.js:
smol-toml/dist/extract.js:
smol-toml/dist/struct.js:
smol-toml/dist/parse.js:
smol-toml/dist/stringify.js:
smol-toml/dist/index.js:
  (*!
   * Copyright (c) Squirrel Chat et al., All rights reserved.
   * SPDX-License-Identifier: BSD-3-Clause
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice, this
   *    list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the
   *    documentation and/or other materials provided with the distribution.
   * 3. Neither the name of the copyright holder nor the names of its contributors
   *    may be used to endorse or promote products derived from this software without
   *    specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
   * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
   * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
   * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
   * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
   * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
   * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   *)
*/
